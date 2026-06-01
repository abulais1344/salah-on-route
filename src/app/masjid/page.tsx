import Link from "next/link";
import type { Metadata } from "next";

import { listMosques } from "@/lib/mosques";
import { buildMasjidSlug, deslugify, getPopularCitySlugs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Popular Masjid Pages | Namaz Timings, Jummah Timings & Route Stops",
  description:
    "Browse popular masjid pages with namaz timings, jummah timings, and traveller-friendly route context for India.",
  alternates: { canonical: "/masjid" },
};

export default async function MasjidIndexPage() {
  const mosques = await listMosques();
  const popularCities = getPopularCitySlugs(mosques).slice(0, 12);
  const popularMosques = mosques
    .filter((mosque) => mosque.isVerified || mosque.hasJamaatData)
    .slice(0, 24);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the masjid hub page for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It helps travellers and local users discover popular masjid pages, city pages, and route pages with namaz and jummah timing context.",
        },
      },
      {
        "@type": "Question",
        name: "Can I find nearby masjids by city?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, the masjid hub links into city pages so you can browse local masjid listings and timing details.",
        },
      },
      {
        "@type": "Question",
        name: "How do I find route or travel masjid pages?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the city links and route links on the hub page to open traveller-focused masjid pages for road trips and highway journeys.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Popular Masjid Pages</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        Explore indexed masjid pages for namaz timings, jummah timings, nearby routes, and traveller-friendly
        mosque discovery.
      </p>

      <section className="mt-6 rounded-[22px] border border-stone-200 bg-white p-5 shadow-[0_10px_24px_rgba(41,37,36,0.08)]">
        <h2 className="text-xl font-semibold text-stone-900">Why this hub helps</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          This page acts as a strong discovery hub for masjid search traffic. It links to city pages, route pages,
          and individual masjid pages so users and search engines can move from broad intent to specific prayer
          timing pages quickly.
        </p>
      </section>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Popular cities</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {popularCities.map((city) => (
            <Link
              key={city}
              href={`/city/${city}`}
              className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Masjids in {deslugify(city)}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Helpful route discovery</h2>
        <p className="mt-2 text-sm text-stone-600">
          Travellers often search for masjid on route, mosque near highway, or jummah timing while moving between
          cities. Route pages collect those searches into a single travel-friendly entry point.
        </p>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {popularMosques.map((mosque) => (
          <Link
            key={mosque.id}
            href={`/masjid/${buildMasjidSlug(mosque)}`}
            className="rounded-[20px] border border-stone-200 bg-white p-5 shadow-[0_10px_24px_rgba(41,37,36,0.08)] transition hover:border-orange-300"
          >
            <h2 className="text-lg font-semibold text-stone-900">{mosque.name}</h2>
            <p className="mt-2 text-sm text-stone-600">{mosque.address}</p>
            <p className="mt-3 text-xs text-stone-500">
              {mosque.hasJamaatData ? "Timings available" : "Add timings to help others"}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Masjid hub FAQ</h2>
        <div className="mt-3 space-y-3 text-sm text-stone-700">
          <p><strong>How should I use this page?</strong> Start with city links if you need local search, or open route pages if you are travelling.</p>
          <p><strong>What if a masjid page has no timings?</strong> Use the add timings flow so the page becomes more useful for the next traveller.</p>
          <p><strong>Why are some masjid pages more visible?</strong> Verified and timing-rich pages are more useful and easier for search engines to understand.</p>
        </div>
      </section>
    </main>
  );
}