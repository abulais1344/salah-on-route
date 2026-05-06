"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDisplayTime } from "@/lib/jamaat";
import type { MosqueView, PrayerTimes } from "@/types/mosque";

interface UpdateFormProps {
  mosque: MosqueView;
  lastUpdatedDisplay: string;
  createFromPlace?: {
    placeId: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    distanceFromRouteKm?: number;
  };
}

export function UpdateForm({ mosque, lastUpdatedDisplay, createFromPlace }: UpdateFormProps) {
  const router = useRouter();
  const [prayers, setPrayers] = useState<PrayerTimes>({
    fajr: normalizeTimeForInput(mosque.prayers.fajr),
    zuhr: normalizeTimeForInput(mosque.prayers.zuhr),
    asr: normalizeTimeForInput(mosque.prayers.asr),
    maghrib: normalizeTimeForInput(mosque.prayers.maghrib),
    isha: normalizeTimeForInput(mosque.prayers.isha),
  });
  const [juma1, setJuma1] = useState(normalizeTimeForInput(mosque.juma1));
  const [juma2, setJuma2] = useState(normalizeTimeForInput(mosque.juma2));
  const [remarks, setRemarks] = useState(mosque.remarks ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [postSuccessRedirect, setPostSuccessRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      // Attempt to close the tab first (works when opened in a separate tab/window)
      window.close();

      // If browser blocks close (same-tab navigation, security policy), redirect gracefully
      window.setTimeout(() => {
        router.replace(postSuccessRedirect || "/");
      }, 200);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [message, postSuccessRedirect, router]);

  function updatePrayer(key: keyof PrayerTimes, value: string) {
    setPrayers((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      const deviceId = getDeviceId();

      formData.set("deviceId", deviceId);
      formData.set("fajr", prayers.fajr || "");
      formData.set("zuhr", prayers.zuhr || "");
      formData.set("asr", prayers.asr || "");
      formData.set("maghrib", prayers.maghrib || "");
      formData.set("isha", prayers.isha || "");
      formData.set("juma1", juma1);
      formData.set("juma2", juma2);
      formData.set("remarks", remarks);
      files.forEach((file) => formData.append("images", file));

      if (createFromPlace) {
        formData.set("placeId", createFromPlace.placeId);
        formData.set("name", createFromPlace.name);
        formData.set("latitude", String(createFromPlace.latitude));
        formData.set("longitude", String(createFromPlace.longitude));
        formData.set("address", createFromPlace.address);
        formData.set("distanceFromRouteKm", String(createFromPlace.distanceFromRouteKm ?? 0));
      }

      const endpoint = createFromPlace
        ? "/api/mosques/create-and-update-from-place"
        : `/api/update/${mosque.qrToken}`;

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as {
        message?: string;
        error?: string;
        warning?: string;
        redirectTo?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Update failed.");
      }

      setMessage(data.warning ? `${data.message} ${data.warning}` : data.message || "Updated.");
      setPostSuccessRedirect(createFromPlace ? data.redirectTo || "/" : "/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Update failed.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[32px] border border-stone-200 bg-white p-5 shadow-[0_18px_70px_rgba(41,37,36,0.08)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Update all timings</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
            Step 2 of 2. Pre-filled values, one tap submit, no login required.
          </p>
        </div>
        <div className="rounded-[20px] bg-stone-100 px-4 py-3 text-sm text-stone-600">
          Last updated: {lastUpdatedDisplay}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(prayers).map(([prayer, value]) => (
          <label key={prayer} className="space-y-2 rounded-[22px] bg-stone-50 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">
              {prayer}
            </span>
            <input
              type="time"
              value={value ?? ""}
              onChange={(event) => updatePrayer(prayer as keyof PrayerTimes, event.target.value)}
              className="min-h-12 w-full rounded-[16px] border border-stone-200 bg-white px-3 text-stone-900 focus:border-orange-400 focus:outline-none"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 rounded-[22px] bg-amber-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-700">جمعہ | Juma 1</span>
          <input
            type="time"
            value={juma1}
            onChange={(event) => setJuma1(event.target.value)}
            className="min-h-12 w-full rounded-[16px] border border-amber-200 bg-white px-3 text-stone-900 focus:border-orange-400 focus:outline-none"
          />
          {juma1 ? (
            <button
              type="button"
              onClick={() => setJuma1("")}
              className="text-left text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Clear Juma 1
            </button>
          ) : null}
        </label>
        <label className="space-y-2 rounded-[22px] bg-amber-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.26em] text-amber-700">Juma 2</span>
          <input
            type="time"
            value={juma2}
            onChange={(event) => setJuma2(event.target.value)}
            className="min-h-12 w-full rounded-[16px] border border-amber-200 bg-white px-3 text-stone-900 focus:border-orange-400 focus:outline-none"
          />
          {juma2 ? (
            <button
              type="button"
              onClick={() => setJuma2("")}
              className="text-left text-xs font-semibold text-amber-700 hover:text-amber-800"
            >
              Clear Juma 2
            </button>
          ) : null}
        </label>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <label className="space-y-2 rounded-[22px] bg-stone-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Remarks</span>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Second jamaat available, women section available, limited parking..."
            rows={5}
            className="w-full rounded-[16px] border border-stone-200 bg-white px-3 py-3 text-stone-900 focus:border-orange-400 focus:outline-none"
          />
        </label>

        <label className="space-y-2 rounded-[22px] bg-stone-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 5))}
            className="block min-h-12 w-full rounded-[16px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700 focus:border-orange-400 focus:outline-none"
          />
          <p className="text-xs leading-5 text-stone-500">
            Upload up to 5 images for parking, entrance, or facilities.
          </p>
        </label>
      </div>

      <div className="mt-6 rounded-[24px] bg-stone-950 p-5 text-stone-50">
        <p className="text-xs uppercase tracking-[0.28em] text-stone-400">Preview</p>
        <p className="mt-2 text-lg font-semibold">
          Next displayed Jummah: {juma1 ? formatDisplayTime(juma1) : "--"}
          {juma2 ? ` and ${formatDisplayTime(juma2)}` : ""}
        </p>
      </div>

      {message ? (
        <div className="mt-4 rounded-[20px] bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{message}</p>
          <p className="mt-1 text-xs text-emerald-700">
            Success. This tab will close automatically in a few seconds.
          </p>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-[20px] bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-6 flex min-h-16 w-full items-center justify-center rounded-full bg-orange-600 px-6 text-base font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? "Updating..." : "Update timings"}
      </button>
    </form>
  );
}

function getDeviceId() {
  const key = "namaz-route-device-id";
  const existing = window.localStorage.getItem(key);

  if (existing) {
    return existing;
  }

  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

function normalizeTimeForInput(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const raw = value.trim();
  if (!raw) {
    return "";
  }

  const hhmmOrHhmmss = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\.\d+)?$/);
  if (hhmmOrHhmmss) {
    const hours = Number(hhmmOrHhmmss[1]);
    const minutes = Number(hhmmOrHhmmss[2]);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    const period = ampm[3].toUpperCase();

    if (minutes < 0 || minutes > 59 || hours < 1 || hours > 12) {
      return "";
    }

    if (period === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return "";
}
