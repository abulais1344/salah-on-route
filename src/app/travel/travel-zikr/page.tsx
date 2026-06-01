import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Travel Zikr Collection - Adhkar & Duas for Muslim Travellers",
  description:
    "Complete collection of travel adhkar (remembrances) with Arabic, transliteration, and English/Urdu translations - duas for safety, journey blessing, and arrival.",
  alternates: { canonical: "/travel/travel-zikr" },
};

export default function TravelZikrPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What zikr can I do during travel?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Many travellers keep simple remembrance and dua practices that fit into the journey without disturbing safety or others.",
        },
      },
      {
        "@type": "Question",
        name: "Is travel zikr useful for flights and road trips?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, short travel zikr and dua reminders are useful for both road travel and flight journeys.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Travel remembrance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Travel Zikr & Dua</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          A light, practical guide for zikr and dua during travel, built for road trips and flight days.
        </p>
      </header>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">When to Do Travel Adhkar</h2>
        <div className="mt-4 space-y-2">
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-stone-900">Before Departure (at home)</p>
            <p className="text-xs text-stone-700 mt-1">Read SafarDua and journey blessing duas</p>
          </div>
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="text-xs font-semibold text-stone-900">During Travel (in car/flight)</p>
            <p className="text-xs text-stone-700 mt-1">Silent zikr, Quranic recitation, or short duas for peace and safety</p>
          </div>
          <div className="rounded-[12px] border border-purple-200 bg-purple-50 p-3">
            <p className="text-xs font-semibold text-stone-900">Upon Safe Arrival</p>
            <p className="text-xs text-stone-700 mt-1">Gratitude dua thanking Allah for safe journey</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Adhkar for Safe Journey</h2>
        
        <div className="mt-4 space-y-4">
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-4">
            <p className="font-semibold text-stone-900 text-sm">1. For Journey Blessing (Allahumma ishrah li hadha's-safar)</p>
            <div className="mt-3 space-y-2">
              <div className="bg-white p-3 rounded text-sm text-stone-700">
                <p className="text-right text-2xl leading-loose font-semibold text-stone-900">اللَّهُمَّ إِشْرَحْ لِي هَذَا السَّفَرَ وَيَسِّرْهُ لِي</p>
                <p className="mt-2 italic text-stone-600">Allahumma ishrah li hadha's-safara wa yassirhu li</p>
              </div>
              <p className="text-xs text-stone-700 mt-2"><strong>Translation:</strong> "O Allah, make this journey easy for me and facilitate it for me."</p>
              <p className="text-xs text-stone-600"><strong>When:</strong> Before starting journey or at beginning of trip</p>
            </div>
          </div>

          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-4">
            <p className="font-semibold text-stone-900 text-sm">2. For Safety During Travel (Allahumma inni a'udhu bika)</p>
            <div className="mt-3 space-y-2">
              <div className="bg-white p-3 rounded text-sm text-stone-700">
                <p className="text-right text-2xl leading-loose font-semibold text-stone-900">اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ وَكَآبَةِ الْمَنْظَرِ وَسُوءِ الْمُنْقَلَبِ</p>
                <p className="mt-2 italic text-stone-600">Allahumma inni a'udhu bika min wa'tha is-safari wa ka'bati al-manzari wa su'il munqalabi</p>
              </div>
              <p className="text-xs text-stone-700 mt-2"><strong>Translation:</strong> "O Allah, I seek refuge in You from the hardships of travel, from seeing unpleasant sights, and from an evil outcome."</p>
              <p className="text-xs text-stone-600"><strong>When:</strong> During journey when concerned about safety</p>
            </div>
          </div>

          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-4">
            <p className="font-semibold text-stone-900 text-sm">3. Upon Safe Arrival (Allahumma rabbitaj hahw wa akhlinee ilayh)</p>
            <div className="mt-3 space-y-2">
              <div className="bg-white p-3 rounded text-sm text-stone-700">
                <p className="text-right text-xl leading-loose font-semibold text-stone-900">اللَّهُمَّ رَبَّ السَّمَاوَاتِ السَّبْعِ وَرَبَّ الأَرْضِ وَرَبَّ الْعَرْشِ الْعَظِيمِ، رَبَّنَا وَرَبَّ كُلِّ شَيْءٍ، فَالِقَ الْحَبِّ وَالنَّوَىٰ، وَمُنْزِلَ التَّوْرَاةِ وَالْإِنْجِيلِ وَالْفُرْقَانِ</p>
                <p className="mt-2 italic text-stone-600">Allahumma Rabbas-samawatis-saba'i wa Rabbal-arda wa Rabbul-'Arshul-'Azeem...</p>
              </div>
              <p className="text-xs text-stone-700 mt-2"><strong>Translation:</strong> "O Allah, Lord of the seven heavens and Lord of the earth and Lord of the mighty Throne..." (Gratitude dua for safe arrival)</p>
              <p className="text-xs text-stone-600"><strong>When:</strong> Immediately upon arriving safely at destination</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Short Zikr for During Travel</h2>
        <p className="mt-3 text-sm text-stone-700 mb-4">These can be recited silently during travel</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-stone-900 text-xs">Subhan'Allah wa Bihamdihi (Glory and Praise)</p>
            <p className="text-right text-2xl leading-loose font-semibold text-stone-900 mt-2">سُبْحَانَ اللَّهِ وَبِحَمْدِهِ</p>
            <p className="text-xs italic text-stone-600 mt-1">Subhan'Allahi wa bihamdihi</p>
            <p className="text-xs text-stone-700 mt-2">Meaning: "Glory be to Allah and Praise be to Him"</p>
            <p className="text-xs text-stone-600">Repeat 100 times during travel for reward and peace</p>
          </div>

          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-stone-900 text-xs">La Hawla wa La Quwwata (Divine Will)</p>
            <p className="text-right text-2xl leading-loose font-semibold text-stone-900 mt-2">لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ</p>
            <p className="text-xs italic text-stone-600 mt-1">La hawla wa la quwwata illa bi-Allah</p>
            <p className="text-xs text-stone-700 mt-2">Meaning: "There is no power except with Allah"</p>
            <p className="text-xs text-stone-600">Recite for protection and reliance on Allah during travel</p>
          </div>

          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-stone-900 text-xs">Alhamdulillah (All Praise to Allah)</p>
            <p className="text-right text-2xl leading-loose font-semibold text-stone-900 mt-2">الْحَمْدُ لِلَّهِ</p>
            <p className="text-xs italic text-stone-600 mt-1">Al-hamdu li-Allah</p>
            <p className="text-xs text-stone-700 mt-2">Meaning: "All praise belongs to Allah"</p>
            <p className="text-xs text-stone-600">Simple gratitude zikr for continuous recitation during journey</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Quranic Verses for Travel</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-xs">Surah Al-Mulk (67:15)</p>
            <p className="text-xs text-stone-700 mt-2">Best chapter to recite during travel for safety and protection</p>
            <p className="text-xs text-stone-600 mt-1">Benefit: Protection throughout journey</p>
          </div>
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-xs">Ayat al-Kursi (2:255)</p>
            <p className="text-xs text-stone-700 mt-2">Powerful protection verse to recite before traveling</p>
            <p className="text-xs text-stone-600 mt-1">Benefit: Safety, protection, and spiritual strength</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">FAQ - Travel Adhkar</h2>
        <div className="mt-4 space-y-3">
          <div>
            <p className="font-semibold text-stone-900 text-xs">Q: Can I recite adhkar silently?</p>
            <p className="mt-1 text-xs text-stone-700">Yes. Silent zikr (in your heart) is valid and appropriate for travel, especially in flights or around others.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-xs">Q: Should I memorize these adhkar?</p>
            <p className="mt-1 text-xs text-stone-700">Memorizing helps, but carrying a travel dua card or reading from your phone is also acceptable.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-xs">Q: Can passengers recite adhkar together?</p>
            <p className="mt-1 text-xs text-stone-700">Yes, group zikr (silently or softly) in a group travel situation can be calming and spiritually uplifting.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Related Travel Guides</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/travel/safar-dua" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Safar Dua</Link>
          <Link href="/travel/wuzu-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Wuzu Tarika</Link>
          <Link href="/travel/qasar-namaz-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Qasar Namaz</Link>
          <Link href="/travel" className="rounded-[12px] border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 sm:col-span-2">← Back to Travel Hub</Link>
        </div>
      </section>
    </main>
  );
}