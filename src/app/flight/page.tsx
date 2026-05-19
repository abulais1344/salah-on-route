import type { Metadata } from "next";
import Link from "next/link";
import { FlightPrayerPlanner } from "@/components/flight-prayer-planner";

export const metadata: Metadata = {
  title: "Prayer-Friendly Flight Planner",
  description:
    "Plan airport and in-flight prayer moments with a simple timeline for Muslim travellers.",
  alternates: { canonical: "/flight" },
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
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Back to home
          </Link>
        </div>

        <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Flight mode</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Prayer-Friendly Flight Planner
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
            Built for travellers flying across cities and timezones. Plan prayer moments before boarding,
            during long flights, and after landing.
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
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              Namaz at airport guide
            </Link>
            <Link
              href="/flight/in-flight-namaz"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              In-flight namaz guide
            </Link>
            <Link
              href="/flight/layover-namaz-guide"
              className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-orange-300 hover:bg-orange-50"
            >
              Layover namaz guide
            </Link>
          </div>
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
      </div>
    </main>
  );
}
