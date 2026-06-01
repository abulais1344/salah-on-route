import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MasjidQuickActions } from "@/components/masjid-quick-actions";
import { formatAddressForDisplay } from "@/lib/address";
import { formatDisplayTime } from "@/lib/jamaat";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import { listMosques } from "@/lib/mosques";
import {
  ROUTE_SEO_PAGES,
  buildMasjidSlug,
  deslugify,
  extractCityFromAddress,
  getMosquesForRoute,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site-meta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getMosqueBySlug(slug: string) {
  const mosques = await listMosques();
  return mosques.find((mosque) => buildMasjidSlug(mosque) === slug) || null;
}

export async function generateStaticParams() {
  const mosques = await listMosques();
  return mosques.slice(0, 400).map((mosque) => ({ slug: buildMasjidSlug(mosque) }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const mosque = await getMosqueBySlug(slug);

  if (!mosque) {
    return {
      title: "Masjid Not Found",
      robots: { index: false, follow: false },
    };
  }

  const city = deslugify(extractCityFromAddress(mosque.address));
  const title = `${mosque.name} Namaz & Jummah Timings in ${city}`;
  const description = `Check latest namaz and jummah timings for ${mosque.name} in ${city}. Ideal for travellers searching masjid near highway and mosque on route.`;

  return {
    title,
    description,
    keywords: [
      mosque.name,
      city,
      "namaz timings",
      "jummah timings",
      "masjid near me",
      "mosque on route",
      "travel prayer",
    ],
    alternates: { canonical: `/masjid/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/masjid/${slug}`,
      type: "article",
      modifiedTime: mosque.lastUpdated,
      images: [{ url: mosque.images[0]?.imageUrl || `${SITE_URL}/favicon-512.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [mosque.images[0]?.imageUrl || `${SITE_URL}/favicon-512.png`],
    },
  };
}

export default async function MasjidSeoPage({ params }: PageProps) {
  const { slug } = await params;
  const mosque = await getMosqueBySlug(slug);

  if (!mosque) {
    notFound();
  }

  const citySlug = extractCityFromAddress(mosque.address);
  const cityName = deslugify(citySlug);
  const mapsUrl = getGoogleMapsDirectionsUrl(mosque);

  const relatedRoutes = ROUTE_SEO_PAGES.filter((route) =>
    getMosquesForRoute(route, [mosque]).length > 0,
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: `City ${cityName}`, item: `${SITE_URL}/city/${citySlug}` },
      { "@type": "ListItem", position: 3, name: mosque.name, item: `${SITE_URL}/masjid/${slug}` },
    ],
  };

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: mosque.name,
    address: mosque.address,
    geo: {
      "@type": "GeoCoordinates",
      latitude: mosque.latitude,
      longitude: mosque.longitude,
    },
    url: `${SITE_URL}/masjid/${slug}`,
    image: mosque.images.map((image) => image.imageUrl),
    description: `Namaz and jummah timings for ${mosque.name} in ${cityName}.`,
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: mosque.name,
    address: mosque.address,
    areaServed: [cityName, "Maharashtra", "Telangana"],
    sameAs: mosque.placeId
      ? [`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mosque.name)}`]
      : [],
    url: `${SITE_URL}/masjid/${slug}`,
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 pb-32 sm:px-6 lg:px-8 sm:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />

      <nav className="mb-4 text-xs text-stone-500">
        <Link href="/" className="hover:text-orange-700">Home</Link> /{" "}
        <Link href={`/city/${citySlug}`} className="hover:text-orange-700">{cityName}</Link> /{" "}
        <span className="text-stone-700">{mosque.name}</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{mosque.name}</h1>
      <p className="mt-2 text-sm text-stone-600">
        Nearby masjid in {cityName}. Useful for travellers searching mosque on route and namaz timing near me.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(mosque.prayers).map(([prayer, time]) => (
          <div key={prayer} className="rounded-[16px] bg-stone-100 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone-500">{prayer}</p>
            <p className="mt-1 text-base font-semibold text-stone-900">{time ? formatDisplayTime(time) : "--"}</p>
          </div>
        ))}
      </div>

      <section className="mt-5 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Jummah timings</h2>
        <p className="mt-2 text-sm text-stone-700">Juma 1: {mosque.juma1 ? formatDisplayTime(mosque.juma1) : "--"}</p>
        <p className="text-sm text-stone-700">Juma 2: {mosque.juma2 ? formatDisplayTime(mosque.juma2) : "Not listed"}</p>
      </section>

      <section className="mt-5 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Address and travel relevance</h2>
        <p className="mt-2 text-sm text-stone-700">{formatAddressForDisplay(mosque.address)}</p>
        <p className="mt-2 text-xs text-stone-500">Last updated: {new Date(mosque.lastUpdated).toLocaleString()}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
          <span className="rounded-full bg-stone-100 px-3 py-1">Parking: {mosque.remarks?.toLowerCase().includes("park") ? "Available" : "Unknown"}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1">Wuzu: {mosque.remarks?.toLowerCase().includes("wazu") ? "Mentioned" : "Unknown"}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1">Women prayer area: {mosque.remarks?.toLowerCase().includes("women") ? "Mentioned" : "Unknown"}</span>
          <span className="rounded-full bg-stone-100 px-3 py-1">Highway accessibility: {mosque.distanceFromRouteKm ? `${mosque.distanceFromRouteKm.toFixed(1)} km from route` : "Nearby city route"}</span>
        </div>
      </section>

      <section className="mt-5 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Related links</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/city/${citySlug}`} className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50">
            Nearby Masjids in {cityName}
          </Link>
          {relatedRoutes.map((route) => (
            <Link
              key={route.slug}
              href={`/route/${route.slug}`}
              className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              {route.title}
            </Link>
          ))}
        </div>
      </section>

      <MasjidQuickActions
        mosqueName={mosque.name}
        navigateUrl={mapsUrl}
        updateUrl={`/update/${mosque.qrToken}`}
      />
    </main>
  );
}
