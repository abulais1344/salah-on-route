import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "In-Flight Namaz Guide",
  description:
    "A practical in-flight namaz guide for Muslim travellers with prayer window planning before takeoff and after landing.",
  alternates: { canonical: "/flight/in-flight-namaz" },
};

export default function InFlightNamazGuidePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Should I pray before boarding or wait until in-flight?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If time allows, praying before boarding is usually easier and less uncertain. In-flight options can be used when the prayer window overlaps the journey and ground prayer is not feasible.",
        },
      },
      {
        "@type": "Question",
        name: "How can I estimate if prayer time falls during the flight?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Compare your departure time and flight duration against prayer windows at origin and destination. If overlap appears, prepare a practical in-flight plan before takeoff.",
        },
      },
      {
        "@type": "Question",
        name: "What should I prioritize when cabin constraints are high?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Prioritize safety, crew guidance, and realistic timing. Use the airport window whenever possible and keep your in-flight plan simple and prepared in advance.",
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
            In-Flight Namaz Guide: Plan Before You Fly
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
            This guide helps you decide whether prayer is likely in-flight, and what to do if your best window is before departure or after arrival.
          </p>
        </header>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">Before takeoff</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            <li>1. Check likely prayer slot in your flight timeline.</li>
            <li>2. If departure window is tight, offer at airport prayer room first.</li>
            <li>3. Keep travel essentials ready (wudu planning, prayer direction awareness, timing reminders).</li>
          </ul>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">During flight</h2>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            <li>1. Follow airline safety rules and cabin constraints.</li>
            <li>2. If movement is limited, keep prayer timing awareness and continue with best feasible option.</li>
            <li>3. Use layover or arrival windows if in-flight conditions are not practical.</li>
          </ul>
        </section>

        <section className="rounded-[20px] border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-stone-900">After landing</h2>
          <p className="mt-2 text-sm text-stone-700">
            Arrival airport prayer rooms are usually the fastest fallback if you miss an in-flight window.
          </p>
          <Link
            href="/flight"
            className="mt-4 inline-flex min-h-10 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            Open in-flight planner
          </Link>
        </section>
      </div>
    </main>
  );
}
