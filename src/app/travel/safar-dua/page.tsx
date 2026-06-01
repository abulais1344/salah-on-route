import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Safar Dua - Travel Prayers with Arabic & Translation | Namaz Route",
  description:
    "Complete safar dua guide for Muslim travellers - Arabic duas with English translations, timing, and practical reminders for car, bus, train, and flight journeys.",
  alternates: { canonical: "/travel/safar-dua" },
};

export default function SafarDuaPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is safar dua?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Safar dua (travel supplication) is an Islamic prayer recited at the beginning of a journey. It's mentioned in authentic hadith and helps commend the journey to Allah's protection.",
        },
      },
      {
        "@type": "Question",
        name: "When should I read safar dua?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Read it at the very start of your journey - when boarding a car, train, bus, or plane. Some scholars recommend reading it whenever you pause and restart travel.",
        },
      },
      {
        "@type": "Question",
        name: "Can I read safar dua in English?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, the dua can be read in Arabic or English. Reading with understanding is important. If you don't know Arabic, use the English translation provided.",
        },
      },
      {
        "@type": "Question",
        name: "What if I forget to read safar dua?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It's sunnah (recommended practice), not obligatory. If you forget, you can read it anytime during your journey. Make sincere dua asking Allah to protect your journey.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Travel supplication</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Safar Dua (Travel Prayer)</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          Authentic duas for starting a journey safely - with Arabic text, English translations, and practical guidance for every traveller.
        </p>
      </header>

      {/* Main Travel Dua */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-gradient-to-b from-orange-50 to-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Primary Travel Dua</h2>
        <p className="mt-3 text-xs text-stone-600">From Tirmidhi and other authentic hadith collections</p>
        
        <div className="mt-4 rounded-[16px] border border-orange-200 bg-white p-4">
          <p className="font-semibold text-stone-900">Arabic:</p>
          <p className="mt-2 text-2xl leading-loose text-right text-stone-900 font-semibold">
            اللَّهُمَّ إِنِّي أَسْأَلُكَ فِي سَفَرِي هَذَا الْبِرَّ وَالتَّقْوَى، وَمِنَ الْعَمَلِ مَا تَرْضَى، اللَّهُمَّ هَوِّنْ عَلَيْنَا سَفَرَنَا هَذَا، وَاطْوِ عَنَّا بُعْدَهُ، اللَّهُمَّ أَنْتَ الصَّاحِبُ فِي السَّفَرِ، وَالْخَلِيفَةُ فِي الْأَهْلِ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ، وَكَآبَةِ الْمَنْظَرِ، وَسُوءِ الْمُنْقَلَبِ فِي الْمَالِ وَالْأَهْلِ
          </p>
        </div>

        <div className="mt-4 rounded-[16px] border border-blue-200 bg-blue-50 p-4">
          <p className="font-semibold text-stone-900">English Translation:</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-800">
            "O Allah, I ask You in this journey for goodness and piety, and deeds that please You. O Allah, make this journey easy for us and bring its distance close. O Allah, You are the Companion during the journey and the Guardian over the family. O Allah, I seek refuge in You from the troubles of the journey, from seeing what saddens the heart, and from bad conditions of wealth and family during my absence."
          </p>
        </div>
      </section>

      {/* Alternative Shorter Dua */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Short Form (If Time Limited)</h2>
        <p className="mt-2 text-xs text-stone-600">Minimal recitation for quick journeys</p>
        
        <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-stone-900">Arabic:</p>
          <p className="mt-2 text-2xl leading-loose text-right text-stone-900 font-semibold">
            سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ
          </p>
        </div>

        <div className="mt-4 rounded-[16px] border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-stone-900">English Translation:</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-800">
            "Glory be to the One Who has made this easy for us, and we could not have done it without His help. Indeed, to our Lord we shall return."
          </p>
        </div>
      </section>

      {/* Return Journey Dua */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Dua When Returning Home</h2>
        <p className="mt-2 text-xs text-stone-600">Recite this when completing your journey</p>
        
        <div className="mt-4 rounded-[16px] border border-purple-200 bg-purple-50 p-4">
          <p className="font-semibold text-stone-900">Arabic:</p>
          <p className="mt-2 text-2xl leading-loose text-right text-stone-900 font-semibold">
            آيِبُونَ، تَائِبُونَ، عَابِدُونَ، لِرَبِّنَا حَامِدُونَ
          </p>
        </div>

        <div className="mt-4 rounded-[16px] border border-indigo-200 bg-indigo-50 p-4">
          <p className="font-semibold text-stone-900">English Translation:</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-800">
            "We return, repent, worship, and praise our Lord."
          </p>
          <p className="mt-3 text-xs text-stone-600">This short dua is traditionally recited when returning from travel, expressing gratitude and readiness to return to worship.</p>
        </div>
      </section>

      {/* Practical Guidelines */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Practical Tips for Travel Dua</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-sm text-stone-900">✓ Make Dua with Sincerity</p>
            <p className="mt-1 text-xs text-stone-600">Recite with intention and presence of heart. Even a few seconds of genuine dua is better than rushing through it.</p>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-sm text-stone-900">✓ Timing Matters</p>
            <p className="mt-1 text-xs text-stone-600">Before the journey starts is best - at home before leaving, or as you board your vehicle/flight.</p>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-sm text-stone-900">✓ Safe Recitation</p>
            <p className="mt-1 text-xs text-stone-600">If driving, recite before starting the car. On flights, recite quietly after boarding or on takeoff.</p>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-sm text-stone-900">✓ Additional Duas Are Welcome</p>
            <p className="mt-1 text-xs text-stone-600">After the main dua, you can add personal duas for safety, guidance, productivity, and blessings in your journey.</p>
          </div>
        </div>
      </section>

      {/* Quranic Verses on Travel */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Quranic Guidance on Travel</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border-l-4 border-l-amber-600 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-stone-900">"There is no blame upon you for seeking bounty from your Lord." (Quran 2:198)</p>
            <p className="mt-1 text-xs text-stone-600">Travel for legitimate means is encouraged in Islam.</p>
          </div>
          <div className="rounded-[12px] border-l-4 border-l-amber-600 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-stone-900">"Say: 'My Lord, cause me to enter a sound entry and exit, and give me from Yourself a supporting authority.'" (Quran 17:80)</p>
            <p className="mt-1 text-xs text-stone-600">A comprehensive dua for protection during any journey.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Frequently Asked Questions</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: Can women read safar dua?</p>
            <p className="mt-2 text-sm text-stone-700">Absolutely. All Muslims, men and women, are encouraged to make safar dua before traveling. Use the same duas provided above.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: What if I'm already on the journey?</p>
            <p className="mt-2 text-sm text-stone-700">You can still recite it during your journey. There's no strict time limit—even reading it at the next stop or while on a layover holds virtue.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: Is safar dua obligatory?</p>
            <p className="mt-2 text-sm text-stone-700">No, it's part of the Sunnah (recommended practice). However, making dua anytime is encouraged in Islam, so making safar dua is highly beneficial.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: Can I add my own personal duas?</p>
            <p className="mt-2 text-sm text-stone-700">Yes. After the main safar dua, you can add personal duas for specific needs—safety for family, health, or success in your journey's purpose.</p>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Continue Your Travel Preparation</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/travel/wuzu-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition">Wuzu Tarika for Travel</Link>
          <Link href="/travel/qasar-namaz-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition">Qasar Namaz Guide</Link>
          <Link href="/travel/namaz-in-airplane" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition">Prayer on Flights</Link>
          <Link href="/travel/travel-zikr" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition">Travel Zikr & Dhikr</Link>
          <Link href="/travel" className="rounded-[12px] border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition sm:col-span-2">← Back to Travel Hub</Link>
        </div>
      </section>
    </main>
  );
}