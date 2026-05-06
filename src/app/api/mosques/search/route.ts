import { haversineDistanceKm } from "@/lib/geo";
import { searchMosquesByName } from "@/lib/google-places";
import {
  findExistingMosqueByPlace,
  listMosqueRecords,
  listMosques,
} from "@/lib/mosques";
import type { MosqueView } from "@/types/mosque";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SearchMosquesBody {
  query: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as SearchMosquesBody;
  const query = body.query?.trim();

  if (!query || query.length < 2) {
    return Response.json({ error: "Search query must be at least 2 characters." }, { status: 400 });
  }

  const hasLocation = typeof body.latitude === "number" && typeof body.longitude === "number";
  const radiusKm = Math.max(5, Math.min(50, body.radiusKm ?? 20));

  const [dbRecords, dbViews] = await Promise.all([
    listMosqueRecords(),
    hasLocation
      ? listMosques({ latitude: body.latitude, longitude: body.longitude })
      : listMosques(),
  ]);

  const queryLower = query.toLowerCase();
  const matchedInDb = dbViews.filter((mosque) => {
    const haystack = `${mosque.name} ${mosque.address}`.toLowerCase();
    return haystack.includes(queryLower);
  });

  if (matchedInDb.length > 0) {
    return Response.json({ mosques: matchedInDb, source: "database" });
  }

  const googleFound = await searchMosquesByName(query, {
    center: hasLocation
      ? { latitude: body.latitude as number, longitude: body.longitude as number }
      : undefined,
    radiusKm,
    limit: 8,
  });

  const result = new Map<string, MosqueView>();

  for (const place of googleFound) {
    const existing = findExistingMosqueByPlace(place, dbRecords);
    if (existing) {
      const existingView = dbViews.find((entry) => entry.id === existing.id);
      if (existingView) {
        result.set(existingView.id, existingView);
      }
      continue;
    }

    const distanceKm = hasLocation
      ? haversineDistanceKm(
          { latitude: body.latitude as number, longitude: body.longitude as number },
          { latitude: place.latitude, longitude: place.longitude },
        )
      : undefined;

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

  return Response.json({ mosques: [...result.values()], source: "google" });
}
