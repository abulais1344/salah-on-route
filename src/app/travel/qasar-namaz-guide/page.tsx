import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Qasar Namaz - Complete Prayer Shortening Guide for Travellers",
  description:
    "Complete guide to Qasar (shortened prayer) during travel - which prayers shorten, how many rakats, Islamic rulings, and practical traveller tips.",
  alternates: { canonical: "/travel/qasar-namaz-guide" },
  keywords: [
    "qasar namaz",
    "shortened prayer",
    "travel prayer ruling",
    "qasar for travellers",
    "travel namaz",
    "prayer shortening",
    "qasar guide",
  ],
  openGraph: {
    title: "Qasar Namaz - Complete Prayer Shortening Guide for Travellers",
    description:
      "Complete guide to Qasar (shortened prayer) during travel - which prayers shorten, how many rakats, Islamic rulings, and practical traveller tips.",
    url: "/travel/qasar-namaz-guide",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Qasar Namaz - Complete Prayer Shortening Guide for Travellers",
    description:
      "Complete guide to Qasar (shortened prayer) during travel - which prayers shorten, how many rakats, Islamic rulings, and practical traveller tips.",
  },
};

export default function QasarNamazGuidePage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to apply Qasar during travel",
    description: "Guide for shortening the four-rakat prayers during travel.",
    step: [
      { "@type": "HowToStep", name: "Check travel status", text: "Confirm you are travelling a qualifying distance or journey." },
      { "@type": "HowToStep", name: "Know the prayers", text: "Shorten Zuhr, Asr, and Isha from 4 rakats to 2 rakats." },
      { "@type": "HowToStep", name: "Confirm duration", text: "Return to full prayers when staying 4 or more days at destination." },
      { "@type": "HowToStep", name: "Follow your school", text: "Use your madhhab's guidance if you follow a specific school of thought." },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Which prayers are shortened during travel?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Zuhr (Noon), Asr (Afternoon), and Isha (Evening) prayers are shortened from 4 rakats to 2 rakats. Fajr (Dawn) and Maghrib (Sunset) are never shortened.",
        },
      },
      {
        "@type": "Question",
        name: "What is the distance requirement for Qasar?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Different Islamic schools have different views: Hanafi school requires approximately 48+ miles (78 km), while other schools consider even shorter journeys. On any significant journey (flight, long drive), Qasar is typically applicable.",
        },
      },
      {
        "@type": "Question",
        name: "When does Qasar end?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Qasar ends when you arrive and intend to stay at your destination for 4 days or more.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      
      <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Travel fiqh guide</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Qasar Namaz - Shortened Prayer During Travel</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          Understanding Qasar (prayer shortening) - a mercy from Allah for travellers. Complete fiqh guidance with practical examples.
        </p>
      </header>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">What is Qasar?</h2>
        <p className="mt-3 text-sm text-stone-700">
          Qasar means "to shorten." During travel, Muslims can shorten their four-rakat prayers (Zuhr, Asr, Isha) to two rakats. This is a mercy from Allah for travellers. Only the four-rakat prayers shorten; Fajr (2 rakats) and Maghrib (3 rakats) remain unchanged.
        </p>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Which Prayers Shorten?</h2>
        <div className="mt-4 space-y-2">
          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="text-sm font-semibold text-stone-900">✓ Zuhr (Noon): 4 rakats → 2 rakats</p>
          </div>
          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="text-sm font-semibold text-stone-900">✓ Asr (Afternoon): 4 rakats → 2 rakats</p>
          </div>
          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="text-sm font-semibold text-stone-900">✓ Isha (Evening): 4 rakats → 2 rakats</p>
          </div>
          <div className="rounded-[12px] border-l-4 border-l-stone-400 bg-stone-50 p-3">
            <p className="text-sm font-semibold text-stone-900">✗ Fajr (Dawn): Remains 2 rakats</p>
          </div>
          <div className="rounded-[12px] border-l-4 border-l-stone-400 bg-stone-50 p-3">
            <p className="text-sm font-semibold text-stone-900">✗ Maghrib (Sunset): Remains 3 rakats</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">When Do You Qualify for Qasar?</h2>
        <div className="mt-3 space-y-3">
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="text-xs font-semibold text-stone-900">Distance Requirement (varies by school)</p>
            <p className="mt-2 text-xs text-stone-700"><strong>Hanafi School:</strong> About 48 miles (78 km) or more</p>
            <p className="text-xs text-stone-700"><strong>Other Schools:</strong> Any significant journey (flights, long road trips)</p>
          </div>
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-900">When Does Qasar End?</p>
            <p className="mt-2 text-xs text-blue-800">When you arrive somewhere and intend to stay 4 or more days, Qasar ends. You return to full prayers (4 rakats).</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Practical Examples</h2>
        <div className="mt-3 space-y-2">
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold text-stone-900">✓ Flight to another city</p>
            <p className="mt-1 text-xs text-stone-700">Use Qasar (2 rakats) until you arrive and decide to stay 4+ days</p>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold text-stone-900">✓ Road trip (2-3 days)</p>
            <p className="mt-1 text-xs text-stone-700">Use Qasar during journey and while passing through</p>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="text-xs font-semibold text-stone-900">? Short local trip</p>
            <p className="mt-1 text-xs text-stone-700">Check with your local imam or follow your school's guidance</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Related Travel Guides</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/travel/wuzu-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Wuzu Tarika</Link>
          <Link href="/travel/safar-dua" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Travel Dua</Link>
          <Link href="/travel/namaz-in-airplane" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Prayer on Flights</Link>
          <Link href="/travel/namaz-in-car" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Prayer in Car</Link>
          <Link href="/travel" className="rounded-[12px] border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition sm:col-span-2">← Back to Travel Hub</Link>
        </div>
      </section>
    </main>
  );
}
