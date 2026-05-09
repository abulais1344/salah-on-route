"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [postSuccessRedirect, setPostSuccessRedirect] = useState<string | null>(null);
  const totalUploadSize = files.reduce((sum, file) => sum + file.size, 0);
  const filePreviews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  );

  useEffect(() => {
    return () => {
      filePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

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

  function addFiles(incomingFiles: File[]) {
    if (incomingFiles.length === 0) {
      return;
    }

    const imageOnly = incomingFiles.filter((file) => isLikelyImageFile(file));
    const rejectedCount = incomingFiles.length - imageOnly.length;
    const nextFiles = [...files, ...imageOnly].slice(0, 5);
    const droppedByLimit = files.length + imageOnly.length > 5;

    const fileValidationError = validateSelectedFiles(nextFiles);
    if (fileValidationError) {
      setError(fileValidationError);
      return;
    }

    setFiles(nextFiles);

    if (rejectedCount > 0 || droppedByLimit) {
      const parts: string[] = [];
      if (rejectedCount > 0) {
        parts.push(`${rejectedCount} non-image file(s) skipped.`);
      }
      if (droppedByLimit) {
        parts.push("Only first 5 images were kept.");
      }
      setError(parts.join(" "));
      return;
    }

    setError(null);
  }

  function removeFileAtIndex(index: number) {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  function clearSelectedFiles() {
    setFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);
    setUploadStatus(null);

    try {
      const fileValidationError = validateSelectedFiles(files);
      if (fileValidationError) {
        throw new Error(fileValidationError);
      }

      const fileCount = files.length;
      if (fileCount > 0) {
        setUploadStatus(`Preparing ${fileCount} image${fileCount === 1 ? "" : "s"}...`);
      } else {
        setUploadStatus("Submitting update...");
      }

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

      if (fileCount > 0) {
        setUploadStatus(`Uploading ${fileCount} image${fileCount === 1 ? "" : "s"}...`);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      const data = (await parseApiResponse(response)) as {
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
      setUploadStatus(null);
    } catch (submitError) {
      setUploadStatus(null);
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

        <div className="space-y-2 rounded-[22px] bg-stone-50 p-4">
          <span className="text-xs font-semibold uppercase tracking-[0.26em] text-stone-500">Images</span>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              addFiles(Array.from(event.dataTransfer.files ?? []));
            }}
            className={`rounded-[18px] border border-dashed px-4 py-4 transition ${
              dragActive ? "border-orange-400 bg-orange-50" : "border-stone-300 bg-white"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              multiple
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
              className="block min-h-12 w-full rounded-[16px] border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700 focus:border-orange-400 focus:outline-none"
            />
            <p className="mt-2 text-xs leading-5 text-stone-500">
              Drag and drop or choose files. Up to 5 images, 5 MB each, 20 MB total.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-white px-3 py-2 text-xs text-stone-600">
            <p>
              Selected: <span className="font-semibold text-stone-800">{files.length}/5</span> (
              {formatFileSize(totalUploadSize)})
            </p>
            {files.length > 0 ? (
              <button
                type="button"
                onClick={clearSelectedFiles}
                className="rounded-full border border-stone-300 px-3 py-1 font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Clear all
              </button>
            ) : null}
          </div>

          {files.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
                Preview ({files.length})
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className="overflow-hidden rounded-[16px] border border-stone-200 bg-white"
                  >
                    <div className="relative aspect-[4/3] bg-stone-100">
                      {filePreviews[index] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={filePreviews[index]}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-center">
                          <p className="text-[10px] text-stone-400">
                            {file.type.startsWith("image/") ? "Loading..." : "📄"}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1 px-2 py-2">
                      <p className="truncate text-[11px] font-semibold text-stone-800">{file.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-stone-500">
                        {displayFileType(file)} • {formatFileSize(file.size)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFileAtIndex(index)}
                        className="text-[11px] font-semibold text-rose-700 transition hover:text-rose-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {mosque.images.length > 0 ? (
            <div className="space-y-2 rounded-[16px] border border-stone-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Existing images ({mosque.images.length})
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Tap image to preview
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {mosque.images.slice(0, 6).map((image) => (
                  <a
                    key={image.id}
                    href={image.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-[14px] border border-stone-200"
                  >
                    <div className="aspect-[4/3] bg-stone-100">
                      <Image
                        src={image.imageUrl}
                        alt={`${mosque.name} uploaded`}
                        fill
                        sizes="(max-width: 640px) 50vw, 180px"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                      View
                    </p>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <p className="text-xs leading-5 text-stone-500">
            Upload up to 5 images for parking, entrance, or facilities. HEIC/HEIF files are
            converted to JPEG automatically.
          </p>
        </div>
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
      {isSaving && uploadStatus ? (
        <div className="mt-4 rounded-[20px] bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {uploadStatus}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSaving}
        className="mt-6 flex min-h-16 w-full items-center justify-center rounded-full bg-orange-600 px-6 text-base font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? uploadStatus || "Updating..." : "Update timings"}
      </button>
    </form>
  );
}

function displayFileType(file: File) {
  if (file.type.startsWith("image/")) {
    return file.type.replace("image/", "").toUpperCase();
  }

  const extension = file.name.split(".").pop();
  return extension ? extension.toUpperCase() : "IMAGE";
}

function formatFileSize(bytes: number) {
  if (bytes <= 0) {
    return "0 B";
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function parseApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = (await response.text()).trim();
  if (!text) {
    return {};
  }

  return {
    error: text.length > 240 ? `${text.slice(0, 240)}...` : text,
  };
}

function validateSelectedFiles(files: File[]) {
  const MAX_FILE_COUNT = 5;
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

  if (files.length > MAX_FILE_COUNT) {
    return "You can upload up to 5 images.";
  }

  let totalBytes = 0;
  for (const file of files) {
    if (!isLikelyImageFile(file)) {
      return "Only image uploads are supported.";
    }

    if (file.size > MAX_FILE_BYTES) {
      return "Each image must be 5 MB or smaller.";
    }

    totalBytes += file.size;
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    return "Total image upload size must be 20 MB or smaller.";
  }

  return null;
}

function isLikelyImageFile(file: File) {
  if (file.type.startsWith("image/")) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".bmp",
    ".tif",
    ".tiff",
    ".heic",
    ".heif",
    ".avif",
  ].some((extension) => lowerName.endsWith(extension));
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
