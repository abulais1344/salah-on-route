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
    <main className="min-h-screen bg-stone-100 px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:gap-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm sm:px-5 sm:py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              {mosque.name}
            </h1>
          </div>

          <Link
            href={isEditing ? (isDraftMode ? "/" : `/update/${mosque.qrToken}`) : "/"}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-stone-50 px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            {isEditing ? (isDraftMode ? "Back to map" : "Back to summary") : "Back to map"}
          </Link>
        </div>

        {!isEditing ? (
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="h-1 bg-orange-500" />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Step 1 of 2</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
                    Confirm the mosque record
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                    Review the current timings and last update before opening the edit flow.
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Last updated</p>
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
                  <div key={label} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</p>
                    <p className="mt-2 text-base font-semibold text-stone-900">
                      {value ? formatDisplayTime(value as string) : "--"}
                    </p>
                  </div>
                ))}
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Juma 2</p>
                  <p className="mt-2 text-base font-semibold text-stone-900">
                    {mosque.juma2 ? formatDisplayTime(mosque.juma2) : "Not listed"}
                  </p>
                </div>
              </div>

              <Link
                href={`/update/${mosque.qrToken}?edit=1`}
                className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-orange-600 px-6 text-base font-semibold text-white transition hover:bg-orange-700"
              >
                Update timings
              </Link>
            </div>
          </section>
        ) : (
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
        )}
      </div>
    </main>
  );
}
