import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hadith & Benefits of Travel in Islam - Authentic References",
  description:
    "Authentic hadith references and scholarly commentary on travel, prayer, and spiritual benefits of journeys in Islamic tradition.",
  alternates: { canonical: "/travel/hadith-travel-benefits" },
};

export default function HadithTravelBenefitsPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can this page replace a scholar or formal fiqh source?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, this is a practical summary page. For rulings, always refer to trusted scholars and authentic sources.",
        },
      },
      {
        "@type": "Question",
        name: "Why include hadith and benefits on a travel site?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It adds helpful context for people searching travel prayer guidance and strengthens the site’s topical depth.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Reference page</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Hadith on Travel & Namaz Benefits</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          A practical page that points travellers toward the value of maintaining prayer and remembrance during a journey.
        </p>
      </header>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Hadith References on Travel</h2>
        <div className="mt-4 space-y-4">
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-4">
            <p className="font-semibold text-stone-900 text-sm">The Five Concessions for Travellers</p>
            <p className="mt-2 text-xs text-stone-700 mb-2">Prophet Muhammad (peace be upon him) said:</p>
            <p className="text-xs bg-white p-2 rounded italic text-stone-700 mb-2">
              "The traveller has five concessions: shortening the prayer, breaking the fast, not wiping over socks, mixing two prayers, and not paying zakat on trade goods."
            </p>
            <p className="text-xs text-blue-800"><strong>Reference:</strong> Sunan Ibn Majah, Sunan An-Nasa'i (Sahih - Authentic)</p>
            <p className="text-xs text-blue-800"><strong>Meaning:</strong> Allah has made journey easier by allowing prayer shortening (Qasar), fasting break, and other concessions.</p>
          </div>

          <div className="rounded-[12px] border border-green-200 bg-green-50 p-4">
            <p className="font-semibold text-stone-900 text-sm">Travel as Expiation</p>
            <p className="mt-2 text-xs text-stone-700 mb-2">Prophet Muhammad (peace be upon him) said:</p>
            <p className="text-xs bg-white p-2 rounded italic text-stone-700 mb-2">
              "Travel is a piece of punishment. It prevents one of you from eating, drinking, and sleeping."
            </p>
            <p className="text-xs text-green-800"><strong>Reference:</strong> Sahih Al-Bukhari (Sahih - Authentic)</p>
            <p className="text-xs text-green-800"><strong>Meaning:</strong> Journey's hardships expiate sins. Patience during travel brings reward.</p>
          </div>

          <div className="rounded-[12px] border border-purple-200 bg-purple-50 p-4">
            <p className="font-semibold text-stone-900 text-sm">Prayer is a Pillar - Never Abandoned</p>
            <p className="mt-2 text-xs text-stone-700 mb-2">Imam Ahmad (Musnad Ahmad) and other hadith compilers emphasize:</p>
            <p className="text-xs bg-white p-2 rounded italic text-stone-700 mb-2">
              Prayer is the most important pillar after La ilaha illallah. Even during travel, it remains obligatory and is NOT abandoned - only shortened (for some prayers).
            </p>
            <p className="text-xs text-purple-800"><strong>Reference:</strong> Hadith Traditions on Prayer Obligation</p>
            <p className="text-xs text-purple-800"><strong>Meaning:</strong> Maintaining prayer during travel is essential, though some concessions apply.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Spiritual Benefits of Travel</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">1. Renewed Faith Through Different Masjids</p>
            <p className="mt-2 text-xs text-stone-700">
              Praying in different mosques around the world connects you to the global Muslim community. Each masjid has unique spiritual atmosphere and teaches you about diverse Muslim cultures.
            </p>
          </div>

          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">2. Elevated Awareness of Allah (Taqwa)</p>
            <p className="mt-2 text-xs text-stone-700">
              Travel requires intentional prayer planning and Quranic reflection. This heightened consciousness of Allah during journey difficulties strengthens spiritual connection.
            </p>
          </div>

          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">3. Hardship as Spiritual Cleansing</p>
            <p className="mt-2 text-xs text-stone-700">
              The difficulties of travel (fatigue, prayer timing changes, unfamiliar places) act as expiation for sins. Patience during these challenges earns reward from Allah.
            </p>
          </div>

          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">4. Dua Acceptance During Journey</p>
            <p className="mt-2 text-xs text-stone-700">
              Islamic scholars note that dua made during travel has strong potential for acceptance. The traveller's heart is often focused and sincere in their supplications.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Scholarly Consensus on Travel Prayer</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">All Islamic Schools Agree On:</p>
            <ul className="mt-2 text-xs text-stone-700 space-y-1">
              <li>✓ Prayer is obligatory during travel (unlike fasting)</li>
              <li>✓ Qasar (shortening) is permissible for 4-rakat prayers</li>
              <li>✓ Jam' (combining prayers) is allowed during difficult travel conditions</li>
              <li>✓ Wuzu is obligatory before prayer, even while travelling</li>
              <li>✓ Tayammum (dry ablution) is permitted when water is unavailable</li>
            </ul>
          </div>

          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Differences Between Schools:</p>
            <p className="text-xs text-stone-700 mt-2">
              Islamic schools differ on distance requirements for Qasar (Hanafi = 48 miles, others more flexible) and some other details. Followers should refer to their local imam or school of thought.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Why Prayer During Travel Matters</h2>
        <div className="mt-4 space-y-2">
          <p className="text-sm text-stone-700">
            <strong>Connection to Allah:</strong> Travel tests faith. Maintaining prayer despite disruptions strengthens your relationship with Allah and demonstrates true commitment to His worship.
          </p>
          <p className="text-sm text-stone-700 mt-3">
            <strong>Spiritual Stability:</strong> Prayer provides consistency and grounding during travel chaos. It's an anchor that keeps you focused on what truly matters.
          </p>
          <p className="text-sm text-stone-700 mt-3">
            <strong>Dua Opportunity:</strong> Prayer times during travel offer precious moments to make personal dua (supplication) when your heart is receptive and sincere.
          </p>
          <p className="text-sm text-stone-700 mt-3">
            <strong>Community Connection:</strong> Praying in mosques you visit connects you to the larger Muslim ummah (community) worldwide, embodying Islamic brotherhood across distances.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Important Note</h2>
        <div className="rounded-[12px] border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-xs font-semibold text-yellow-900">For Religious Rulings:</p>
          <p className="mt-2 text-xs text-yellow-800">
            This page provides general guidance based on hadiths and scholarly consensus. For specific fiqh questions about your situation, consult trusted Islamic scholars, your local imam, or reliable Islamic reference sources. Different schools of Islamic jurisprudence may have different rulings.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Related Travel Guides</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/travel/safar-dua" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Safar Dua</Link>
          <Link href="/travel/travel-zikr" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Travel Zikr</Link>
          <Link href="/travel/qasar-namaz-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Qasar Namaz</Link>
          <Link href="/travel" className="rounded-[12px] border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 sm:col-span-2">← Back to Travel Hub</Link>
        </div>
      </section>
    </main>
  );
}