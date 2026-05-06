import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDisplayTime } from "@/lib/jamaat";
import { UpdateForm } from "@/components/update-form";
import { getMosqueByQrToken } from "@/lib/mosques";

export const dynamic = "force-dynamic";

export default async function UpdatePage({
  params,
  searchParams,
}: {
  params: Promise<{ qrToken: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { qrToken } = await params;
  const { edit } = await searchParams;
  const isEditing = edit === "1";
  const mosque = await getMosqueByQrToken(qrToken);

  if (!mosque) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#fafaf9_32%,#f5f5f4_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
              Admin QR update
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              {mosque.name}
            </h1>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-12 items-center rounded-full border border-stone-300 px-5 text-sm font-semibold text-stone-700 transition hover:bg-white"
          >
            Back to map
          </Link>
        </div>

        {!isEditing ? (
          <section className="rounded-[30px] border border-stone-200 bg-white p-6 shadow-[0_18px_70px_rgba(41,37,36,0.08)] sm:p-8">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Update timings</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Step 1 of 2. Confirm mosque and last update, then continue to the one-click timing form.
            </p>

            <div className="mt-5 rounded-[20px] bg-stone-50 p-4 text-sm text-stone-700">
              <p>
                Last updated: <span className="font-semibold">{new Date(mosque.lastUpdated).toLocaleString()}</span>
              </p>
              <p className="mt-2">Fajr: {mosque.prayers.fajr ? formatDisplayTime(mosque.prayers.fajr) : "--"}</p>
              <p>Zuhr: {mosque.prayers.zuhr ? formatDisplayTime(mosque.prayers.zuhr) : "--"}</p>
              <p>Asr: {mosque.prayers.asr ? formatDisplayTime(mosque.prayers.asr) : "--"}</p>
              <p>Maghrib: {mosque.prayers.maghrib ? formatDisplayTime(mosque.prayers.maghrib) : "--"}</p>
              <p>Isha: {mosque.prayers.isha ? formatDisplayTime(mosque.prayers.isha) : "--"}</p>
              <p className="mt-2">Juma 1: {mosque.juma1 ? formatDisplayTime(mosque.juma1) : "--"}</p>
              <p>Juma 2: {mosque.juma2 ? formatDisplayTime(mosque.juma2) : "Not listed"}</p>
            </div>

            <Link
              href={`/update/${mosque.qrToken}?edit=1`}
              className="mt-6 inline-flex min-h-14 items-center rounded-full bg-orange-600 px-6 text-base font-semibold text-white transition hover:bg-orange-700"
            >
              Update timings
            </Link>
          </section>
        ) : (
          <div>
            <div className="mb-3">
              <Link
                href={`/update/${mosque.qrToken}`}
                className="inline-flex min-h-10 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-white"
              >
                Back to summary
              </Link>
            </div>
            <UpdateForm mosque={mosque} />
          </div>
        )}
      </div>
    </main>
  );
}
