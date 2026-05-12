import type { MosqueView } from "@/types/mosque";

export interface RouteSeoPage {
  slug: string;
  title: string;
  summary: string;
  cityKeywords: string[];
  targetKeywords: string[];
}

export const ROUTE_SEO_PAGES: RouteSeoPage[] = [
  {
    slug: "hyderabad-to-nanded",
    title: "Masjids on Hyderabad to Nanded Highway",
    summary:
      "Travel-friendly prayer stops for Hyderabad to Nanded road trips with nearby jamaat timings and quick navigation links.",
    cityKeywords: ["hyderabad", "nanded", "ardhapur", "nizamabad", "kamareddy"],
    targetKeywords: [
      "mosque near hyderabad highway",
      "nanded masjid timings",
      "masjid on route",
    ],
  },
  {
    slug: "pune-to-nanded",
    title: "Pune to Nanded Route Mosques",
    summary:
      "Find masjid stops and namaz timings on the Pune to Nanded route with updates for travellers.",
    cityKeywords: ["pune", "nanded", "ahilyanagar", "beed", "parbhani", "ardhapur"],
    targetKeywords: [
      "masjid on pune highway",
      "pune namaz timings",
      "mosque during travel",
    ],
  },
  {
    slug: "hyderabad-to-pune",
    title: "Hyderabad to Pune Route Masjids",
    summary:
      "Prayer-friendly stops from Hyderabad to Pune with jamaat timings, location context, and mosque detail links.",
    cityKeywords: ["hyderabad", "pune", "solapur", "nanded", "ardhapur", "zaheerabad"],
    targetKeywords: [
      "mosque on route",
      "nearby mosque during travel",
      "jummah timing",
    ],
  },
  {
    slug: "highway-masjid-stops",
    title: "Masjids on Highways for Travellers",
    summary:
      "A discovery page for highway masjid stops with namaz/jamaat timing references for long-distance travel.",
    cityKeywords: ["highway", "nanded", "hyderabad", "pune", "ardhapur", "maharashtra", "telangana"],
    targetKeywords: [
      "masjid near highway",
      "mosque stop for travellers",
      "nearby mosque during travel",
    ],
  },
];

const CITY_KEYWORDS = [
  "ardhapur",
  "nanded",
  "hyderabad",
  "pune",
  "solapur",
  "parbhani",
  "nizamabad",
  "kamareddy",
  "zaheerabad",
  "maharashtra",
  "telangana",
] as const;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function deslugify(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildMasjidSlug(mosque: Pick<MosqueView, "id" | "name">) {
  const shortId = mosque.id.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);
  return `${slugify(mosque.name)}-${shortId}`;
}

export function extractCityFromAddress(address: string) {
  const normalized = address.toLowerCase();
  const matched = CITY_KEYWORDS.find((city) => normalized.includes(city));

  if (matched) {
    return matched;
  }

  const tokens = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const guessed = tokens.at(-2) || tokens.at(-1) || "india";
  return slugify(guessed);
}

export function getMosquesForCity(citySlug: string, mosques: MosqueView[]) {
  return mosques.filter((mosque) => extractCityFromAddress(mosque.address) === citySlug);
}

export function getPopularCitySlugs(mosques: MosqueView[]) {
  const counts = new Map<string, number>();

  for (const mosque of mosques) {
    const city = extractCityFromAddress(mosque.address);
    counts.set(city, (counts.get(city) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([city]) => city);
}

export function getMosquesForRoute(route: RouteSeoPage, mosques: MosqueView[]) {
  return mosques.filter((mosque) => {
    const address = mosque.address.toLowerCase();
    return route.cityKeywords.some((keyword) => address.includes(keyword));
  });
}

export function findRouteBySlug(routeSlug: string) {
  return ROUTE_SEO_PAGES.find((route) => route.slug === routeSlug) || null;
}
