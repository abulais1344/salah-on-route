import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Wuzu Tarika (Ablution Steps) for Travellers | Step-by-Step Guide",
  description:
    "Complete wuzu tarika guide for Muslim travellers - step-by-step instructions, tips for travel, dry ablution (tayammum) alternative, and practical airport/road advice.",
  alternates: { canonical: "/travel/wuzu-guide" },
  keywords: [
    "wuzu tarika",
    "wudu for travellers",
    "tayammum guide",
    "ablution steps",
    "travel wuzu",
    "airport wuzu",
    "road travel prayer",
  ],
  openGraph: {
    title: "Wuzu Tarika (Ablution Steps) for Travellers | Step-by-Step Guide",
    description:
      "Complete wuzu tarika guide for Muslim travellers - step-by-step instructions, tips for travel, dry ablution (tayammum) alternative, and practical airport/road advice.",
    url: "/travel/wuzu-guide",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Wuzu Tarika (Ablution Steps) for Travellers | Step-by-Step Guide",
    description:
      "Complete wuzu tarika guide for Muslim travellers - step-by-step instructions, tips for travel, dry ablution (tayammum) alternative, and practical airport/road advice.",
  },
};

export default function WuzuGuidePage() {
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to perform wuzu while travelling",
    description: "Step-by-step wuzu guidance for travellers using water or tayammum when needed.",
    step: [
      { "@type": "HowToStep", name: "Niyyah", text: "Form the intention for wuzu in your heart." },
      { "@type": "HowToStep", name: "Wash hands", text: "Wash both hands up to the wrists." },
      { "@type": "HowToStep", name: "Rinse mouth", text: "Rinse the mouth thoroughly." },
      { "@type": "HowToStep", name: "Rinse nose", text: "Clean the nose gently with water." },
      { "@type": "HowToStep", name: "Wash face", text: "Wash the full face from forehead to chin." },
      { "@type": "HowToStep", name: "Wash arms", text: "Wash both arms up to the elbows." },
      { "@type": "HowToStep", name: "Wipe head and wash feet", text: "Wipe the head and wash both feet up to the ankles." },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is wuzu (ablution)?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Wuzu is the ritual purification performed before prayer by washing specific parts of the body. It's a fundamental requirement in Islam before praying.",
        },
      },
      {
        "@type": "Question",
        name: "How can I do wuzu while travelling?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use available clean water. On flights, use airplane restroom sinks. At airports, use designated prayer room facilities or restrooms. On the road, carry water or find nearby rest areas.",
        },
      },
      {
        "@type": "Question",
        name: "What if water is not available?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can use tayammum (dry ablution) - wiping your face and hands with soil, sand, dust, or clean cloth if water is genuinely unavailable.",
        },
      },
      {
        "@type": "Question",
        name: "How long does wuzu take?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Wuzu typically takes 2-3 minutes for a careful, complete ablution. On flights or in time-pressured situations, a quick but thorough wuzu takes about 1-2 minutes.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_14px_45px_rgba(41,37,36,0.08)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">Prayer preparation</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">Wuzu Tarika (Ablution) for Travellers</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600 sm:text-base">
          Step-by-step wuzu guide specifically for travel situations - airports, flights, vehicles, and the road.
        </p>
      </header>

      {/* Essential First */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-gradient-to-b from-blue-50 to-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">What is Wuzu (Ablution)?</h2>
        <p className="mt-3 text-sm text-stone-700">
          Wuzu is the ritual purification Muslims perform before prayer. It involves washing specific body parts in a specific order. Wuzu is fard (obligatory) before prayer and is not complete until all steps are properly done.
        </p>
        <div className="mt-3 rounded-[12px] border border-blue-200 bg-blue-50 p-3">
          <p className="text-xs font-semibold text-blue-900">Key Point:</p>
          <p className="mt-1 text-xs text-blue-800">Your wuzu is valid whether at home, in an airport restroom, or on an airplane. The method and intention remain the same.</p>
        </div>
      </section>

      {/* Complete Wuzu Steps */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Complete Wuzu Steps (7 Steps)</h2>
        
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 1: Niyyah (Intention)</p>
            <p className="mt-2 text-xs text-stone-700">Form the intention in your heart to perform wuzu for prayer. You can say silently or aloud: "I intend to perform ablution for prayer."</p>
          </div>

          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 2: Wash Both Hands</p>
            <p className="mt-2 text-xs text-stone-700">Wash both hands up to and including the wrists. Use right hand first, then left. Wash three times, ensuring water reaches between fingers and under nails.</p>
          </div>

          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 3: Rinse the Mouth</p>
            <p className="mt-2 text-xs text-stone-700">Take water in your right hand, bring it to your mouth, and rinse thoroughly. Swish it around inside. Do this three times.</p>
          </div>

          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 4: Rinse the Nose</p>
            <p className="mt-2 text-xs text-stone-700">Using your right hand, bring water to your nostrils and inhale gently to clean inside the nose. Use your left hand to help wipe if needed. Repeat three times.</p>
          </div>

          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 5: Wash the Face</p>
            <p className="mt-2 text-xs text-stone-700">Wash your entire face from forehead to chin, and from ear to ear. Water should reach your beard if you have one. Repeat three times for completeness.</p>
          </div>

          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 6: Wash Both Arms</p>
            <p className="mt-2 text-xs text-stone-700">Wash your right forearm from wrist to elbow, ensuring water covers the entire arm. Then wash your left forearm the same way. Repeat three times for each arm.</p>
          </div>

          <div className="rounded-[12px] border-l-4 border-l-orange-600 bg-orange-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">Step 7: Wipe Head and Wash Feet</p>
            <p className="mt-2 text-xs text-stone-700">Wet both hands and wipe over your head from front to back (or any portion). Then wash both feet up to the ankles, ensuring water reaches between the toes. Repeat three times for each foot.</p>
          </div>
        </div>
      </section>

      {/* Travel-Specific Tips */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Wuzu Tips for Different Travel Situations</h2>
        
        <div className="mt-4 space-y-3">
          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">✈️ On Airplane Flights</p>
            <ul className="mt-2 text-xs text-stone-700 space-y-1">
              <li>• Use the airplane restroom sink with available water</li>
              <li>• Work carefully in the compact space</li>
              <li>• Go slightly before prayer time to avoid rush</li>
              <li>• If water is limited, use it efficiently - don't waste</li>
              <li>• If you can't do full wuzu, see Tayammum section below</li>
            </ul>
          </div>

          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">🏨 At Airports & Terminals</p>
            <ul className="mt-2 text-xs text-stone-700 space-y-1">
              <li>• Most major airports have designated prayer rooms with ablution facilities</li>
              <li>• Check the airport map or ask staff for prayer facility locations</li>
              <li>• Restroom sinks work well if prayer room not available</li>
              <li>• Take your time - airports are usually not rushed for ablution</li>
              <li>• Carry a small towel or use hand dryer</li>
            </ul>
          </div>

          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">🚗 During Road Travel / On Highways</p>
            <ul className="mt-2 text-xs text-stone-700 space-y-1">
              <li>• Keep a bottle of water in your vehicle</li>
              <li>• Stop at rest areas or service stations to perform wuzu</li>
              <li>• Many rest areas have washrooms; bring paper towel</li>
              <li>• Plan prayer stops in advance using our Route feature</li>
              <li>• If genuinely impossible, you may use Tayammum</li>
            </ul>
          </div>

          <div className="rounded-[12px] border border-green-200 bg-green-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">🚌 On Buses & Long-Distance Coaches</p>
            <ul className="mt-2 text-xs text-stone-700 space-y-1">
              <li>• Most buses stop at designated breaks - do wuzu then</li>
              <li>• Bus station restrooms usually have water</li>
              <li>• Carry wet wipes as backup for quick refreshment</li>
              <li>• Modern buses may have onboard restroom facilities</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tayammum Alternative */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-gradient-to-b from-purple-50 to-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Tayammum - When Water Isn't Available</h2>
        <p className="mt-3 text-sm text-stone-700">
          If water is genuinely unavailable or using it would cause hardship (extreme cold, illness, danger), Islam permits Tayammum - a substitute for wuzu using dry material.
        </p>

        <div className="mt-4 rounded-[12px] border border-purple-200 bg-white p-3">
          <p className="font-semibold text-stone-900 text-sm">Tayammum Steps (3 Steps):</p>
          <div className="mt-3 space-y-2 text-xs text-stone-700">
            <p><strong>Step 1:</strong> Form the intention of Tayammum</p>
            <p><strong>Step 2:</strong> Strike both your hands on clean earth, sand, dust, or a cloth with dust</p>
            <p><strong>Step 3:</strong> Wipe your face and both arms up to the elbows with the dust/sand-covered hands</p>
          </div>
        </div>

        <div className="mt-3 rounded-[12px] border border-purple-200 bg-purple-50 p-3">
          <p className="text-xs font-semibold text-purple-900">When is Tayammum Used?</p>
          <p className="mt-2 text-xs text-purple-800">• No water available for miles</p>
          <p className="text-xs text-purple-800">• Using water would harm you (severe illness, extreme cold)</p>
          <p className="text-xs text-purple-800">• Medical condition makes water use harmful</p>
          <p className="text-xs text-purple-800">• On some flights where water access is truly limited</p>
        </div>
      </section>

      {/* Maintaining Wuzu */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Things That Break Wuzu</h2>
        <p className="mt-3 text-sm text-stone-700">Your wuzu becomes invalid if:</p>
        <ul className="mt-3 space-y-2 text-sm text-stone-700">
          <li>✗ Urination or defecation</li>
          <li>✗ Passing gas</li>
          <li>✗ Bleeding or wound discharge</li>
          <li>✗ Sleep (especially deep sleep)</li>
          <li>✗ Vomiting</li>
          <li>✗ Intoxication</li>
          <li>✗ Loss of consciousness</li>
        </ul>
        <p className="mt-3 text-xs text-stone-600">If any of these occur during travel, simply perform wuzu again before prayer.</p>
      </section>

      {/* Travel Packing Tips */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Travel Packing: Wuzu Essentials</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">For Short Trips</p>
            <ul className="mt-2 text-xs text-stone-700 space-y-1">
              <li>• Small hand towel</li>
              <li>• Tissues or cloth</li>
            </ul>
          </div>
          <div className="rounded-[12px] border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold text-stone-900 text-sm">For Long Trips</p>
            <ul className="mt-2 text-xs text-stone-700 space-y-1">
              <li>• Water bottle</li>
              <li>• Hand towel & washcloth</li>
              <li>• Wet wipes (backup)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Common Questions About Wuzu While Travelling</h2>
        <div className="mt-4 space-y-4">
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: Do I need warm water for wuzu?</p>
            <p className="mt-2 text-sm text-stone-700">No. Cold water is perfectly fine. Warm water is preferred for comfort but not required Islamically.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: Can I reuse wuzu from before the journey?</p>
            <p className="mt-2 text-sm text-stone-700">If your wuzu is still intact (nothing has broken it), yes. But if time has passed or you slept, perform fresh wuzu before prayer.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: What if I'm very tired on a flight - can I skip wuzu?</p>
            <p className="mt-2 text-sm text-stone-700">No. Wuzu is obligatory before prayer. Even if tired, take a few minutes for wuzu. It also helps refresh you before prayer.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: Is it okay to use airplane water for wuzu?</p>
            <p className="mt-2 text-sm text-stone-700">Yes. Airplane water is safe and permissible for wuzu. However, some scholars note it may taste/smell unusual, so be aware.</p>
          </div>
          <div>
            <p className="font-semibold text-stone-900 text-sm">Q: Can I perform wuzu while the flight is in turbulence?</p>
            <p className="mt-2 text-sm text-stone-700">Be very careful. For safety, do wuzu during calm flight or use Tayammum if turbulence is severe. Safety comes first.</p>
          </div>
        </div>
      </section>

      {/* Related Links */}
      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-900">Related Travel Guides</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link href="/travel/safar-dua" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition">Travel Dua (Safar Dua)</Link>
          <Link href="/travel/qasar-namaz-guide" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition">Qasar Namaz</Link>
          <Link href="/travel/namaz-in-airplane" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition">Prayer on Flights</Link>
          <Link href="/flight/namaz-at-airport" className="rounded-[12px] border border-stone-300 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition">Airport Prayer Guide</Link>
          <Link href="/travel" className="rounded-[12px] border border-blue-300 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition sm:col-span-2">← Back to Travel Hub</Link>
        </div>
      </section>
    </main>
  );
}