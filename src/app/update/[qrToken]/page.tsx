import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDisplayTime } from "@/lib/jamaat";
import { UpdateForm } from "@/components/update-form";
import { getMosqueByQrToken } from "@/lib/mosques";
import type { MosqueView } from "@/types/mosque";

export const dynamic = "force-dynamic";

export default async function UpdatePage({
  params,
  searchParams,
}: {
  params: Promise<{ qrToken: string }>;
  searchParams: Promise<{
    edit?: string;
    placeId?: string;
    name?: string;
    latitude?: string;
    longitude?: string;
    address?: string;
    distanceFromRouteKm?: string;
  }>;
}) {
  const { qrToken } = await params;
  const {
    edit,
    placeId,
    name,
    latitude,
    longitude,
    address,
    distanceFromRouteKm,
  } = await searchParams;
  const isEditing = edit === "1";
  const existingMosque = await getMosqueByQrToken(qrToken);

  const isDraftMode =
    !existingMosque &&
    qrToken === "new" &&
    isEditing &&
    Boolean(placeId && name && latitude && longitude);

  const draftLatitude = Number(latitude);
  const draftLongitude = Number(longitude);
  const draftDistance = Number(distanceFromRouteKm ?? "0");

  const draftMosque: MosqueView | null = isDraftMode
    ? {
        id: `draft-${placeId}`,
        name: name as string,
        latitude: Number.isNaN(draftLatitude) ? 0 : draftLatitude,
        longitude: Number.isNaN(draftLongitude) ? 0 : draftLongitude,
        placeId: placeId as string,
        address: address || "Address unavailable",
        qrToken: "draft",
        prayers: {
          fajr: null,
          zuhr: null,
          asr: null,
          maghrib: null,
          isha: null,
        },
        juma1: null,
        juma2: null,
        remarks: null,
        lastUpdated: new Date(0).toISOString(),
        isVerified: false,
        images: [],
        hasJamaatData: false,
        nextJamaat: null,
        updatedAgo: "Not updated yet",
        distanceFromRouteKm: Number.isNaN(draftDistance) ? 0 : draftDistance,
      }
    : null;

  const mosque = existingMosque || draftMosque;

  if (!mosque) {
    notFound();
  }

  const lastUpdatedDisplay =
    isDraftMode || !existingMosque
      ? "Not updated yet"
      : new Date(mosque.lastUpdated).toLocaleString();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff7ed_0%,#fafaf9_30%,#f8fafc_100%)] px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-stone-200/40 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-4xl flex-col gap-4 sm:gap-6">
        <div className="flex flex-col gap-3 rounded-[28px] border border-white/60 bg-white/70 p-3 shadow-[0_18px_60px_rgba(41,37,36,0.08)] backdrop-blur-sm sm:gap-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-600 sm:text-[11px]">
              <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
                Admin QR update
              </span>
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1">Mobile friendly</span>
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1">No login required</span>
            </div>
            <div>
              <p className="text-sm font-medium tracking-[0.18em] text-orange-700/90">Trusted mosque timing workflow</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 sm:text-4xl lg:text-5xl">
                {mosque.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:mt-3 sm:text-base">
                Review the current timings, scan a timetable photo if needed, verify the OCR output,
                and publish the final update in a few taps.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-stone-300 bg-white/90 px-5 text-sm font-semibold text-stone-700 transition hover:bg-white"
          >
            Back to map
          </Link>
        </div>

        {!isEditing ? (
          <section className="overflow-hidden rounded-[34px] border border-white/70 bg-white/80 shadow-[0_20px_90px_rgba(41,37,36,0.10)] backdrop-blur-sm">
            <div className="h-1.5 bg-[linear-gradient(90deg,#f97316_0%,#fb923c_45%,#fde68a_100%)]" />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">Step 1 of 2</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                    Confirm the mosque record
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                    Review the current timings and last update before opening the edit flow.
                  </p>
                </div>

                <div className="rounded-[22px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600 shadow-[0_12px_40px_rgba(41,37,36,0.05)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Last updated</p>
                  <p className="mt-1 font-semibold text-stone-900">{new Date(mosque.lastUpdated).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Fajr", mosque.prayers.fajr],
                  ["Zuhr", mosque.prayers.zuhr],
                  ["Asr", mosque.prayers.asr],
                  ["Maghrib", mosque.prayers.maghrib],
                  ["Isha", mosque.prayers.isha],
                  ["Juma 1", mosque.juma1],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[20px] border border-stone-200 bg-white p-4 shadow-[0_10px_30px_rgba(41,37,36,0.04)]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
                    <p className="mt-2 text-base font-semibold text-stone-900">
                      {value ? formatDisplayTime(value as string) : "--"}
                    </p>
                  </div>
                ))}
                <div className="rounded-[20px] border border-stone-200 bg-white p-4 shadow-[0_10px_30px_rgba(41,37,36,0.04)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Juma 2</p>
                  <p className="mt-2 text-base font-semibold text-stone-900">
                    {mosque.juma2 ? formatDisplayTime(mosque.juma2) : "Not listed"}
                  </p>
                </div>
              </div>

              <Link
                href={`/update/${mosque.qrToken}?edit=1`}
                className="mt-7 inline-flex min-h-14 items-center rounded-full bg-orange-600 px-6 text-base font-semibold text-white shadow-[0_14px_35px_rgba(249,115,22,0.26)] transition hover:bg-orange-700"
              >
                Update timings
              </Link>
            </div>
          </section>
        ) : (
          <div>
            <div className="mb-3 flex justify-start">
              <Link
                href={isDraftMode ? "/" : `/update/${mosque.qrToken}`}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 sm:w-auto"
              >
                {isDraftMode ? "Back to map" : "Back to summary"}
              </Link>
            </div>
            <UpdateForm
              mosque={mosque}
              lastUpdatedDisplay={lastUpdatedDisplay}
              createFromPlace={
                isDraftMode
                  ? {
                      placeId: placeId as string,
                      name: name as string,
                      latitude: Number.isNaN(draftLatitude) ? 0 : draftLatitude,
                      longitude: Number.isNaN(draftLongitude) ? 0 : draftLongitude,
                      address: address || "Address unavailable",
                      distanceFromRouteKm: Number.isNaN(draftDistance) ? 0 : draftDistance,
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}
