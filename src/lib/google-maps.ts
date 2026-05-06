import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

export async function loadGoogleMaps() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is missing.");
  }

  if (!configured) {
    setOptions({
      key: apiKey,
      v: "weekly",
      libraries: ["places"],
    });
    configured = true;
  }

  await Promise.all([
    importLibrary("maps"),
    importLibrary("places"),
  ]);

  return google;
}
