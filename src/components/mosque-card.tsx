"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import { formatAddressForDisplay } from "@/lib/address";
import {
  formatDisplayTime,
  formatPrayerLabel,
  getNextJamaat,
  getStatusTone,
} from "@/lib/jamaat";
import { trackEvent } from "@/lib/analytics";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import { buildMasjidSlug } from "@/lib/seo";
import type { MosqueView } from "@/types/mosque";

interface MosqueCardProps {
  mosque: MosqueView;
  onAddTimings?: (mosque: MosqueView) => void;
  isCreating?: boolean;
}

export function MosqueCard({ mosque, onAddTimings, isCreating = false }: MosqueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const directionsUrl = getGoogleMapsDirectionsUrl(mosque);
  const nextJamaat = useMemo(
    () => (mosque.hasJamaatData ? getNextJamaat(mosque.prayers, new Date()) : null),
    [mosque.hasJamaatData, mosque.prayers],
  );

  // Handle keyboard navigation
  useEffect(() => {
    if (selectedImageIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) =>
          prev === null ? null : prev === 0 ? mosque.images.length - 1 : prev - 1
        );
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) =>
          prev === null ? null : prev === mosque.images.length - 1 ? 0 : prev + 1
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, mosque.images.length]);

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
          onClick={() => trackEvent("navigate_click", { mosque_name: mosque.name, location: "card" })}
          className="inline-flex min-h-11 items-center rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-5 text-sm font-semibold !text-white visited:!text-white shadow-[0_8px_18px_rgba(30,64,175,0.18)] transition hover:brightness-[0.98]"
        >
          Navigate
        </a>

        <Link
          href={`/masjid/${buildMasjidSlug(mosque)}`}
          className="inline-flex min-h-11 items-center rounded-full border border-stone-300 px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
        >
          Masjid page
        </Link>

        {!mosque.hasJamaatData && onAddTimings ? (
          <button
            type="button"
            onClick={() => {
              trackEvent("update_timings_click", { mosque_name: mosque.name, location: "card" });
              onAddTimings?.(mosque);
            }}
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
            <>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {mosque.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className="group relative min-w-40 overflow-hidden rounded-[16px] border border-stone-200 bg-stone-100 transition hover:border-orange-300"
                  >
                    <Image
                      src={image.imageUrl}
                      alt={`${mosque.name} ${image.type}`}
                      className="h-24 w-full object-cover transition duration-300 group-hover:scale-105"
                      width={320}
                      height={192}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/20">
                      <svg
                        className="h-6 w-6 text-white opacity-0 transition duration-300 group-hover:opacity-100"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                        />
                      </svg>
                    </div>
                    <p className="px-3 py-2 text-xs font-medium uppercase tracking-[0.22em] text-stone-500">
                      {image.type}
                    </p>
                  </button>
                ))}
              </div>

              {/* Image Lightbox Modal */}
              {selectedImageIndex !== null ? (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                  onClick={() => setSelectedImageIndex(null)}
                >
                  <div
                    className="relative mx-4 w-full max-w-2xl rounded-[28px] bg-white shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedImageIndex(null)}
                      className="absolute -right-12 -top-12 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-4 sm:top-4 sm:bg-stone-900/50 sm:-right-auto sm:-top-auto"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-stone-100 sm:rounded-t-[28px]">
                      <Image
                        src={mosque.images[selectedImageIndex].imageUrl}
                        alt={`${mosque.name} image`}
                        fill
                        className="object-cover sm:rounded-t-[28px]"
                        sizes="(max-width: 640px) 100vw, 640px"
                        priority
                      />
                    </div>

                    {/* Info Bar */}
                    <div className="space-y-3 bg-white px-5 py-4 sm:rounded-b-[28px] sm:px-6 sm:py-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                          {mosque.images[selectedImageIndex].type} • {selectedImageIndex + 1} of{" "}
                          {mosque.images.length}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-stone-900">{mosque.name}</h3>
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() =>
                            setSelectedImageIndex(
                              selectedImageIndex === 0 ? mosque.images.length - 1 : selectedImageIndex - 1
                            )
                          }
                          className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setSelectedImageIndex(
                              selectedImageIndex === mosque.images.length - 1 ? 0 : selectedImageIndex + 1
                            )
                          }
                          className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                        >
                          Next
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      <p className="text-xs text-stone-500">
                        <span className="font-medium">Tip:</span> Use arrow keys or ESC to navigate and close
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
