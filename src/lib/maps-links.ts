import type { MosqueView } from "@/types/mosque";

export function getGoogleMapsDirectionsUrl(mosque: Pick<MosqueView, "placeId" | "latitude" | "longitude">) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  // Google Maps requires destination for reliable prefill; place_id acts as a precise resolver.
  url.searchParams.set("destination", `${mosque.latitude},${mosque.longitude}`);

  if (mosque.placeId) {
    url.searchParams.set("destination_place_id", mosque.placeId);
  }

  return url.toString();
}
