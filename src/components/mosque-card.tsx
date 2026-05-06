"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { formatAddressForDisplay } from "@/lib/address";
import {
  formatDisplayTime,
  formatPrayerLabel,
  getNextJamaat,
  getStatusTone,
} from "@/lib/jamaat";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import type { MosqueView } from "@/types/mosque";

interface MosqueCardProps {
  mosque: MosqueView;
  onAddTimings?: (mosque: MosqueView) => void;
  isCreating?: boolean;
}

export function MosqueCard({ mosque, onAddTimings, isCreating = false }: MosqueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const directionsUrl = getGoogleMapsDirectionsUrl(mosque);
  const nextJamaat = useMemo(
    () => (mosque.hasJamaatData ? getNextJamaat(mosque.prayers, new Date()) : null),
    [mosque.hasJamaatData, mosque.prayers],
  );

  return (
    <article className="rounded-[26px] border border-stone-200 bg-white p-4 shadow-[0_12px_40px_rgba(41,37,36,0.08)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <h3 className="truncate text-lg font-semibold tracking-tight text-stone-900 sm:text-xl">
            {mosque.name}
          </h3>
          <p className="text-sm font-medium text-stone-700">
            {typeof mosque.distanceKm === "number"
              ? `${mosque.distanceKm.toFixed(1)} km away`
              : typeof mosque.distanceFromRouteKm === "number"
                ? `${mosque.distanceFromRouteKm.toFixed(1)} km off route`
                : "Available in the masjid list"}
          </p>
          <p className="line-clamp-1 text-xs text-stone-500">{formatAddressForDisplay(mosque.address)}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
            {mosque.isVerified ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800">
                Verified
              </span>
            ) : null}
            <span>Updated {mosque.updatedAgo}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-[20px] bg-stone-950 px-4 py-3 text-stone-50">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-stone-400">Next نماز</p>
          {nextJamaat ? (
            <>
              <p className="mt-1 text-base font-semibold sm:text-lg">
                {formatPrayerLabel(nextJamaat.prayer)}{" "}
                {nextJamaat.relativeText}
                {!nextJamaat.isTomorrow && nextJamaat.status !== "Missed" && (
                  <span className="ml-1 text-sm font-normal text-stone-400">• {nextJamaat.urgencyLabel}</span>
                )}
              </p>
              <p className="text-xs text-stone-300">{nextJamaat.displayTime}</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm font-medium text-stone-300">No jamaat data yet</p>
              <p className="mt-0.5 text-xs text-stone-500">Help others by adding timings</p>
            </>
          )}
        </div>
        {nextJamaat ? (
          <span
            className={`rounded-full px-3 py-2 text-xs font-semibold ${getStatusTone(nextJamaat.status)}`}
          >
            {nextJamaat.status}
          </span>
        ) : (
          <span className="rounded-full bg-indigo-100 px-3 py-2 text-xs font-semibold text-indigo-700">
            Missing
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-5 text-sm font-semibold !text-white visited:!text-white shadow-[0_8px_18px_rgba(30,64,175,0.18)] transition hover:brightness-[0.98]"
        >
          Navigate
        </a>

        {!mosque.hasJamaatData && onAddTimings ? (
          <button
            type="button"
            onClick={() => onAddTimings?.(mosque)}
            disabled={isCreating}
            className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCreating ? "Creating..." : "Add timings"}
          </button>
        ) : mosque.hasJamaatData ? (
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            {isExpanded ? "Hide details" : "View details"}
          </button>
        ) : null}
      </div>

      {isExpanded && mosque.hasJamaatData ? (
        <div className="mt-5 space-y-4 border-t border-stone-200 pt-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Object.entries(mosque.prayers).map(([prayer, time]) => (
              <div key={prayer} className="rounded-[16px] bg-stone-100 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">{prayer}</p>
                <p className="mt-1 text-base font-semibold text-stone-900">
                  {time ? formatDisplayTime(time) : "--"}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[18px] bg-amber-50 px-4 py-3 text-stone-800">
            <p className="text-xs uppercase tracking-[0.26em] text-amber-700">جمعہ | Jummah</p>
            <div className="mt-2 space-y-1 text-sm font-medium">
              <p>Juma 1: {mosque.juma1 ? formatDisplayTime(mosque.juma1) : "--"}</p>
              <p>Juma 2: {mosque.juma2 ? formatDisplayTime(mosque.juma2) : "Not listed"}</p>
            </div>
          </div>

          {mosque.remarks ? (
            <div className="rounded-[18px] border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-700">
              {mosque.remarks}
            </div>
          ) : null}

          {mosque.images.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {mosque.images.map((image) => (
                <div
                  key={image.id}
                  className="min-w-40 overflow-hidden rounded-[16px] border border-stone-200 bg-stone-100"
                >
                  <Image
                    src={image.imageUrl}
                    alt={`${mosque.name} ${image.type}`}
                    className="h-24 w-full object-cover"
                    width={320}
                    height={192}
                    loading="lazy"
                  />
                  <p className="px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
                    {image.type}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
