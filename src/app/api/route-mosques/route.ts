import { distanceToPathKm, type GeoPoint } from "@/lib/geo";
import { searchMosquesAlongRoute } from "@/lib/google-places";
import {
  findExistingMosqueByPlace,
  listMosqueRecords,
  listMosques,
} from "@/lib/mosques";
import type { MosqueView } from "@/types/mosque";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteResponseCacheEntry {
  expiresAt: number;
  value: MosqueView[];
}

const routeResponseCache = new Map<string, RouteResponseCacheEntry>();
const ROUTE_RESPONSE_CACHE_TTL_MS = 1000 * 60 * 2;

interface RouteRequestBody {
  routePath: GeoPoint[];
}

export async function POST(request: Request) {
  const body = (await request.json()) as RouteRequestBody;
  const routePath = Array.isArray(body.routePath) ? body.routePath : [];
  const cacheKey = getRouteCacheKey(routePath);

  if (routePath.length === 0) {
    return Response.json({ mosques: [], cached: false });
  }

  const cached = routeResponseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json({ mosques: cached.value, cached: true });
  }

  let discovered;
  let dbRecords;
  let dbViews;

  try {
    [dbRecords, dbViews, discovered] = await Promise.all([
      listMosqueRecords(),
      listMosques(),
      searchMosquesAlongRoute(routePath),
    ]);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to discover mosques on route.",
      },
      { status: 502 },
    );
  }

  const result = new Map<string, MosqueView>();

  for (const dbMosque of dbViews) {
    const distanceFromRouteKm = distanceToPathKm(
      { latitude: dbMosque.latitude, longitude: dbMosque.longitude },
      routePath,
    );

    if (distanceFromRouteKm <= 3) {
      result.set(dbMosque.id, {
        ...dbMosque,
        distanceFromRouteKm,
      });
    }
  }

  for (const place of discovered) {
    const existing = findExistingMosqueByPlace(place, dbRecords);

    if (existing) {
      const existingView = dbViews.find((mosque) => mosque.id === existing.id);
      if (!existingView) {
        continue;
      }

      result.set(existing.id, {
        ...existingView,
        distanceFromRouteKm: place.distanceFromRouteKm,
      });
      continue;
    }

    const id = `google-${place.placeId}`;
    if (!result.has(id)) {
      result.set(id, {
        id,
        name: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        placeId: place.placeId,
        address: place.address,
        qrToken: "",
        prayers: {
          fajr: null,
          zuhr: null,
          asr: null,
          maghrib: null,
          isha: null,
        },
        juma1: null,
        juma2: null,
        remarks: null,
        lastUpdated: new Date(0).toISOString(),
        isVerified: false,
        images: [],
        distanceFromRouteKm: place.distanceFromRouteKm,
        hasJamaatData: false,
        nextJamaat: null,
        updatedAgo: "No updates yet",
      });
    }
  }

  const mosques = [...result.values()].sort((first, second) => {
    // 1. Closest to route
    const distDiff =
      (first.distanceFromRouteKm ?? Number.POSITIVE_INFINITY) -
      (second.distanceFromRouteKm ?? Number.POSITIVE_INFINITY);
    if (distDiff !== 0) return distDiff;

    // 2. Soonest upcoming jamaat
    const firstMinutes =
      first.nextJamaat && first.nextJamaat.status !== "Missed"
        ? first.nextJamaat.minutesLeft
        : Number.POSITIVE_INFINITY;
    const secondMinutes =
      second.nextJamaat && second.nextJamaat.status !== "Missed"
        ? second.nextJamaat.minutesLeft
        : Number.POSITIVE_INFINITY;
    return firstMinutes - secondMinutes;
  });

  routeResponseCache.set(cacheKey, {
    value: mosques,
    expiresAt: Date.now() + ROUTE_RESPONSE_CACHE_TTL_MS,
  });

  return Response.json({ mosques, cached: false });
}

function getRouteCacheKey(routePath: GeoPoint[]) {
  if (routePath.length === 0) {
    return "route:empty";
  }

  const sampleStep = Math.max(1, Math.floor(routePath.length / 4));
  const sampled = [routePath[0]];

  for (let index = sampleStep; index < routePath.length - 1; index += sampleStep) {
    sampled.push(routePath[index]);
    if (sampled.length >= 4) {
      break;
    }
  }

  sampled.push(routePath[routePath.length - 1]);

  return `route:${sampled
    .map((point) => `${point.latitude.toFixed(3)},${point.longitude.toFixed(3)}`)
    .join("|")}`;
}
