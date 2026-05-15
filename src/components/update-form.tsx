"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { formatDisplayTime } from "@/lib/jamaat";
import { TimetableUpload } from "@/components/timetable-upload";
import type { ExtractedPrayerTimes } from "@/lib/extract-prayer-times";
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

type FormStep = 1 | 2 | 3;

interface UpdateDraft {
  activeStep: FormStep;
  prayers: PrayerTimes;
  juma1: string;
  juma2: string;
  remarks: string;
}

export function UpdateForm({ mosque, lastUpdatedDisplay, createFromPlace }: UpdateFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const draftKey = getUpdateDraftStorageKey(mosque.qrToken, createFromPlace?.placeId);
  const initialDraft = readUpdateDraft(draftKey);
  const [prayers, setPrayers] = useState<PrayerTimes>(
    () =>
      initialDraft?.prayers || {
        fajr: normalizeTimeForInput(mosque.prayers.fajr),
        zuhr: normalizeTimeForInput(mosque.prayers.zuhr),
        asr: normalizeTimeForInput(mosque.prayers.asr),
        maghrib: normalizeTimeForInput(mosque.prayers.maghrib),
        isha: normalizeTimeForInput(mosque.prayers.isha),
      },
  );
  const [juma1, setJuma1] = useState(() => initialDraft?.juma1 ?? normalizeTimeForInput(mosque.juma1));
  const [juma2, setJuma2] = useState(() => initialDraft?.juma2 ?? normalizeTimeForInput(mosque.juma2));
  const [remarks, setRemarks] = useState(() => initialDraft?.remarks ?? mosque.remarks ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [postSuccessRedirect, setPostSuccessRedirect] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<FormStep>(() => initialDraft?.activeStep ?? 1);
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

  function applyExtractedTimings(extracted: ExtractedPrayerTimes) {
    setPrayers((current) => ({
      fajr: extracted.fajr ?? current.fajr,
      zuhr: extracted.zuhr ?? current.zuhr,
      asr: extracted.asr ?? current.asr,
      maghrib: extracted.maghrib ?? current.maghrib,
      isha: extracted.isha ?? current.isha,
    }));

    if (extracted.jumma) {
      setJuma1(extracted.jumma);
    }

    setActiveStep(2);
  }

  const hasAnyPrayerValue =
    Object.values(prayers).some((value) => Boolean(value)) || Boolean(juma1) || Boolean(juma2);
  const baselinePrayers: PrayerTimes = {
    fajr: normalizeTimeForInput(mosque.prayers.fajr),
    zuhr: normalizeTimeForInput(mosque.prayers.zuhr),
    asr: normalizeTimeForInput(mosque.prayers.asr),
    maghrib: normalizeTimeForInput(mosque.prayers.maghrib),
    isha: normalizeTimeForInput(mosque.prayers.isha),
  };
  const baselineJuma1 = normalizeTimeForInput(mosque.juma1);
  const baselineJuma2 = normalizeTimeForInput(mosque.juma2);
  const baselineRemarks = mosque.remarks ?? "";
  const reviewItems = buildReviewItems({
    prayers,
    baselinePrayers,
    juma1,
    baselineJuma1,
    juma2,
    baselineJuma2,
    remarks,
    baselineRemarks,
    newImagesCount: files.length,
  });

  function moveToStep(step: FormStep) {
    setActiveStep(step);
    setError(null);
  }

  function goToNextStep() {
    setActiveStep((current) => (current === 3 ? 3 : ((current + 1) as FormStep)));
    setError(null);
  }

  function goToPreviousStep() {
    setActiveStep((current) => (current === 1 ? 1 : ((current - 1) as FormStep)));
    setError(null);
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const draft: UpdateDraft = {
      activeStep,
      prayers,
      juma1,
      juma2,
      remarks,
    };

    window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
  }, [activeStep, draftKey, juma1, juma2, prayers, remarks]);

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
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 pb-20 shadow-sm sm:p-7"
    >
      <div className="-mx-4 -mt-4 mb-5 h-1 bg-blue-600 sm:-mx-7 sm:-mt-7 sm:mb-6" />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Guided update flow</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            Update mosque timings
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-stone-600 sm:text-base">
            Import, verify, and publish in three steps.
          </p>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Last updated</p>
          <p className="mt-1 font-semibold text-stone-900">{lastUpdatedDisplay}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1.5 sm:mt-5 sm:gap-2">
        {[
          { id: 1 as FormStep, title: "1", label: "Photo" },
          { id: 2 as FormStep, title: "2", label: "Verify" },
          { id: 3 as FormStep, title: "3", label: "Publish" },
        ].map((step) => {
          const isActive = activeStep === step.id;
          const isCompleted = activeStep > step.id;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => moveToStep(step.id)}
              className={`rounded-lg border px-3 py-2 text-left transition ${
                isActive
                  ? "border-blue-300 bg-blue-50"
                  : isCompleted
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-stone-200 bg-white"
              }`}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.1em] ${
                  isActive ? "text-blue-700" : isCompleted ? "text-emerald-700" : "text-stone-500"
                }`}
              >
                {step.title}
              </p>
              <p className="text-sm font-semibold text-stone-900">{step.label}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-stone-500">
        <span>Draft auto-save enabled</span>
        <span className="font-semibold text-stone-600">Auto-saved</span>
      </div>

      {activeStep === 1 ? (
        <section className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:mt-5 sm:p-4">
          <TimetableUpload onApply={applyExtractedTimings} />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goToNextStep}
              className="hidden min-h-11 rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-5 text-sm font-semibold text-white transition hover:brightness-[0.98] sm:inline-flex"
            >
              Continue to timings
            </button>
            <button
              type="button"
              onClick={() => moveToStep(2)}
              className="hidden min-h-11 rounded-full border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 sm:inline-flex"
            >
              Skip photo scan and enter manually
            </button>
          </div>
        </section>
      ) : null}

      {activeStep === 2 ? (
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(prayers).map(([prayer, value]) => (
          <label
            key={prayer}
            className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:p-4"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
              {prayer}
            </span>
            <input
              type="time"
              value={value ?? ""}
              onChange={(event) => updatePrayer(prayer as keyof PrayerTimes, event.target.value)}
              className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-stone-900 focus:border-blue-300 focus:outline-none"
            />
          </label>
        ))}
        </div>
      ) : null}

      {activeStep === 2 ? (
        <>
          <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-2">
        <label className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">جمعہ | Juma 1</span>
          <input
            type="time"
            value={juma1}
            onChange={(event) => setJuma1(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 text-stone-900 focus:border-blue-300 focus:outline-none"
          />
          {juma1 ? (
            <button
              type="button"
              onClick={() => setJuma1("")}
              className="text-left text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Clear Juma 1
            </button>
          ) : null}
        </label>
        <label className="space-y-2 rounded-xl border border-blue-200 bg-blue-50 p-3 sm:p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Juma 2</span>
          <input
            type="time"
            value={juma2}
            onChange={(event) => setJuma2(event.target.value)}
            className="min-h-11 w-full rounded-lg border border-blue-200 bg-white px-3 text-stone-900 focus:border-blue-300 focus:outline-none"
          />
          {juma2 ? (
            <button
              type="button"
              onClick={() => setJuma2("")}
              className="text-left text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              Clear Juma 2
            </button>
          ) : null}
        </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goToPreviousStep}
              className="hidden min-h-11 rounded-full border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 sm:inline-flex"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (!hasAnyPrayerValue) {
                  setError("Add at least one prayer or Juma timing before continuing.");
                  return;
                }
                goToNextStep();
              }}
              className="hidden min-h-11 rounded-full bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-5 text-sm font-semibold text-white transition hover:brightness-[0.98] sm:inline-flex"
            >
              Continue to details
            </button>
          </div>
        </>
      ) : null}

      {activeStep === 3 ? (
        <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <label className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Remarks</span>
          <textarea
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="Second jamaat available, women section available, limited parking..."
            rows={5}
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-stone-900 focus:border-blue-300 focus:outline-none"
          />
        </label>

        <div className="space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:p-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Images</span>
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
              dragActive ? "border-blue-300 bg-blue-50" : "border-stone-300 bg-white"
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
              className="block min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-3 text-sm text-stone-700 focus:border-blue-300 focus:outline-none"
            />
            <p className="mt-2 text-xs leading-5 text-stone-500">
              Drag and drop or choose files. Up to 5 images, 5 MB each, 20 MB total.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs text-stone-600">
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
                <div className="space-y-2 rounded-lg border border-stone-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Existing images ({mosque.images.length})
                </p>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">
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
      ) : null}

      {activeStep === 3 ? (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Review before publish</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {reviewItems.length > 0 ? (
              reviewItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-800"
                >
                  {item}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
                No field changes detected
              </span>
            )}
          </div>
        </div>
      ) : null}

      {activeStep === 3 ? (
        <div className="mt-6 rounded-xl border border-stone-200 bg-stone-900 p-5 text-stone-50">
        <p className="text-xs uppercase tracking-[0.14em] text-stone-300">Preview</p>
        <p className="mt-2 text-lg font-semibold">
          Next displayed Jummah: {juma1 ? formatDisplayTime(juma1) : "--"}
          {juma2 ? ` and ${formatDisplayTime(juma2)}` : ""}
        </p>
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p>{message}</p>
          <p className="mt-1 text-xs text-emerald-700">
            Success. This tab will close automatically in a few seconds.
          </p>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {isSaving && uploadStatus ? (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {uploadStatus}
        </div>
      ) : null}

      {activeStep === 3 ? (
        <div className="mt-6 hidden flex-wrap gap-2 sm:flex">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="min-h-11 rounded-xl border border-stone-300 bg-stone-50 px-5 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-6 text-base font-semibold text-white transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? uploadStatus || "Updating..." : "Publish update"}
          </button>
        </div>
      ) : null}

      <div className="fixed inset-x-3 bottom-3 z-20 rounded-xl border border-stone-200 bg-white/95 p-2 shadow-lg backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={goToPreviousStep}
              className="min-h-10 rounded-lg border border-stone-300 bg-stone-50 px-3 text-sm font-semibold text-stone-700"
            >
              Back
            </button>
          ) : null}

          {activeStep === 1 ? (
            <>
              <button
                type="button"
                onClick={() => moveToStep(2)}
                className="min-h-10 rounded-lg border border-stone-300 bg-stone-50 px-3 text-xs font-semibold text-stone-700"
              >
                Skip scan
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                className="min-h-10 flex-1 rounded-lg bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white"
              >
                Next: Verify timings
              </button>
            </>
          ) : null}

          {activeStep === 2 ? (
            <button
              type="button"
              onClick={() => {
                if (!hasAnyPrayerValue) {
                  setError("Add at least one prayer or Juma timing before continuing.");
                  return;
                }
                goToNextStep();
              }}
              className="min-h-10 flex-1 rounded-lg bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white"
            >
              Continue
            </button>
          ) : null}

          {activeStep === 3 ? (
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-10 flex-1 rounded-lg bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? uploadStatus || "Updating..." : "Publish"}
            </button>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function getUpdateDraftStorageKey(qrToken: string, placeId?: string) {
  return `namaz-route-update-draft:${qrToken}:${placeId || "no-place"}`;
}

function readUpdateDraft(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as UpdateDraft;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function buildReviewItems(input: {
  prayers: PrayerTimes;
  baselinePrayers: PrayerTimes;
  juma1: string;
  baselineJuma1: string;
  juma2: string;
  baselineJuma2: string;
  remarks: string;
  baselineRemarks: string;
  newImagesCount: number;
}) {
  const items: string[] = [];

  for (const prayer of Object.keys(input.prayers) as Array<keyof PrayerTimes>) {
    if ((input.prayers[prayer] || "") !== (input.baselinePrayers[prayer] || "")) {
      items.push(`${capitalize(prayer)} changed`);
    }
  }

  if (input.juma1 !== input.baselineJuma1) {
    items.push("Juma 1 changed");
  }

  if (input.juma2 !== input.baselineJuma2) {
    items.push("Juma 2 changed");
  }

  if (input.remarks.trim() !== input.baselineRemarks.trim()) {
    items.push("Remarks updated");
  }

  if (input.newImagesCount > 0) {
    items.push(`${input.newImagesCount} new image${input.newImagesCount === 1 ? "" : "s"}`);
  }

  return items;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
