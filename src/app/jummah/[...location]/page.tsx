import Link from "next/link";
import { notFound } from "next/navigation";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import { getJummahLandingData } from "@/lib/mosques";
import { buildJummahSeoMeta } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ location: string[] }> }) {
  const { location: locationParts } = await params;
  const location = locationParts?.join("/") || "";
  const data = await getJummahLandingData(location);
  if (!data) return {};
  return buildJummahSeoMeta(data);
}

export default async function JummahLandingPage({ params }: { params: Promise<{ location: string[] }> }) {
  const { location: locationParts } = await params;
  const location = locationParts?.join("/") || "";
  const data = await getJummahLandingData(location);
  if (!data) return notFound();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:pb-8 sm:px-6 lg:px-8">
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