import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Namaz Route",
  description: "Important usage and accuracy disclaimer for Namaz Route.",
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Disclaimer</h1>
      <p className="mt-2 text-sm text-stone-600">Last updated: 6 May 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-stone-700">
        <p>
          Jamaat times and masjid details are provided for convenience and may be community-updated.
          Namaz Route does not guarantee that every listing is complete, current, or accurate at all times.
        </p>
        <p>
          Always confirm prayer and jamaat timings with the masjid when timing is critical.
        </p>
        <p>
          Navigation, distance, and ETA depend on third-party map providers and real-world conditions.
        </p>
      </div>
    </main>
  );
}
