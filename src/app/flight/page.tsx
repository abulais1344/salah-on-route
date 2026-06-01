import type { Metadata } from "next";
import Link from "next/link";
import { FLIGHT_AIRPORTS } from "@/lib/flight-airports";
import { FlightPrayerPlanner } from "@/components/flight-prayer-planner";

export const metadata: Metadata = {
  title: "Flight Namaz Planner | Airport Prayer Rooms, In-Flight Namaz & Layover Guide",
  description:
    "Plan airport prayer rooms, in-flight namaz windows, and layover prayer options for Muslim travellers across major airports.",
  alternates: { canonical: "/flight" },
  keywords: [
    "flight namaz",
    "airport prayer room",
    "in-flight namaz",
    "layover prayer",
    "airport masjid",
    "flight prayer planner",
    "travel prayer",
  ],
  openGraph: {
    title: "Flight Namaz Planner | Airport Prayer Rooms, In-Flight Namaz & Layover Guide",
    description:
      "Plan airport prayer rooms, in-flight namaz windows, and layover prayer options for Muslim travellers across major airports.",
    url: "/flight",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Flight Namaz Planner | Airport Prayer Rooms, In-Flight Namaz & Layover Guide",
    description:
      "Plan airport prayer rooms, in-flight namaz windows, and layover prayer options for Muslim travellers across major airports.",
  },
};

interface FlightPlannerPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
    depart?: string;
    duration?: string;
    layover?: string;
    layoverHours?: string;
  }>;
}

export default async function FlightPlannerPage({ searchParams }: FlightPlannerPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen px-4 py-8 pb-24 sm:px-6 sm:pt-20 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Flight mode</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Prayer-Friendly Flight Planner
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
            Built for travellers flying across cities and timezones. Find airport prayer room guidance,
            likely in-flight namaz windows, and layover prayer planning in one place.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-stone-600">
            <span className="rounded-full bg-stone-100 px-3 py-1">Airport prayer guidance</span>
            <span className="rounded-full bg-stone-100 px-3 py-1">In-flight timeline</span>
            <span className="rounded-full bg-stone-100 px-3 py-1">Arrival masjid hints</span>
          </div>
        </header>

        <section className="rounded-[20px] border border-stone-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Popular guides</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Link
              href="/flight/namaz-at-airport"
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 transition hover:border-orange-300 hover:bg-orange-50"
            >
              <span className="text-xl leading-none">🕌</span>
              <div>
                <p className="text-sm font-semibold text-stone-800">Namaz at airport</p>
                <p className="text-xs text-stone-500">Prayer rooms, wudu areas &amp; timings</p>
              </div>
            </Link>
            <Link
              href="/flight/in-flight-namaz"
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 transition hover:border-orange-300 hover:bg-orange-50"
            >
              <span className="text-xl leading-none">✈️</span>
              <div>
                <p className="text-sm font-semibold text-stone-800">In-flight namaz</p>
                <p className="text-xs text-stone-500">Direction, position &amp; intention</p>
              </div>
            </Link>
            <Link
              href="/flight/layover-namaz-guide"
              className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 transition hover:border-orange-300 hover:bg-orange-50"
            >
              <span className="text-xl leading-none">🔁</span>
              <div>
                <p className="text-sm font-semibold text-stone-800">Layover namaz</p>
                <p className="text-xs text-stone-500">When to leave &amp; return safely</p>
              </div>
            </Link>
          </div>
        </section>

        <section className="hidden rounded-[20px] border border-stone-200 bg-white p-4 sm:block">
          <h2 className="text-lg font-semibold text-stone-900">Travel prayer tips</h2>
          <p className="mt-2 text-sm text-stone-600">
            Practical guides for safar dua, wuzu, qasar namaz, and praying while in a car or airplane.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/travel" className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50">Travel prayer hub</Link>
            <Link href="/travel/safar-dua" className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50">Safar dua</Link>
            <Link href="/travel/wuzu-guide" className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50">Wuzu tarika</Link>
            <Link href="/travel/qasar-namaz-guide" className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50">Qasar namaz guide</Link>
            <Link href="/travel/namaz-in-car" className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50">Namaz in car</Link>
            <Link href="/travel/namaz-in-airplane" className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50">Namaz in airplane</Link>
            <Link href="/travel/travel-zikr" className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50">Travel zikr & dua</Link>
            <Link href="/travel/hadith-travel-benefits" className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50">Hadith & benefits</Link>
          </div>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-4 sm:hidden">
          <details className="group">
            <summary className="list-none cursor-pointer rounded-[20px] border border-stone-200 bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 shadow-[0_8px_24px_rgba(41,37,36,0.04)] transition hover:shadow-[0_12px_32px_rgba(41,37,36,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Travel prayer guides</p>
                  <p className="mt-1 text-sm font-medium text-stone-700">Safar dua, wuzu, qasar namaz & more</p>
                </div>
                <svg
                  className="h-5 w-5 flex-shrink-0 text-stone-600 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </summary>

            <div className="mt-2 grid gap-2 rounded-[18px] border border-stone-200 bg-white p-3 shadow-[0_8px_24px_rgba(41,37,36,0.08)]">
              <div className="grid grid-cols-2 gap-2">
                <Link href="/travel/safar-dua" className="rounded-[14px] border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-center text-sm font-semibold text-orange-700 transition hover:bg-orange-100">Safar dua</Link>
                <Link href="/travel/wuzu-guide" className="rounded-[14px] border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-center text-sm font-semibold text-orange-700 transition hover:bg-orange-100">Wuzu tarika</Link>
                <Link href="/travel/qasar-namaz-guide" className="rounded-[14px] border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-center text-sm font-semibold text-orange-700 transition hover:bg-orange-100">Qasar namaz</Link>
                <Link href="/travel/namaz-in-airplane" className="rounded-[14px] border border-orange-200 bg-orange-50/60 px-3 py-2.5 text-center text-sm font-semibold text-orange-700 transition hover:bg-orange-100">In-flight namaz</Link>
              </div>
              <Link
                href="/travel"
                className="rounded-full border border-blue-300 bg-blue-50 px-4 py-2.5 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Explore all travel guides
              </Link>
            </div>
          </details>
        </section>

        <FlightPrayerPlanner
          initialDepartureCode={params.from}
          initialArrivalCode={params.to}
          initialDepartureDateTime={params.depart}
          initialDurationHoursText={params.duration}
          initialLayoverCode={params.layover}
          initialLayoverHoursText={params.layoverHours}
        />

        <div className="text-center text-sm text-stone-600">
          Looking for road travel mosques?{" "}
          <Link href="/" className="font-semibold text-orange-700 hover:text-orange-800">
            Go to Nearby & Route mode
          </Link>
        </div>

        <section className="rounded-[20px] border border-stone-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-stone-900">Popular airport prayer pages</h2>
          <p className="mt-2 text-sm text-stone-600">
            Use these airport-specific pages for prayer room guidance, nearest masjid hints, and flight planning.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {FLIGHT_AIRPORTS.slice(0, 12).map((airport) => (
              <Link
                key={airport.code}
                href={`/flight/${airport.code.toLowerCase()}`}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50"
              >
                {airport.city} ({airport.code}) airport prayer guide
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
