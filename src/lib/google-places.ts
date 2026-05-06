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

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as PlacesNearbyResponse;
  if (payload.status === "REQUEST_DENIED") {
    throw new Error(
      "Google Places request denied. Use GOOGLE_MAPS_SERVER_API_KEY without HTTP referrer restriction for server-side discovery.",
    );
  }

  if (!payload.results || payload.status !== "OK") {
    placesQueryCache.set(cacheKey, {
      value: [],
      expiresAt: Date.now() + PLACES_QUERY_CACHE_TTL_MS,
    });
    return [];
  }

  const trimmed = payload.results.slice(0, Math.max(params.maxResults, NEARBY_MAX_RESULTS));
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
