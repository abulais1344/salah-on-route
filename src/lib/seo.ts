import type { MosqueView } from "@/types/mosque";

export interface RouteSeoPage {
  slug: string;
  title: string;
  summary: string;
  cityKeywords: string[];
  targetKeywords: string[];
}

export interface JummahSeoMetaInput {
  displayName: string;
  lastUpdatedDisplay: string;
  masjids: { name: string; address: string; jummah: string | null }[];
  canonicalPath: string;
}

export const ROUTE_SEO_PAGES: RouteSeoPage[] = [
  {
    slug: "hyderabad-to-nanded",
    title: "Masjids on Hyderabad to Nanded Highway",
    summary:
      "Travel-friendly prayer stops for Hyderabad to Nanded road trips with nearby jamaat timings and quick navigation links.",
    cityKeywords: ["hyderabad", "nanded", "ardhapur", "nizamabad", "kamareddy"],
    targetKeywords: ["mosque near hyderabad highway", "nanded masjid timings", "masjid on route"],
  },
  {
    slug: "pune-to-nanded",
    title: "Pune to Nanded Route Mosques",
    summary:
      "Find masjid stops and namaz timings on the Pune to Nanded route with updates for travellers.",
    cityKeywords: ["pune", "nanded", "ahilyanagar", "beed", "parbhani", "ardhapur"],
    targetKeywords: ["masjid on pune highway", "pune namaz timings", "mosque during travel"],
  },
  {
    slug: "pune-to-solapur",
    title: "Pune to Solapur Route Namaz Timings",
    summary:
      "Travel-friendly mosque stops between Pune and Solapur with jamaat timing context for road travellers.",
    cityKeywords: ["pune", "solapur", "barshi", "pandharpur"],
    targetKeywords: ["pune to solapur masjid", "solapur namaz timings", "mosque on pune solapur route"],
  },
  {
    slug: "solapur-to-latur",
    title: "Solapur to Latur Route Mosque Stops",
    summary:
      "Route masjid discovery page for Solapur to Latur travel with namaz and jamaat timing references.",
    cityKeywords: ["solapur", "latur", "osmanabad", "dharashiv", "barshi"],
    targetKeywords: ["solapur to latur masjid", "latur namaz timings", "mosque on solapur latur route"],
  },
  {
    slug: "latur-to-nanded",
    title: "Latur to Nanded Route Masjids",
    summary:
      "Prayer-friendly mosque stops from Latur to Nanded with route-based timing context for travellers.",
    cityKeywords: ["latur", "nanded", "udgir", "degloor", "osmanabad", "dharashiv"],
    targetKeywords: ["latur to nanded masjid", "nanded namaz timings", "mosque during latur nanded travel"],
  },
  {
    slug: "pune-to-latur",
    title: "Pune to Latur Namaz Timings on Route",
    summary:
      "Find masjid stops and prayer timing references for the Pune to Latur highway travel corridor.",
    cityKeywords: ["pune", "latur", "solapur", "barshi", "osmanabad"],
    targetKeywords: ["pune to latur masjid", "latur route namaz", "mosque on pune latur route"],
  },
  {
    slug: "hyderabad-to-solapur",
    title: "Hyderabad to Solapur Route Masjids",
    summary:
      "Highway masjid and namaz timing guide for Hyderabad to Solapur journeys with traveller context.",
    cityKeywords: ["hyderabad", "solapur", "zaheerabad", "nizamabad", "kamareddy"],
    targetKeywords: ["hyderabad to solapur masjid", "solapur namaz timings", "mosque on hyderabad solapur route"],
  },
  {
    slug: "hyderabad-to-pune",
    title: "Hyderabad to Pune Route Masjids",
    summary:
      "Prayer-friendly stops from Hyderabad to Pune with jamaat timings, location context, and mosque detail links.",
    cityKeywords: ["hyderabad", "pune", "solapur", "nanded", "ardhapur", "zaheerabad"],
    targetKeywords: ["mosque on route", "nearby mosque during travel", "jummah timing"],
  },
  {
    slug: "maharashtra-highway-namaz-timings",
    title: "Maharashtra Highway Namaz Timings",
    summary:
      "A Maharashtra-focused discovery page for highway masjid stops with namaz and jamaat timing references for long-distance travel.",
    cityKeywords: ["maharashtra", "pune", "solapur", "latur", "nanded", "hyderabad", "barshi", "pandharpur"],
    targetKeywords: ["maharashtra namaz timings", "masjid near highway", "mosque stop for travellers"],
  },
  {
    slug: "highway-masjid-stops",
    title: "Masjids on Highways for Travellers",
    summary:
      "A discovery page for highway masjid stops with namaz and jamaat timing references for long-distance travel.",
    cityKeywords: ["highway", "nanded", "hyderabad", "pune", "ardhapur", "maharashtra", "telangana"],
    targetKeywords: ["masjid near highway", "mosque stop for travellers", "nearby mosque during travel"],
  },
];

const CITY_KEYWORDS = [
  "ardhapur",
  "nanded",
  "hyderabad",
  "pune",
  "solapur",
  "latur",
  "parbhani",
  "nizamabad",
  "kamareddy",
  "zaheerabad",
  "maharashtra",
  "telangana",
] as const;

export function buildJummahSeoMeta(data: JummahSeoMetaInput) {
  const title = `Jummah Namaz Timings in ${data.displayName} Today`;
  const description = `Find latest Friday prayer (Jummah) timings for all major masjids in ${data.displayName}. Updated: ${data.lastUpdatedDisplay}.`;
  const locationKey = data.displayName.toLowerCase();

  return {
    title,
    description,
    keywords: [
      `jummah timings in ${locationKey}`,
      `${locationKey} friday prayer time`,
      `jummah namaz in ${locationKey}`,
      `masjid jummah near ${locationKey}`,
    ],
    openGraph: {
      title,
      description,
      url: data.canonicalPath,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: data.canonicalPath,
    },
  };
}

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
