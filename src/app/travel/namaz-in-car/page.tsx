import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Prayer While Driving (Namaz in Car) - Safety-First Guide",
  description:
    "Complete guide to prayer while road travelling - safety strategies, when to stop, how to pray in vehicle, rest stop facilities, and Islamic rulings for car prayer.",
  alternates: { canonical: "/travel/namaz-in-car" },
};

export default function NamazInCarPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I pray in a car while travelling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If stopping is not practical, travellers commonly look for the safest feasible option and follow local scholarly guidance.",
        },
      },
      {
        "@type": "Question",
        name: "Should I stop the car first?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Stopping first is usually better when safe and practical, especially if there is time to find a prayer place.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Travel prayer</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Namaz in Car</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          A practical, safety-first guide for travellers who need to think about prayer while in a car.
        </p>
      </header>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-gradient-to-b from-red-50 to-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Safety First - Core Principle</h2>
        <p className="mt-3 text-sm text-stone-700">
          Prayer is important, but safety of yourself, passengers, and others is MORE important. Never compromise driver safety or road safety to pray. Always stop the vehicle before performing prayer.
        </p>
        <div className="mt-3 rounded-[12px] border border-red-200 bg-white p-3">
          <p className="text-xs font-semibold text-red-900">Golden Rule:</p>
          <p className="mt-1 text-xs text-red-800">NEVER pray while driving. ALWAYS stop the vehicle safely and completely before beginning prayer.</p>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Best Places to Stop & Pray</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">1. Rest Area / Service Station</p>
            <p className="mt-2 text-xs text-stone-700">Official rest stops often have restrooms for wuzu. Many modern ones are clean with prayer-friendly facilities. Stop exactly at prayer time or slightly before.</p>
          </div>
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">2. Nearby Masjid or Prayer Room</p>
            <p className="mt-2 text-xs text-stone-700">Check your route map for nearby mosques BEFORE departing. Use our Route feature to see mosque locations along your journey. Step off highway onto side roads to reach them.</p>
          </div>
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">3. Empty Parking Lot / Safe Roadside</p>
            <p className="mt-2 text-xs text-stone-700">If no rest stop nearby, turn onto a quiet side road and park safely. Exit the roadway completely. Perform wuzu with water from your bottle and pray beside or near your vehicle.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Practical Prayer Scenarios</h2>
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Scenario 1: Rest Stop with Facilities</p>
            <p className="mt-2 text-xs text-stone-700">Stop at facilities 10 minutes before prayer time. Use restroom for wuzu. Pray in designated prayer area or outdoor space near rest stop. Takes 15-20 minutes total.</p>
          </div>
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Scenario 2: Rural Area (No Facilities)</p>
            <p className="mt-2 text-xs text-stone-700">Use your bottled water for wuzu (facing away from road for privacy). Lay down prayer cloth or mat on grass/ground. Perform prayer, then get back on road. Helps stay focused despite travel rush.</p>
          </div>
          <div className="rounded-[12px] border border-blue-200 bg-blue-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Scenario 3: Finding a Masjid</p>
            <p className="mt-2 text-xs text-stone-700">Use Google Maps or our Route feature to find mosques ahead. Take planned detour (10-15 min off highway) to reach it. Pray with Jamaat if time allows - gives spiritual boost for long drives.</p>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Scenario 4: Coming Up on Prayer Time Soon</p>
            <p className="mt-2 text-xs text-stone-700">If prayer will fall in next 30 min, start looking for safe stop (rest area, masjid). Don't rush and continue driving negligently. Plan ahead by checking prayer times before leaving.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Pre-Trip Prayer Planning</h2>
        <div className="mt-3 rounded-[12px] border border-blue-200 bg-blue-50 p-3">
          <p className="font-semibold text-stone-900 text-sm">Before You Leave</p>
          <ul className="mt-2 text-xs text-stone-700 space-y-1">
            <li>✓ Check prayer times for your departure and destination cities</li>
            <li>✓ Calculate driving time vs. prayer time windows</li>
            <li>✓ Find masjids along your route using our Route pages</li>
            <li>✓ Identify major rest stops on your highway route</li>
            <li>✓ Pack wuzu water bottle if rest stop access uncertain</li>
            <li>✓ Plan to pray BEFORE you're tired or rushed</li>
          </ul>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Islamic Rulings for Car Prayer</h2>
        <div className="mt-4 space-y-2">
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Can I pray INSIDE the car?</p>
            <p className="mt-2 text-xs text-stone-700">Generally, scholars prefer praying outside. Prayer requires space for bowing and prostration. Inside a cramped car is difficult. Pray outside when possible at rest stops.</p>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Can I combine prayers (Jam')?</p>
            <p className="mt-2 text-xs text-stone-700">Yes. If stop time is limited, you can combine Zuhr+Asr or Maghrib+Isha to pray together, reducing stops needed.</p>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">What about Qasar?</p>
            <p className="mt-2 text-xs text-stone-700">Yes, use Qasar on road trips. Shorten 4-rakat prayers to 2 rakats (Zuhr, Asr, Isha) to reduce time needed for stops.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Common Questions</h2>
        <div className="mt-4 space-y-3">
          <div>
            <p className="font-semibold text-stone-900 text-sm text-xs">Q: How often should I stop to pray?</p>
            <p className="mt-2 text-xs text-stone-700">Stop at each prayer time as it comes. Don't delay past prayer time window. Plan stops at major rest areas or masjids.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm text-xs">Q: What if I'm low on fuel near a prayer time?</p>
            <p className="mt-2 text-xs text-stone-700">Get fuel first, then find a safe place to pray. Don't pray while running on fumes - getting gas safely is part of responsible travel.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm text-xs">Q: Can passengers pray inside the car while driving?</p>
            <p className="mt-2 text-xs text-stone-700">Even passengers should wait to stop. Inside a moving or stopped car without proper space is difficult for proper prayer positions.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm text-xs">Q: Should I tell my passengers about prayer stops?</p>
            <p className="mt-2 text-xs text-stone-700">Yes. Inform passengers of planned stops. They may appreciate the rest break too. Explain it's a travel requirement for safety and focus.</p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Related Travel Guides</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/travel/qasar-namaz-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Qasar Namaz</Link>
          <Link href="/travel/wuzu-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Wuzu Tarika</Link>
          <Link href="/route" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100">Route Finder</Link>
          <Link href="/travel" className="rounded-[12px] border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 sm:col-span-2">← Back to Travel Hub</Link>
        </div>
      </section>
    </main>
  );
}