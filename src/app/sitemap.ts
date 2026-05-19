import type { MetadataRoute } from "next";
import { FLIGHT_AIRPORT_CODES } from "@/lib/flight-airports";
import { listMosques } from "@/lib/mosques";
import { ROUTE_SEO_PAGES, buildMasjidSlug, getPopularCitySlugs } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-meta";

const baseUrl = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticPages = [
    "/",
    "/flight",
    "/flight/namaz-at-airport",
    "/flight/in-flight-namaz",
    "/flight/layover-namaz-guide",
    "/city",
    "/route",
    "/privacy",
    "/terms",
    "/disclaimer",
    "/community-guidelines",
    "/contact",
  ];

  const mosques = await listMosques();
  const citySlugs = getPopularCitySlugs(mosques).slice(0, 40);
  const prioritizedMosques = mosques
    .filter((mosque) => mosque.isVerified || mosque.hasJamaatData)
    .slice(0, 250);
  const mosquePages = prioritizedMosques.map((mosque) => `/masjid/${buildMasjidSlug(mosque)}`);
  const cityPages = citySlugs.map((city) => `/city/${city}`);
  const routePages = ROUTE_SEO_PAGES.map((route) => `/route/${route.slug}`);
  const flightAirportPages = FLIGHT_AIRPORT_CODES.map((code) => `/flight/${code.toLowerCase()}`);
  const dynamicPages = [...mosquePages, ...cityPages, ...routePages, ...flightAirportPages];

  return [...staticPages, ...dynamicPages].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "monthly",
    priority: path === "/" ? 1 : 0.4,
  }));
}
