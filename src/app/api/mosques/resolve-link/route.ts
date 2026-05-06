import { haversineDistanceKm } from "@/lib/geo";
import { resolveMosqueFromGoogleMapsUrl } from "@/lib/google-places";
import {
  findExistingMosqueByPlace,
  listMosqueRecords,
  listMosques,
} from "@/lib/mosques";
import type { MosqueView } from "@/types/mosque";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ResolveLinkBody {
  url: string;
  latitude?: number;
  longitude?: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ResolveLinkBody;

  if (!body.url || typeof body.url !== "string") {
    return Response.json({ error: "Google Maps link is required." }, { status: 400 });
  }

  const resolved = await resolveMosqueFromGoogleMapsUrl(body.url);
  if (!resolved) {
    return Response.json(
      {
        error:
          "Unable to resolve this Google Maps masjid link. Try another link or use Nearby search.",
      },
      { status: 404 },
    );
  }

  const hasUserLocation =
    typeof body.latitude === "number" && typeof body.longitude === "number";

  const [dbRecords, dbViews] = await Promise.all([
    listMosqueRecords(),
    hasUserLocation
      ? listMosques({ latitude: body.latitude, longitude: body.longitude })
      : listMosques(),
  ]);

  const existing = findExistingMosqueByPlace(resolved, dbRecords);
  if (existing) {
    const existingView = dbViews.find((entry) => entry.id === existing.id);
    if (existingView) {
      return Response.json({ mosque: existingView, source: "database" });
    }
  }

  const distanceKm = hasUserLocation
    ? haversineDistanceKm(
        { latitude: body.latitude as number, longitude: body.longitude as number },
        { latitude: resolved.latitude, longitude: resolved.longitude },
      )
    : undefined;

  const mosque: MosqueView = {
    id: `google-${resolved.placeId}`,
    name: resolved.name,
    latitude: resolved.latitude,
    longitude: resolved.longitude,
    placeId: resolved.placeId,
    address: resolved.address,
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
  };

  return Response.json({ mosque, source: "google" });
}
