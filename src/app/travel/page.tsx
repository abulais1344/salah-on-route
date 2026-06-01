import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Travel Prayer Hub | Safar Dua, Wuzu, Qasar Namaz, Car & Airplane Prayer",
  description:
    "A practical travel prayer hub with safar dua, wuzu tarika, qasar namaz, namaz in car, namaz in airplane, travel zikr, and hadith-based guidance.",
  alternates: { canonical: "/travel" },
  keywords: [
    "travel namaz",
    "safar dua",
    "wuzu tarika",
    "qasar namaz",
    "namaz in car",
    "namaz in airplane",
    "travel zikr",
    "travel prayer guide",
  ],
  openGraph: {
    title: "Travel Prayer Hub | Safar Dua, Wuzu, Qasar Namaz, Car & Airplane Prayer",
    description:
      "A practical travel prayer hub with safar dua, wuzu tarika, qasar namaz, namaz in car, namaz in airplane, travel zikr, and hadith-based guidance.",
    url: "/travel",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Travel Prayer Hub | Safar Dua, Wuzu, Qasar Namaz, Car & Airplane Prayer",
    description:
      "A practical travel prayer hub with safar dua, wuzu tarika, qasar namaz, namaz in car, namaz in airplane, travel zikr, and hadith-based guidance.",
  },
};

const sections = [
  ["Safar dua", "/travel/safar-dua"],
  ["Wuzu tarika", "/travel/wuzu-guide"],
  ["Qasar namaz guide", "/travel/qasar-namaz-guide"],
  ["Namaz in car", "/travel/namaz-in-car"],
  ["Namaz in airplane", "/travel/namaz-in-airplane"],
  ["Travel zikr & dua", "/travel/travel-zikr"],
  ["Hadith & benefits", "/travel/hadith-travel-benefits"],
] as const;

export default function TravelPrayerHubPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is this travel prayer hub for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It collects the most searched travel prayer topics in one place, including safar dua, wuzu, qasar namaz, and praying in car or airplane.",
        },
      },
      {
        "@type": "Question",
        name: "Is this hub meant for travellers only?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It is designed mainly for travellers, but the same content is useful for anyone planning prayer during long journeys.",
        },
      },
      {
        "@type": "Question",
        name: "Does this hub link to practical guides?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, each card opens a focused guide with practical steps and supporting guidance.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Travel prayer hub</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Travel Prayer Guides for Muslim Travellers
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 sm:text-base">
          Find safar dua, wuzu tarika, qasar namaz, prayer guidance for car and airplane travel, travel zikr,
          and hadith-based travel prayer benefits.
        </p>
      </header>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Start here</h2>
        <p className="mt-2 text-sm text-stone-600">
          Choose the topic that matches your journey. Each guide is written for quick reading on mobile before
          departure.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-4 text-sm font-semibold text-stone-800 transition hover:border-orange-300 hover:bg-orange-50"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Why this hub matters</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Travel prayer topics get a lot of search interest. A focused hub page helps Google understand that these
          pages belong to one useful theme instead of looking like isolated articles.
        </p>
      </section>
    </main>
  );
}