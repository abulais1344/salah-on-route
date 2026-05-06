import { haversineDistanceKm } from "@/lib/geo";
import { searchNearbyMosques } from "@/lib/google-places";
import {
  findExistingMosqueByPlace,
  listMosqueRecords,
  listMosques,
} from "@/lib/mosques";
import type { MosqueView } from "@/types/mosque";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface NearbyResponseCacheEntry {
  expiresAt: number;
  value: MosqueView[];
}

const nearbyResponseCache = new Map<string, NearbyResponseCacheEntry>();
const NEARBY_RESPONSE_CACHE_TTL_MS = 1000 * 60 * 2;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = getNumber(url.searchParams.get("lat"));
  const longitude = getNumber(url.searchParams.get("lng"));
  const radiusKm = getNumber(url.searchParams.get("radiusKm")) ?? 8;

  const cacheKey =
    typeof latitude === "number" && typeof longitude === "number"
      ? getNearbyCacheKey(latitude, longitude, radiusKm)
      : null;

  if (cacheKey) {
    const cached = nearbyResponseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return Response.json({ mosques: cached.value, cached: true });
    }
  }

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    const mosques = await listMosques({ radiusKm });
    return Response.json({ mosques, cached: false });
  }

  let dbRecords;
  let dbViews;
  let discovered;

  try {
    [dbRecords, dbViews, discovered] = await Promise.all([
      listMosqueRecords(),
      listMosques({ latitude, longitude }),
      searchNearbyMosques({ latitude, longitude }, radiusKm),
    ]);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to discover nearby mosques right now.",
      },
      { status: 502 },
    );
  }

  const result = new Map<string, MosqueView>();

  for (const dbMosque of dbViews) {
    const distanceKm = dbMosque.distanceKm ?? haversineDistanceKm(
      { latitude, longitude },
      { latitude: dbMosque.latitude, longitude: dbMosque.longitude },
    );

    if (distanceKm <= radiusKm) {
      result.set(dbMosque.id, {
        ...dbMosque,
        distanceKm,
      });
    }
  }

  for (const place of discovered) {
    const existing = findExistingMosqueByPlace(place, dbRecords);
    const distanceKm = haversineDistanceKm(
      { latitude, longitude },
      { latitude: place.latitude, longitude: place.longitude },
    );

    if (distanceKm > radiusKm) {
      continue;
    }

    if (existing) {
      const existingView = dbViews.find((mosque) => mosque.id === existing.id);
      if (!existingView) {
        continue;
      }

      result.set(existing.id, {
        ...existingView,
        distanceKm,
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
        distanceKm,
        hasJamaatData: false,
        nextJamaat: null,
        updatedAgo: "No updates yet",
      });
    }
  }

  const mosques = [...result.values()].sort(
    (first, second) =>
      (first.distanceKm ?? Number.POSITIVE_INFINITY) -
      (second.distanceKm ?? Number.POSITIVE_INFINITY),
  );

  if (cacheKey) {
    nearbyResponseCache.set(cacheKey, {
      value: mosques,
      expiresAt: Date.now() + NEARBY_RESPONSE_CACHE_TTL_MS,
    });
  }

  return Response.json({ mosques, cached: false });
}

function getNumber(value: string | null) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getNearbyCacheKey(latitude: number, longitude: number, radiusKm: number) {
  const latGrid = Math.round(latitude / 0.002) * 0.002;
  const lngGrid = Math.round(longitude / 0.002) * 0.002;
  const radiusBucket = Math.round(Math.max(1, radiusKm) / 0.5) * 0.5;

  return `nearby:${latGrid.toFixed(3)},${lngGrid.toFixed(3)}:${radiusBucket.toFixed(1)}`;
}
