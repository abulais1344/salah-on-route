import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FLIGHT_AIRPORT_CODES, getAirportByCode } from "@/lib/flight-airports";
import { SITE_URL } from "@/lib/site-meta";

interface AirportPageProps {
  params: Promise<{ airportCode: string }>;
}

export function generateStaticParams() {
  return FLIGHT_AIRPORT_CODES.map((code) => ({ airportCode: code.toLowerCase() }));
}

export async function generateMetadata({ params }: AirportPageProps): Promise<Metadata> {
  const { airportCode } = await params;
  const airport = getAirportByCode(airportCode);

  if (!airport) {
    return {
      title: "Airport Not Found",
      robots: { index: false, follow: false },
    };
  }

  const title = `Namaz at ${airport.code} Airport (${airport.city})`;
  const description = `Prayer room guidance, nearest masjid hints, airport masjid planning, and flight prayer support for ${airport.city} ${airport.code} airport.`;

  return {
    title,
    description,
    alternates: { canonical: `/flight/${airport.code.toLowerCase()}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/flight/${airport.code.toLowerCase()}`,
      type: "article",
    },
  };
}

export default async function AirportPrayerPage({ params }: AirportPageProps) {
  const { airportCode } = await params;
  const airport = getAirportByCode(airportCode);

  if (!airport) {
    notFound();
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Airport prayer guide</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Namaz at {airport.code} Airport
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600 sm:text-base">
            {airport.city}, {airport.country}
          </p>
          <p className="mt-3 text-sm leading-6 text-stone-700">
            This page helps Muslim travellers quickly decide whether to use the airport prayer room, visit a nearby
            masjid, or continue to the flight planner for in-flight namaz timing.
          </p>
        </header>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-stone-900">Prayer space info</h2>
          <p className="mt-2 text-sm text-stone-700">{airport.prayerSpace}</p>
          <p className="mt-3 text-sm text-stone-700">Nearest masjid: {airport.nearestMasjid}</p>
          <p className="text-sm text-stone-600">Approx travel: {airport.nearestMasjidTravel}</p>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-stone-900">Helpful airport links</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/flight"
              className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Flight prayer planner
            </Link>
            <Link
              href="/masjid"
              className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Popular masjid pages
            </Link>
            <Link
              href="/route"
              className="rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Route mosque pages
            </Link>
          </div>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-stone-900">Frequently asked questions</h2>
          <div className="mt-3 space-y-3 text-sm text-stone-700">
            <p><strong>Can I pray at the airport?</strong> Yes, use the terminal prayer room when available.</p>
            <p><strong>Can I visit a nearby masjid?</strong> Yes, if your layover or departure buffer is long enough.</p>
            <p><strong>Should I use the flight planner?</strong> Yes, it helps if you want in-flight or arrival prayer planning.</p>
          </div>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-stone-900">Plan your flight timeline</h2>
          <p className="mt-2 text-sm text-stone-700">
            Use the planner to combine airport prayer prep and in-flight prayer windows.
          </p>
          <Link
            href={`/flight?from=${airport.code}&to=DXB&duration=4`}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Open flight planner
          </Link>
        </section>
      </div>
    </main>
  );
}
