import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prayer on Flights (Namaz in Airplane) - Complete Guide",
  description:
    "Comprehensive guide to praying during flights - options for in-flight prayer at seat, using airline prayer rooms, time zones, direction finding, and practical timing strategies.",
  alternates: { canonical: "/travel/namaz-in-airplane" },
};

export default function NamazInAirplanePage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I pray while sitting on an airplane?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Travelers often look for the most feasible option while respecting airline rules and safety guidance.",
        },
      },
      {
        "@type": "Question",
        name: "Should I plan before boarding?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, the best plan is usually to check the flight window and prepare before takeoff.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Flight prayer</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Namaz in Airplane</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          A practical guide for prayer planning while sitting in an airplane or preparing before a flight.
        </p>
      </header>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Three Options for Prayer on Flights</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">1. Airport Prayer Room (Before Boarding)</p>
            <p className="mt-2 text-xs text-stone-700">Most major airports have prayer facilities. Use these before boarding if your flight time allows. This is the best option for complete prayer with full movements.</p>
          </div>
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">2. In-Flight Prayer at Your Seat</p>
            <p className="mt-2 text-xs text-stone-700">If a prayer falls during flight, use airline facilities (restroom for wuzu) then pray while seated at your seat or in the galley if space allows.</p>
          </div>
          <div className="rounded-[12px] border border-purple-200 bg-purple-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">3. Upon Arrival (Safest Option)</p>
            <p className="mt-2 text-xs text-stone-700">If in-flight prayer isn't practical, delay prayer until landing and use airport or hotel facilities at your destination.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">How to Pray at Your Seat</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-orange-200 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 1: Use Airplane Restroom for Wuzu</p>
            <p className="mt-2 text-xs text-stone-700">Go to the airplane lavatory and perform wuzu using the available sink. Use water carefully - airplane water is safe but limited.</p>
          </div>
          <div className="rounded-[12px] border border-orange-200 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 2: Return to Seat (or Galley)</p>
            <p className="mt-2 text-xs text-stone-700">Return to your seat. If the galley (kitchen area) has space and the crew permits, you can pray there for more room.</p>
          </div>
          <div className="rounded-[12px] border border-orange-200 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 3: Find Your Direction</p>
            <p className="mt-2 text-xs text-stone-700">Approximate the direction of Qibla (Mecca). Modern phones have accurate compass apps - use them. East during most flights from North America, but check the specific route.</p>
          </div>
          <div className="rounded-[12px] border border-orange-200 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 4: Seated Prayer</p>
            <p className="mt-2 text-xs text-stone-700">Perform prayer while seated if standing isn't safe during turbulence. Bow by bending forward, prostrate by bending fully. This is permitted on aircraft.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Time Zones & Prayer Timing</h2>
        <div className="mt-3 rounded-[12px] border border-blue-200 bg-blue-50 p-3">
          <p className="font-semibold text-stone-900 text-sm">Which time should you use?</p>
          <p className="mt-2 text-xs text-stone-700 mb-2">Use the time at your DEPARTURE city or DESTINATION city consistently. Don't switch times mid-flight.</p>
          <p className="text-xs text-blue-800"><strong>Example:</strong> Flying from New York to London - use NY time for prayer times while airborne, or use London time. Pick one and stick with it.</p>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Common Questions</h2>
        <div className="mt-4 space-y-3">
          <div>
            <p className="font-semibold text-stone-900 text-sm text-xs">Q: What if turbulence makes it unsafe to stand?</p>
            <p className="mt-2 text-xs text-stone-700">Pray while seated. Full bowing and prostration while seated is permissible if standing isn't safe.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm text-xs">Q: Can I use Qasar on flights?</p>
            <p className="mt-2 text-xs text-stone-700">Yes. Flights are travel, so you can use Qasar (2 rakats instead of 4) for Zuhr, Asr, and Isha.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm text-xs">Q: What if I miss a prayer on the flight?</p>
            <p className="mt-2 text-xs text-stone-700">Make up (Qada) the prayer at your destination when you have proper facilities and calm conditions.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm text-xs">Q: Should I inform the flight staff I'm praying?</p>
            <p className="mt-2 text-xs text-stone-700">You don't need to announce it. Simply tell crew you're using the restroom for wuzu. Prayer at your seat won't disturb others.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Related Travel Guides</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/travel/qasar-namaz-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Qasar Namaz</Link>
          <Link href="/travel/wuzu-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Wuzu Tarika</Link>
          <Link href="/flight/namaz-at-airport" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Airport Prayer</Link>
          <Link href="/travel" className="rounded-[12px] border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 sm:col-span-2">← Back to Travel Hub</Link>
        </div>
      </section>
    </main>
  );
}