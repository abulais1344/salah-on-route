import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { formatAddressForDisplay } from "@/lib/address";
import { formatDisplayTime } from "@/lib/jamaat";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import { listMosques } from "@/lib/mosques";
import { ROUTE_SEO_PAGES, buildMasjidSlug, findRouteBySlug, getMosquesForRoute } from "@/lib/seo";
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
    alternates: { canonical: `/route/${route.slug}` },
    openGraph: {
      title: `${route.title} | ${SITE_NAME}`,
      description: route.summary,
      url: `${SITE_URL}/route/${route.slug}`,
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Route Pages", item: `${SITE_URL}/route` },
      { "@type": "ListItem", position: 3, name: route.title, item: `${SITE_URL}/route/${route.slug}` },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:pb-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <nav className="mb-4 text-xs text-stone-500">
        <Link href="/" className="hover:text-orange-700">Home</Link> /{" "}
        <Link href="/route" className="hover:text-orange-700">Route Pages</Link> /{" "}
        <span className="text-stone-700">{route.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">{route.title}</h1>
          <p className="mt-2 text-sm text-stone-600">{route.summary}</p>
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
        <h2 className="text-lg font-semibold text-stone-900">Targeted travel queries</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {route.targetKeywords.map((keyword) => (
            <span key={keyword} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              {keyword}
            </span>
          ))}
        </div>
      </section>

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
