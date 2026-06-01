import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { formatAddressForDisplay } from "@/lib/address";
import { formatDisplayTime } from "@/lib/jamaat";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import { listMosques } from "@/lib/mosques";
import { ROUTE_SEO_PAGES, buildMasjidSlug, extractCityFromAddress, findRouteBySlug, getMosquesForRoute } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site-meta";

interface PageProps {
  params: Promise<{ routeName: string }>;
}

export function generateStaticParams() {
  return ROUTE_SEO_PAGES.map((route) => ({ routeName: route.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { routeName } = await params;
  const route = findRouteBySlug(routeName);

  if (!route) {
    return { title: "Route Not Found", robots: { index: false, follow: false } };
  }

  return {
    title: route.title,
    description: route.summary,
    keywords: [...route.cityKeywords, ...route.targetKeywords, "route masjid", "highway masjid", "travel prayer"],
    alternates: { canonical: `/route/${route.slug}` },
    openGraph: {
      title: `${route.title} | ${SITE_NAME}`,
      description: route.summary,
      url: `${SITE_URL}/route/${route.slug}`,
      type: "article",
      images: [{ url: `${SITE_URL}/favicon-512.png` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${route.title} | ${SITE_NAME}`,
      description: route.summary,
      images: [`${SITE_URL}/favicon-512.png`],
    },
  };
}

export default async function RouteSeoPage({ params }: PageProps) {
  const { routeName } = await params;
  const route = findRouteBySlug(routeName);

  if (!route) {
    notFound();
  }

  const mosques = await listMosques();
  const routeMosques = getMosquesForRoute(route, mosques).slice(0, 80);
  const jummahCityLinks = [...new Set(
    routeMosques
      .filter((mosque) => Boolean(mosque.juma1 || mosque.juma2))
      .map((mosque) => extractCityFromAddress(mosque.address)),
  )].slice(0, 8);
  const indiaWeekday = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  const isFridayInIndia = indiaWeekday.toLowerCase() === "friday";

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Route Pages", item: `${SITE_URL}/route` },
      { "@type": "ListItem", position: 3, name: route.title, item: `${SITE_URL}/route/${route.slug}` },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the best masjid on the ${route.title} route?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "The best stop is usually the one with the shortest detour and the safest prayer timing window for your journey.",
        },
      },
      {
        "@type": "Question",
        name: `Can I find jummah timings on this route page?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, when available the page highlights jummah timings for the route mosques that are already indexed.",
        },
      },
      {
        "@type": "Question",
        name: `How do I use this route page while travelling?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the list to compare mosque stops, prayer timings, route distance, and quick navigation before you leave the highway.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:pb-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="mb-4 text-xs text-stone-500">
        <Link href="/" className="hover:text-orange-700">Home</Link> /{" "}
        <Link href="/route" className="hover:text-orange-700">Route Pages</Link> /{" "}
        <span className="text-stone-700">{route.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{route.title}</h1>
          <p className="mt-2 text-sm text-stone-600">{route.summary}</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">
            This route page helps travellers find mosque stops, prayer timing references, and quick navigation links
            for highway journeys. Use it when searching for masjid on route, mosque near highway, or jummah timing
            guidance during road travel.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-400 hover:bg-stone-50"
        >
          Go to Home
        </Link>
      </div>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-stone-900">Traveller prayer stops</h2>
        <p className="mt-2 text-sm text-stone-600">
          Use these mosque stops during road travel. Each entry includes quick navigation and timing details.
        </p>

        {isFridayInIndia ? (
          <div className="mt-3 rounded-[14px] border border-amber-300 bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_100%)] px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Friday mode (India)</p>
            <p className="mt-1 text-sm font-medium text-amber-900">Jummah timings are highlighted below for quick planning.</p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3">
          {routeMosques.length > 0 ? (
            routeMosques.map((mosque) => (
              <article key={mosque.id} className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-stone-900">{mosque.name}</h3>
                    <p className="mt-1 text-xs text-stone-600">{formatAddressForDisplay(mosque.address)}</p>
                    <p className="mt-2 text-xs text-stone-500">
                      Fajr {mosque.prayers.fajr ? formatDisplayTime(mosque.prayers.fajr) : "--"} • Zuhr {mosque.prayers.zuhr ? formatDisplayTime(mosque.prayers.zuhr) : "--"} • Asr {mosque.prayers.asr ? formatDisplayTime(mosque.prayers.asr) : "--"}
                    </p>
                    {isFridayInIndia ? (
                      <p className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-300">
                        Jummah {mosque.juma1 ? formatDisplayTime(mosque.juma1) : "--"}
                        {mosque.juma2 ? ` • Juma 2 ${formatDisplayTime(mosque.juma2)}` : ""}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={getGoogleMapsDirectionsUrl(mosque)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white"
                    >
                      Navigate
                    </a>
                    <Link
                      href={`/masjid/${buildMasjidSlug(mosque)}`}
                      className="inline-flex min-h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:bg-white"
                    >
                      View page
                    </Link>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-stone-600">No mapped mosque entries yet for this route.</p>
          )}
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Why this route page matters</h2>
        <p className="mt-2 text-sm text-stone-600">
          Search engines need clear route intent. This page combines route-specific mosque names, prayer windows,
          and traveller-focused guidance so people searching for namaz timings on highways can land here directly.
        </p>
      </section>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Route FAQ</h2>
        <div className="mt-3 space-y-3 text-sm text-stone-700">
          <p><strong>How many route stops are shown?</strong> We show the most relevant mosque stops available for this route.</p>
          <p><strong>Why do some route cards not show a masjid page?</strong> Some discovered route stops do not have a dedicated page yet, so they show the add timings flow instead.</p>
          <p><strong>Can I navigate directly from this page?</strong> Yes, each stop includes quick navigation links for travellers.</p>
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Targeted travel queries</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {route.targetKeywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              {keyword}
            </span>
          ))}
        </div>
      </section>

      {jummahCityLinks.length > 0 ? (
        <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-stone-900">Jummah city pages on this route</h2>
          <p className="mt-2 text-sm text-stone-600">
            Friday prayer-focused pages for cities connected to this route.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {jummahCityLinks.map((citySlug) => (
              <Link
                key={citySlug}
                href={`/jummah/${citySlug}`}
                className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Jummah in {citySlug.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Need a different route?</h2>
        <p className="mt-2 text-sm text-stone-600">
          Go back to the homepage to search by your current location and find nearby masjids instantly.
        </p>
        <div className="mt-3">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white"
          >
            Open Home Search
          </Link>
        </div>
      </section>

      {/* Sticky mobile home-search bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/90 px-4 py-3 backdrop-blur sm:hidden">
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] py-3 text-sm font-semibold text-white shadow"
        >
          Search nearby masjids
        </Link>
      </div>
    </main>
  );
}
