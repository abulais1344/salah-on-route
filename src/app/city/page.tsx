import Link from "next/link";
import type { Metadata } from "next";

import { listMosques } from "@/lib/mosques";
import { deslugify, getPopularCitySlugs } from "@/lib/seo";

export const metadata: Metadata = {
  title: "City Masjid Pages",
  description:
    "Browse city-specific masjid pages with namaz and jummah timing details for travellers and local users.",
  alternates: { canonical: "/city" },
};

export default async function CityIndexPage() {
  const mosques = await listMosques();
  const cities = getPopularCitySlugs(mosques).slice(0, 60);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">City Masjid Pages</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        City-wise discovery pages for nearby masjids and timing updates.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <Link
            key={city}
            href={`/city/${city}`}
            className="rounded-[16px] border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 transition hover:border-orange-300"
          >
            Nearby Masjids in {deslugify(city)}
          </Link>
        ))}
      </div>
    </main>
  );
}
