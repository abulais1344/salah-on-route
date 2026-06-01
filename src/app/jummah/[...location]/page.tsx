import Link from "next/link";
import { notFound } from "next/navigation";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import { getJummahLandingData, listMosques } from "@/lib/mosques";
import { buildJummahSeoMeta } from "@/lib/seo";

export async function generateStaticParams() {
  const mosques = await listMosques();
  const cityCounts = new Map<string, number>();

  for (const mosque of mosques) {
    if (!mosque.juma1 && !mosque.juma2) {
      continue;
    }
    const address = mosque.address.toLowerCase();
    const cityHints = ["hyderabad", "pune", "nanded", "solapur", "latur", "parbhani", "ardhapur"];
    const matched = cityHints.find((city) => address.includes(city));
    if (matched) {
      cityCounts.set(matched, (cityCounts.get(matched) || 0) + 1);
    }
  }

  return [...cityCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([city]) => ({ location: [city] }));
}

export async function generateMetadata({ params }: { params: Promise<{ location: string[] }> }) {
  const { location: locationParts } = await params;
  const location = locationParts?.join("/") || "";
  const data = await getJummahLandingData(location);
  if (!data) return {};
  return buildJummahSeoMeta({
    ...data,
    canonicalPath: `/jummah/${location}`,
  });
}

export default async function JummahLandingPage({ params }: { params: Promise<{ location: string[] }> }) {
  const { location: locationParts } = await params;
  const location = locationParts?.join("/") || "";
  const data = await getJummahLandingData(location);
  if (!data) return notFound();

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Jummah Namaz Timings in ${data.displayName}`,
    itemListElement: data.masjids.slice(0, 25).map((m, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: m.name,
      description: `Jummah ${m.jummah || "--"}`,
      item: `/update/${m.qrToken}`,
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the latest Jummah time in ${data.displayName}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Jummah timings differ by masjid in ${data.displayName}. Use this page to compare listed Friday prayer times and choose your stop accordingly.`,
        },
      },
      {
        "@type": "Question",
        name: `Are these Jummah timings updated regularly?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, these timings are community-updated and can be corrected via the update link for each masjid.",
        },
      },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:pb-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <nav className="mb-4 text-xs text-stone-500">
        <Link href="/" className="hover:text-orange-700">Home</Link> {" "}
        <span className="text-stone-700">Jummah in {data.displayName}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
            Jummah Namaz Timings in {data.displayName} Today
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Find latest Friday prayer timings for masjids in {data.displayName}. Updated: {data.lastUpdatedDisplay}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:border-stone-400 hover:bg-stone-50"
        >
          Go to Home
        </Link>
      </div>

      <section className="mt-6 rounded-[20px] border border-stone-200 bg-white p-5">
        <h2 className="text-xl font-semibold text-stone-900">Friday prayer stops</h2>
        <p className="mt-2 text-sm text-stone-600">
          Use these masjid entries for quick Jummah planning. Timings are community-updated.
        </p>

        <div className="mt-4 grid gap-3">
          {data.masjids.map((m) => (
            <article key={m.id} className="rounded-[16px] border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-stone-900">{m.name}</h3>
                  <p className="mt-1 text-xs text-stone-600">{m.address}</p>
                  <p className="mt-2 text-xs text-stone-500">Last updated: {m.lastUpdatedDisplay}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={getGoogleMapsDirectionsUrl(m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white"
                  >
                    Navigate
                  </a>
                  <span className="inline-flex min-h-10 items-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white">
                    Jummah {m.jummah || "--"}
                  </span>
                  <Link
                    href={`/update/${m.qrToken}`}
                    className="inline-flex min-h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700 hover:bg-white"
                  >
                    Update timing
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Targeted Jummah queries</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            `jummah time in ${data.displayName.toLowerCase()}`,
            `${data.displayName.toLowerCase()} friday prayer time`,
            `masjid jummah near ${data.displayName.toLowerCase()}`,
            `${data.displayName.toLowerCase()} jummah namaz timing today`,
          ].map((keyword) => (
            <span key={keyword} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              {keyword}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4 text-xs text-stone-600">
        For corrections, use the update button for the relevant masjid.
      </div>

      <section className="mt-6 rounded-[18px] border border-stone-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-stone-900">Looking for a different area?</h2>
        <p className="mt-2 text-sm text-stone-600">
          Go back to the homepage to search by your current location and find nearby masjids instantly.
        </p>
        <div className="mt-3">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white"
          >
            Open Home Search
          </Link>
        </div>
      </section>

      {/* Sticky mobile home-search bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/90 px-4 py-3 backdrop-blur sm:hidden">
        <Link
          href="/"
          className="flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] py-3 text-sm font-semibold text-white shadow"
        >
          Search nearby masjids
        </Link>
      </div>
    </main>
  );
}