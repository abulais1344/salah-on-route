import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Layover Namaz Guide",
  description:
    "Layover namaz guide with short, medium, and long layover recommendations and safe gate return buffers.",
  alternates: { canonical: "/flight/layover-namaz-guide" },
};

export default function LayoverNamazGuidePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I leave the airport during a layover to pray?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Usually not for short layovers. For long layovers, only consider leaving if transport and return times are highly predictable.",
        },
      },
      {
        "@type": "Question",
        name: "What layover duration is considered safe for nearby masjid visits?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Layovers above 180 minutes are generally more suitable, but you should still keep a strong return buffer and account for airport processes.",
        },
      },
      {
        "@type": "Question",
        name: "How much return buffer should I keep before next boarding?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use at least 25 minutes for short layovers, around 45 minutes for medium layovers, and at least 60 minutes for long layovers.",
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
            Layover Namaz Guide: Where to Pray Between Flights
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
            Use this quick framework to decide whether to pray inside terminal or visit a nearby masjid during layover.
          </p>
        </header>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">Short layover (under 60 min)</h2>
          <p className="mt-2 text-sm text-stone-700">
            Pray inside terminal prayer room only. Keep at least 25 minutes gate buffer.
          </p>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">Medium layover (60 to 180 min)</h2>
          <p className="mt-2 text-sm text-stone-700">
            Terminal prayer room is recommended. Nearby masjid is only practical when transport and traffic are very predictable.
          </p>
          <p className="mt-1 text-sm text-stone-700">Keep around 45 minutes return buffer.</p>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">Long layover (over 180 min)</h2>
          <p className="mt-2 text-sm text-stone-700">
            Nearby masjid can be considered, but only if your return to airport is safe with a strong buffer.
          </p>
          <p className="mt-1 text-sm text-stone-700">Keep at least 60 minutes gate return buffer.</p>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">Try layover planning in live mode</h2>
          <p className="mt-2 text-sm text-stone-700">
            Enable layover mode in the flight planner to get airport-specific recommendations.
          </p>
          <Link
            href="/flight"
            className="mt-4 inline-flex min-h-10 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Open layover planner
          </Link>
        </section>
      </div>
    </main>
  );
}
