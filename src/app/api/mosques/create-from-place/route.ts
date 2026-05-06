import { createMosqueFromDiscoveredPlace } from "@/lib/mosques";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateFromPlaceBody {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  distanceFromRouteKm?: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateFromPlaceBody;

  if (
    !body.placeId ||
    !body.name ||
    typeof body.latitude !== "number" ||
    typeof body.longitude !== "number"
  ) {
    return Response.json({ error: "Invalid mosque payload." }, { status: 400 });
  }

  const result = await createMosqueFromDiscoveredPlace({
    placeId: body.placeId,
    name: body.name,
    latitude: body.latitude,
    longitude: body.longitude,
    address: body.address || "Address unavailable",
    distanceFromRouteKm: body.distanceFromRouteKm ?? 0,
  });

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  if (!result.mosque?.qrToken) {
    return Response.json({ error: "Unable to open update flow for mosque." }, { status: 500 });
  }

  return Response.json({
    mosque: result.mosque,
    redirectTo: `/update/${result.mosque.qrToken}?edit=1`,
  });
}
