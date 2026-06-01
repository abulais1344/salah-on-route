import Link from "next/link";
import type { Metadata } from "next";

import { listMosques } from "@/lib/mosques";
import { buildMasjidSlug, deslugify, extractCityFromAddress, slugify } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Jummah Namaz Timings by City",
  description:
    "Browse city-wise Jummah namaz timing pages for popular masjid locations. Useful for Friday prayer planning while travelling.",
  alternates: { canonical: "/jummah" },
  keywords: [
    "jummah timings",
    "friday prayer time",
    "jummah namaz timings",
    "hyderabad jummah",
    "pune jummah",
    "solapur jummah",
    "latur jummah",
  ],
  openGraph: {
    title: "Jummah Namaz Timings by City",
    description:
      "Browse city-wise Jummah namaz timing pages for popular masjid locations. Useful for Friday prayer planning while travelling.",
    url: "/jummah",
    type: "website",
  },
};

export default async function JummahIndexPage() {
  const mosques = await listMosques();
  const jummahMosques = mosques.filter((m) => Boolean(m.juma1 || m.juma2));

  const cityCounts = new Map<string, number>();
  for (const mosque of jummahMosques) {
    const citySlug = extractCityFromAddress(mosque.address);
    cityCounts.set(citySlug, (cityCounts.get(citySlug) || 0) + 1);
  }

  const cities = [...cityCounts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40);

  const preferredCities = ["hyderabad", "pune"];
  const featuredMasjids = jummahMosques
    .filter((mosque) => preferredCities.includes(extractCityFromAddress(mosque.address)))
    .sort((a, b) => {
      if (Boolean(a.juma1) !== Boolean(b.juma1)) {
        return a.juma1 ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 12);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Jummah Namaz Timings by City",
    itemListElement: cities.slice(0, 25).map(([citySlug, count], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `Jummah in ${deslugify(citySlug)}`,
      url: `/jummah/${citySlug}`,
      description: `${count} masjid listings with Friday prayer references`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can I find Jummah timings near me?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Open a city page from this Jummah hub and compare Friday prayer times for listed masjids.",
        },
      },
      {
        "@type": "Question",
        name: "Are Hyderabad and Pune Jummah pages available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, popular cities such as Hyderabad and Pune are included in the Jummah city listings when data is available.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Jummah Namaz Timings by City</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        Friday prayer discovery pages built from available masjid Jummah timings.
      </p>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Popular city pages</h2>
        <p className="mt-2 text-sm text-stone-600">
          Open a city to view masjid-wise Jummah times, addresses, and navigation options.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map(([citySlug, count]) => {
            const normalized = slugify(citySlug);
            return (
              <Link
                key={normalized}
                href={`/jummah/${normalized}`}
                className="rounded-[16px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800 transition hover:border-orange-300 hover:bg-orange-50"
              >
                Jummah in {deslugify(normalized)} ({count} masjids)
              </Link>
            );
          })}
        </div>
      </section>

      {featuredMasjids.length > 0 ? (
        <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-stone-900">Featured popular Jummah masjids (Hyderabad & Pune)</h2>
          <p className="mt-2 text-sm text-stone-600">
            These masjid pages include Friday prayer timing context and direct city-level Jummah discovery.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featuredMasjids.map((mosque) => {
              const citySlug = extractCityFromAddress(mosque.address);
              const jummahLabel = mosque.juma1 || mosque.juma2 || "--";
              return (
                <div key={mosque.id} className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                  <p className="text-sm font-semibold text-stone-900">{mosque.name}</p>
                  <p className="mt-1 text-xs text-stone-600">{deslugify(citySlug)} • Jummah {jummahLabel}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/masjid/${buildMasjidSlug(mosque)}`}
                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-white"
                    >
                      Open masjid page
                    </Link>
                    <Link
                      href={`/jummah/${citySlug}`}
                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-white"
                    >
                      Jummah in {deslugify(citySlug)}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </main>
  );
}
