import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Namaz Route",
    short_name: "Namaz Route",
    description:
      "Find nearby masjids and jamaat timings in India with route-aware namaz planning.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f4",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
