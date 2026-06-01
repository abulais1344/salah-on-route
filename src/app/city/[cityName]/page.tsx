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
  const mosques = await listMosques();
  const cityMosques = getMosquesForCity(slugify(cityName), mosques);
  const latestUpdated = cityMosques.reduce((latest, mosque) => {
    const updatedAt = new Date(mosque.lastUpdated).getTime();
    return updatedAt > latest ? updatedAt : latest;
  }, 0);

  return {
    title: `Nearby Masjids in ${city} with Namaz & Jummah Timings`,
    description: `Find nearby masjids, namaz timings, jummah timings, and traveller-friendly mosque stops in ${city}.`,
    keywords: [
      `masjid in ${city.toLowerCase()}`,
      `namaz timings in ${city.toLowerCase()}`,
      `jummah timings in ${city.toLowerCase()}`,
      `nearby masjid ${city.toLowerCase()}`,
      `mosque near me ${city.toLowerCase()}`,
    ],
    alternates: { canonical: `/city/${cityName}` },
    openGraph: {
      title: `Nearby Masjids in ${city} | ${SITE_NAME}`,
      description: `City-focused masjid and jamaat timing discovery for ${city}.`,
      url: `${SITE_URL}/city/${cityName}`,
      type: "article",
      modifiedTime: latestUpdated ? new Date(latestUpdated).toISOString() : undefined,
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
  const cityJummahMosques = cityMosques
    .filter((mosque) => Boolean(mosque.juma1 || mosque.juma2))
    .sort((a, b) => {
      if (Boolean(a.juma1) !== Boolean(b.juma1)) {
        return a.juma1 ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 8);
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

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Where can I find masjid timings in ${cityLabel}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use this city page to browse nearby masjids in ${cityLabel} and open each masjid page for timing details when available.`,
        },
      },
      {
        "@type": "Question",
        name: `Can this page help with jummah planning in ${cityLabel}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Yes, the city page helps travellers compare masjid listings and jummah timing context in ${cityLabel}.`,
        },
      },
      {
        "@type": "Question",
        name: `Why use city pages instead of only individual masjid pages?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "City pages provide a broader discovery view, making it easier to compare multiple nearby masjids before opening a detailed masjid page.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="mb-4 text-xs text-stone-500">
        <Link href="/" className="hover:text-orange-700">Home</Link> /{" "}
        <Link href="/city" className="hover:text-orange-700">City Pages</Link> /{" "}
        <span className="text-stone-700">{cityLabel}</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Nearby Masjids in {cityLabel}</h1>
      <p className="mt-2 text-sm text-stone-600">
        Explore masjid timings, jummah timings, and traveller-friendly mosque stops in {cityLabel}.
      </p>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">City masjid guide</h2>
        <p className="mt-2 text-sm text-stone-600">
          Use this page to find mosques in {cityLabel}, compare prayer timings, and open individual masjid pages.
          It is designed for travellers searching nearby masjid, namaz timing near me, and jummah timing in {cityLabel}.
        </p>
      </section>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">City FAQ</h2>
        <div className="mt-3 space-y-3 text-sm text-stone-700">
          <p><strong>Do all masjids in {cityLabel} have timings?</strong> Not always. Some pages may still need community timing updates.</p>
          <p><strong>What should I open first?</strong> Start with the city page, then open the masjid page that matches your route or neighbourhood.</p>
          <p><strong>Can I use this while travelling?</strong> Yes, the page is built for both local users and route travellers.
          </p>
        </div>
      </section>

      {cityJummahMosques.length > 0 ? (
        <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-stone-900">Quick Jummah references in {cityLabel}</h2>
          <p className="mt-2 text-sm text-stone-600">
            Friday prayer highlights from popular masjids in this city.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {cityJummahMosques.map((mosque) => (
              <div key={mosque.id} className="rounded-[14px] border border-stone-200 bg-stone-50 p-3">
                <p className="text-sm font-semibold text-stone-900">{mosque.name}</p>
                <p className="mt-1 text-xs text-stone-600">
                  Jummah {mosque.juma1 || mosque.juma2 || "--"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href={`/masjid/${buildMasjidSlug(mosque)}`}
                    className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:bg-white"
                  >
                    Open masjid page
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link
              href={`/jummah/${normalizedCity}`}
              className="inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              View all Jummah in {cityLabel}
            </Link>
          </div>
        </section>
      ) : null}

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
