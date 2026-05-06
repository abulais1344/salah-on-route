import { distanceToPathKm, haversineDistanceKm, type GeoPoint } from "@/lib/geo";
import type { GoogleDiscoveredMosque } from "@/types/mosque";

interface PlacesNearbyResult {
  place_id: string;
  name: string;
  vicinity?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
}

interface PlacesNearbyResponse {
  status: string;
  results?: PlacesNearbyResult[];
  next_page_token?: string;
}

interface PlacesFindPlaceCandidate {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
}

interface PlacesFindPlaceResponse {
  status: string;
  candidates?: PlacesFindPlaceCandidate[];
}

interface PlaceDetailsResult {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
}

interface PlaceDetailsResponse {
  status: string;
  result?: PlaceDetailsResult;
}

interface PlacesTextSearchResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: {
    location?: {
      lat: number;
      lng: number;
    };
  };
}

interface PlacesTextSearchResponse {
  status: string;
  results?: PlacesTextSearchResult[];
}

interface CacheEntry {
  expiresAt: number;
  value: GoogleDiscoveredMosque[];
}

interface PlacesQueryCacheEntry {
  expiresAt: number;
  value: PlacesNearbyResult[];
}

const routeDiscoveryCache = new Map<string, CacheEntry>();
const nearbyDiscoveryCache = new Map<string, CacheEntry>();
const placesQueryCache = new Map<string, PlacesQueryCacheEntry>();

const DISCOVERY_CACHE_TTL_MS = 1000 * 60 * 5;
const PLACES_QUERY_CACHE_TTL_MS = 1000 * 60 * 8;
const NEARBY_GRID_METERS = 250;
const NEARBY_MAX_RESULTS = 35;
const ROUTE_POINT_RADIUS_METERS = 2800;
const ROUTE_PLACE_RESULTS_PER_POINT = 20;
const ROUTE_DISTANCE_LIMIT_KM = 3;

export async function resolveMosqueFromGoogleMapsUrl(rawUrl: string) {
  const normalized = rawUrl.trim();
  if (!normalized) {
    return null;
  }

  const parsed = tryParseUrl(normalized);
  if (!parsed) {
    return null;
  }

  if (!isSupportedGoogleMapsHost(parsed.hostname)) {
    return null;
  }

  const expandedUrl = await expandGoogleMapsUrl(parsed.toString());
  const candidateUrl = tryParseUrl(expandedUrl) ?? parsed;
  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  const directPlaceId = extractPlaceIdFromText(`${expandedUrl} ${candidateUrl.search}`);
  if (directPlaceId) {
    const fromDetails = await fetchPlaceByPlaceId(directPlaceId, apiKey);
    if (fromDetails) {
      return fromDetails;
    }
  }

  const nameFromPath = extractNameFromMapsPath(candidateUrl.pathname);
  const coordinatesFromPath = extractCoordinatesFromMapsUrl(expandedUrl);
  const fallbackQueries = [
    nameFromPath && coordinatesFromPath
      ? `${nameFromPath} ${coordinatesFromPath.latitude},${coordinatesFromPath.longitude}`
      : null,
    nameFromPath,
    expandedUrl,
  ].filter((query): query is string => Boolean(query && query.trim().length > 0));

  for (const query of fallbackQueries) {
    const resolved = await findPlaceFromText(query, apiKey, coordinatesFromPath);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

export async function searchMosquesByName(
  query: string,
  options?: { center?: GeoPoint; radiusKm?: number; limit?: number },
) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("query", `${trimmed} mosque`);

  if (options?.center) {
    url.searchParams.set("location", `${options.center.latitude},${options.center.longitude}`);
    const radiusMeters = Math.max(1000, Math.min(50000, Math.floor((options.radiusKm ?? 20) * 1000)));
    url.searchParams.set("radius", String(radiusMeters));
  }

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as PlacesTextSearchResponse;
  if (payload.status === "REQUEST_DENIED") {
    throw new Error(
      "Google Places request denied. Use GOOGLE_MAPS_SERVER_API_KEY without HTTP referrer restriction for server-side discovery.",
    );
  }

  if (payload.status !== "OK" || !payload.results) {
    return [];
  }

  const limit = Math.min(12, Math.max(1, options?.limit ?? 6));
  return payload.results.slice(0, limit).flatMap((result) => {
    const latitude = result.geometry?.location?.lat;
    const longitude = result.geometry?.location?.lng;

    if (!result.place_id || typeof latitude !== "number" || typeof longitude !== "number") {
      return [];
    }

    return [{
      placeId: result.place_id,
      name: result.name,
      latitude,
      longitude,
      address: result.formatted_address || "Address unavailable",
      distanceFromRouteKm: options?.center
        ? haversineDistanceKm(options.center, { latitude, longitude })
        : 0,
    }];
  });
}

export async function searchNearbyMosques(center: GeoPoint, radiusKm: number) {
  const key = `nearby:${toGridKey(center, NEARBY_GRID_METERS)}:${toRadiusBucket(radiusKm, 0.5)}`;
  const cached = nearbyDiscoveryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const placesResults = await fetchNearbyPlacesFromGoogle({
    center,
    radiusMeters: Math.min(50000, Math.max(1000, Math.floor(radiusKm * 1000))),
    maxResults: NEARBY_MAX_RESULTS,
  });

  const deduped = new Map<string, GoogleDiscoveredMosque>();

  for (const result of placesResults) {
    const latitude = result.geometry?.location?.lat;
    const longitude = result.geometry?.location?.lng;

    if (!result.place_id || typeof latitude !== "number" || typeof longitude !== "number") {
      continue;
    }

    const distanceKm = haversineDistanceKm(
      center,
      { latitude, longitude },
    );

    if (distanceKm > radiusKm) {
      continue;
    }

    const existing = deduped.get(result.place_id);
    if (existing && existing.distanceFromRouteKm <= distanceKm) {
      continue;
    }

    deduped.set(result.place_id, {
      placeId: result.place_id,
      name: result.name,
      latitude,
      longitude,
      address: result.vicinity || "Address unavailable",
      distanceFromRouteKm: distanceKm,
    });
  }

  const mosques = [...deduped.values()].sort(
    (first, second) => first.distanceFromRouteKm - second.distanceFromRouteKm,
  );

  nearbyDiscoveryCache.set(key, {
    value: mosques,
    expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS,
  });

  return mosques;
}

export async function searchMosquesAlongRoute(routePath: GeoPoint[]) {
  const key = getRouteCacheKey(routePath);
  const cached = routeDiscoveryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey || routePath.length === 0) {
    return [];
  }

  const samplePoints = getRouteSamplePoints(routePath);
  const deduped = new Map<string, GoogleDiscoveredMosque>();

  for (const point of samplePoints) {
    const placesResults = await fetchNearbyPlacesFromGoogle({
      center: point,
      radiusMeters: ROUTE_POINT_RADIUS_METERS,
      maxResults: ROUTE_PLACE_RESULTS_PER_POINT,
    });

    for (const result of placesResults) {
      const latitude = result.geometry?.location?.lat;
      const longitude = result.geometry?.location?.lng;

      if (!result.place_id || typeof latitude !== "number" || typeof longitude !== "number") {
        continue;
      }

      const distanceFromRouteKm = distanceToPathKm(
        { latitude, longitude },
        routePath,
      );

      if (distanceFromRouteKm > ROUTE_DISTANCE_LIMIT_KM) {
        continue;
      }

      const existing = deduped.get(result.place_id);
      if (existing && existing.distanceFromRouteKm <= distanceFromRouteKm) {
        continue;
      }

      deduped.set(result.place_id, {
        placeId: result.place_id,
        name: result.name,
        latitude,
        longitude,
        address: result.vicinity || "Address unavailable",
        distanceFromRouteKm,
      });
    }
  }

  const mosques = [...deduped.values()].sort(
    (first, second) => first.distanceFromRouteKm - second.distanceFromRouteKm,
  );

  routeDiscoveryCache.set(key, {
    value: mosques,
    expiresAt: Date.now() + DISCOVERY_CACHE_TTL_MS,
  });

  return mosques;
}

async function fetchNearbyPlacesFromGoogle(params: {
  center: GeoPoint;
  radiusMeters: number;
  maxResults: number;
}) {
  const cacheKey = getPlacesQueryCacheKey(params.center, params.radiusMeters);
  const cached = placesQueryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value.slice(0, params.maxResults);
  }

  const apiKey =
    process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return [];
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("location", `${params.center.latitude},${params.center.longitude}`);
  url.searchParams.set("radius", String(params.radiusMeters));
  url.searchParams.set("keyword", "mosque");

  const collected: PlacesNearbyResult[] = [];
  let nextPageToken: string | undefined;

  // Google Nearby Search returns up to 20 results per page; follow next_page_token for broader coverage.
  for (let page = 0; page < 3; page += 1) {
    const pageUrl = new URL(url.toString());
    if (nextPageToken) {
      pageUrl.searchParams.set("pagetoken", nextPageToken);
      // Token activation can take a short moment after the previous response.
      await new Promise((resolve) => {
        setTimeout(resolve, 1800);
      });
    }

    const response = await fetch(pageUrl.toString(), { cache: "no-store" });
    if (!response.ok) {
      break;
    }

    const payload = (await response.json()) as PlacesNearbyResponse;
    if (payload.status === "REQUEST_DENIED") {
      throw new Error(
        "Google Places request denied. Use GOOGLE_MAPS_SERVER_API_KEY without HTTP referrer restriction for server-side discovery.",
      );
    }

    if (payload.status === "INVALID_REQUEST" && nextPageToken) {
      continue;
    }

    if (payload.status !== "OK" || !payload.results) {
      if (page === 0) {
        placesQueryCache.set(cacheKey, {
          value: [],
          expiresAt: Date.now() + PLACES_QUERY_CACHE_TTL_MS,
        });
      }
      break;
    }

    collected.push(...payload.results);
    nextPageToken = payload.next_page_token;

    if (!nextPageToken || collected.length >= Math.max(params.maxResults, NEARBY_MAX_RESULTS)) {
      break;
    }
  }

  const trimmed = collected.slice(0, Math.max(params.maxResults, NEARBY_MAX_RESULTS));
  placesQueryCache.set(cacheKey, {
    value: trimmed,
    expiresAt: Date.now() + PLACES_QUERY_CACHE_TTL_MS,
  });

  return trimmed.slice(0, params.maxResults);
}

function getSamplePoints(points: GeoPoint[], maxSamples: number) {
  if (points.length <= maxSamples) {
    return points;
  }

  const step = Math.max(1, Math.floor(points.length / maxSamples));
  const sampled: GeoPoint[] = [];

  for (let index = 0; index < points.length; index += step) {
    sampled.push(points[index]);
    if (sampled.length >= maxSamples) {
      break;
    }
  }

  const last = points[points.length - 1];
  if (
    sampled.length > 0 &&
    (sampled[sampled.length - 1].latitude !== last.latitude ||
      sampled[sampled.length - 1].longitude !== last.longitude)
  ) {
    sampled[sampled.length - 1] = last;
  }

  return sampled;
}

function getRouteCacheKey(points: GeoPoint[]) {
  const sampled = getSamplePoints(points, 3)
    .map((point) => toGridKey(point, 350))
    .join("|");
  const start = points[0];
  const end = points[points.length - 1];
  const lengthBucket = Math.round(getRouteLengthKm(points) / 2);

  return `route:${toGridKey(start, 350)}:${toGridKey(end, 350)}:${lengthBucket}:${sampled}`;
}

function getPlacesQueryCacheKey(center: GeoPoint, radiusMeters: number) {
  const snapped = toGridKey(center, NEARBY_GRID_METERS);
  const radiusBucket = Math.max(500, Math.round(radiusMeters / 250) * 250);
  return `places:${snapped}:${radiusBucket}`;
}

function getRouteSamplePoints(routePath: GeoPoint[]) {
  const routeLengthKm = getRouteLengthKm(routePath);
  let targetSamples = 6;

  if (routeLengthKm <= 20) {
    targetSamples = 4;
  } else if (routeLengthKm >= 90) {
    targetSamples = 8;
  }

  if (routePath.length > 700) {
    targetSamples += 1;
  }

  return getSamplePoints(routePath, Math.min(9, Math.max(4, targetSamples)));
}

function getRouteLengthKm(points: GeoPoint[]) {
  let total = 0;

  for (let index = 1; index < points.length; index += 1) {
    total += haversineDistanceKm(points[index - 1], points[index]);
  }

  return total;
}

function toGridKey(point: GeoPoint, gridMeters: number) {
  const latitudeStep = gridMeters / 111_320;
  const longitudeStep = gridMeters / (111_320 * Math.max(0.2, Math.cos((point.latitude * Math.PI) / 180)));

  const lat = Math.round(point.latitude / latitudeStep) * latitudeStep;
  const lng = Math.round(point.longitude / longitudeStep) * longitudeStep;

  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function toRadiusBucket(radiusKm: number, bucketKm: number) {
  const safeRadius = Math.max(1, radiusKm);
  return (Math.round(safeRadius / bucketKm) * bucketKm).toFixed(1);
}

function tryParseUrl(input: string) {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function isSupportedGoogleMapsHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "maps.app.goo.gl" || host.endsWith("google.com") || host.endsWith("google.co.in");
}

async function expandGoogleMapsUrl(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
    });

    return response.url || url;
  } catch {
    return url;
  }
}

function extractPlaceIdFromText(value: string) {
  const match = value.match(/ChI[\w-]{8,}/);
  return match?.[0] ?? null;
}

function extractNameFromMapsPath(pathname: string) {
  const marker = "/maps/place/";
  const index = pathname.indexOf(marker);
  if (index === -1) {
    return null;
  }

  const remaining = pathname.slice(index + marker.length);
  const firstSegment = remaining.split("/")[0];
  if (!firstSegment) {
    return null;
  }

  return decodeURIComponent(firstSegment).replace(/\+/g, " ").trim();
}

function extractCoordinatesFromMapsUrl(value: string) {
  const match = value.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  return {
    latitude: Number(match[1]),
    longitude: Number(match[2]),
  };
}

async function fetchPlaceByPlaceId(placeId: string, apiKey: string) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "place_id,name,formatted_address,geometry");

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as PlaceDetailsResponse;
  if (payload.status === "REQUEST_DENIED") {
    throw new Error(
      "Google Places request denied. Use GOOGLE_MAPS_SERVER_API_KEY without HTTP referrer restriction for server-side discovery.",
    );
  }

  const result = payload.result;
  const latitude = result?.geometry?.location?.lat;
  const longitude = result?.geometry?.location?.lng;
  const resolvedPlaceId = result?.place_id;
  const name = result?.name;

  if (!resolvedPlaceId || !name || typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return {
    placeId: resolvedPlaceId,
    name,
    latitude,
    longitude,
    address: result.formatted_address || "Address unavailable",
    distanceFromRouteKm: 0,
  };
}

async function findPlaceFromText(
  query: string,
  apiKey: string,
  locationBias?: { latitude: number; longitude: number } | null,
) {
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id,name,formatted_address,geometry");
  if (locationBias) {
    url.searchParams.set(
      "locationbias",
      `point:${locationBias.latitude},${locationBias.longitude}`,
    );
  }

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as PlacesFindPlaceResponse;
  if (payload.status === "REQUEST_DENIED") {
    throw new Error(
      "Google Places request denied. Use GOOGLE_MAPS_SERVER_API_KEY without HTTP referrer restriction for server-side discovery.",
    );
  }

  const candidate = payload.candidates?.[0];
  const latitude = candidate?.geometry?.location?.lat;
  const longitude = candidate?.geometry?.location?.lng;
  const placeId = candidate?.place_id;
  const name = candidate?.name;

  if (!placeId || !name || typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return {
    placeId,
    name,
    latitude,
    longitude,
    address: candidate.formatted_address || "Address unavailable",
    distanceFromRouteKm: 0,
  };
}
