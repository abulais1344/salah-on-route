import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Namaz at Airport Guide",
  description:
    "Learn where to offer namaz at airports, how to use prayer rooms, and how much gate buffer to keep before boarding.",
  alternates: { canonical: "/flight/namaz-at-airport" },
};

export default function NamazAtAirportGuidePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Where can I pray at an airport?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the terminal prayer room first when available. It is usually the safest option when boarding timelines are tight.",
        },
      },
      {
        "@type": "Question",
        name: "Should I leave the airport to pray at a nearby masjid?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For short layovers, stay inside terminal. For longer layovers, nearby masjid can be considered only when transport and return timing are predictable.",
        },
      },
      {
        "@type": "Question",
        name: "How much gate return buffer should I keep?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Keep around 25 to 45 minutes minimum buffer depending on layover length, gate distance, and boarding status.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mx-auto w-full max-w-4xl space-y-5">
        <header className="rounded-[22px] border border-stone-200 bg-white p-5">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Namaz at Airport: Quick Guide for Travellers
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
            If you are flying today, this guide helps you quickly decide where to pray before boarding and how early to return to your gate.
          </p>
        </header>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">Where to offer namaz at airport</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            <li>1. Use the terminal prayer room first whenever available.</li>
            <li>2. If the airport is crowded, avoid leaving the terminal unless layover is long.</li>
            <li>3. Keep minimum 25 to 45 minutes gate-return buffer based on boarding status.</li>
            <li>4. Recheck gate number and walking time before moving to prayer space.</li>
          </ul>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">When nearby masjid is practical</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            <li>1. Short layover under 60 min: do not leave terminal.</li>
            <li>2. Medium layover 60 to 180 min: terminal remains safest option.</li>
            <li>3. Long layover over 180 min: nearby masjid may be possible with transport certainty.</li>
          </ul>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">Plan your airport prayer quickly</h2>
          <p className="mt-2 text-sm text-stone-700">
            Use the live flight mode planner to check departure and arrival airport guidance for your trip.
          </p>
          <Link
            href="/flight"
            className="mt-4 inline-flex min-h-10 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Open flight prayer planner
          </Link>
        </section>
      </div>
    </main>
  );
}
