import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { MosqueCard } from "@/components/mosque-card";
import { listMosques } from "@/lib/mosques";
import { ROUTE_SEO_PAGES, buildMasjidSlug, deslugify, getMosquesForCity, getPopularCitySlugs, slugify } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site-meta";

interface PageProps {
  params: Promise<{ cityName: string }>;
}

export async function generateStaticParams() {
  const mosques = await listMosques();
  return getPopularCitySlugs(mosques)
    .slice(0, 60)
    .map((cityName) => ({ cityName }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { cityName } = await params;
  const city = deslugify(cityName);

  return {
    title: `Nearby Masjids in ${city}`,
    description: `Find nearby masjids, namaz timings, and jummah timings in ${city}. Useful for travellers and daily prayer planning.`,
    alternates: { canonical: `/city/${cityName}` },
    openGraph: {
      title: `Nearby Masjids in ${city} | ${SITE_NAME}`,
      description: `City-focused masjid and jamaat timing discovery for ${city}.`,
      url: `${SITE_URL}/city/${cityName}`,
      images: [{ url: `${SITE_URL}/favicon-512.png` }],
    },
  };
}

export default async function CitySeoPage({ params }: PageProps) {
  const { cityName } = await params;
  const normalizedCity = slugify(cityName);
  const mosques = await listMosques();
  const cityMosques = getMosquesForCity(normalizedCity, mosques);

  if (cityMosques.length === 0) {
    notFound();
  }

  const cityLabel = deslugify(normalizedCity);
  const relatedRoutes = ROUTE_SEO_PAGES.filter((route) =>
    route.cityKeywords.some((keyword) => keyword === normalizedCity),
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "City Pages", item: `${SITE_URL}/city` },
      { "@type": "ListItem", position: 3, name: cityLabel, item: `${SITE_URL}/city/${normalizedCity}` },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Nearby Masjids in ${cityLabel}`,
    itemListElement: cityMosques.slice(0, 25).map((mosque, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: mosque.name,
      url: `${SITE_URL}/masjid/${buildMasjidSlug(mosque)}`,
    })),
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />

      <nav className="mb-4 text-xs text-stone-500">
        <Link href="/" className="hover:text-orange-700">Home</Link> /{" "}
        <Link href="/city" className="hover:text-orange-700">City Pages</Link> /{" "}
        <span className="text-stone-700">{cityLabel}</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Nearby Masjids in {cityLabel}</h1>
      <p className="mt-2 text-sm text-stone-600">
        Explore masjid timings, jummah timings, and traveller-friendly mosque stops in {cityLabel}.
      </p>

      <div className="mt-6 grid gap-4">
        {cityMosques.map((mosque) => (
          <MosqueCard key={mosque.id} mosque={mosque} />
        ))}
      </div>

      <section className="mt-8 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Related route pages</h2>
        <div className="mt-3 flex flex-wrap gap-2">
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
    </main>
  );
}
