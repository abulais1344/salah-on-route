import Link from "next/link";
import type { Metadata } from "next";

import { ROUTE_SEO_PAGES } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Route Mosque Pages for Travellers",
  description:
    "Explore route-based masjid pages for Hyderabad, Pune, Nanded, and highway travel with namaz/jamaat timing references.",
  alternates: { canonical: "/route" },
};

export default function RouteIndexPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Route Masjid Pages</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        Dedicated SEO pages for highway and travel-route masjid discovery.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ROUTE_SEO_PAGES.map((route) => (
          <Link
            key={route.slug}
            href={`/route/${route.slug}`}
            className="rounded-[20px] border border-stone-200 bg-white p-5 shadow-[0_10px_24px_rgba(41,37,36,0.08)] transition hover:border-orange-300"
          >
            <h2 className="text-lg font-semibold text-stone-900">{route.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{route.summary}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
