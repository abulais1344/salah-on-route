"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { ExtractedPrayerTimes } from "@/lib/extract-prayer-times";

interface TimetableUploadProps {
  onApply: (values: ExtractedPrayerTimes) => void;
}

interface OcrResponse {
  error?: string;
  warning?: string | null;
  errorCode?: string;
  rawText?: string;
  extracted?: ExtractedPrayerTimes;
  hasAnyExtractedValue?: boolean;
  timetableImageUrl?: string | null;
}

type OcrStep = "idle" | "preparing" | "reading" | "matching" | "done";

interface StoredOcrDraft {
  editableTimes: ExtractedPrayerTimes;
  detectedTimes: ExtractedPrayerTimes;
  rawText: string;
  imagePreviewDataUrl: string | null;
  fileName: string | null;
  message: string | null;
  optimizationInfo: string | null;
  ocrStep: OcrStep;
}

const EMPTY_EXTRACTED: ExtractedPrayerTimes = {
  fajr: null,
  zuhr: null,
  asr: null,
  maghrib: null,
  isha: null,
  jumma: null,
};

export function TimetableUpload({ onApply }: TimetableUploadProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [storedPreviewDataUrl, setStoredPreviewDataUrl] = useState<string | null>(
    () => readStoredOcrDraft()?.imagePreviewDataUrl || null,
  );
  const [selectedFileName, setSelectedFileName] = useState<string | null>(
    () => readStoredOcrDraft()?.fileName || null,
  );
  const [editableTimes, setEditableTimes] = useState<ExtractedPrayerTimes>(
    () => readStoredOcrDraft()?.editableTimes || EMPTY_EXTRACTED,
  );
  const [detectedTimes, setDetectedTimes] = useState<ExtractedPrayerTimes>(
    () => readStoredOcrDraft()?.detectedTimes || EMPTY_EXTRACTED,
  );
  const [rawText, setRawText] = useState(() => readStoredOcrDraft()?.rawText || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(
    () => readStoredOcrDraft()?.message || null,
  );
  const [optimizationInfo, setOptimizationInfo] = useState<string | null>(
    () => readStoredOcrDraft()?.optimizationInfo || null,
  );
  const [ocrStep, setOcrStep] = useState<OcrStep>(() => readStoredOcrDraft()?.ocrStep || "idle");
  const [hasVerifiedDetectedData, setHasVerifiedDetectedData] = useState(false);
  const hasDetectedValues = Object.values(detectedTimes).some(Boolean);

  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return storedPreviewDataUrl;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile, storedPreviewDataUrl]);

  useEffect(() => {
    return () => {
      if (selectedFile && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, selectedFile]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasStateToPersist =
      Boolean(selectedFile) ||
      Boolean(storedPreviewDataUrl) ||
      Boolean(selectedFileName) ||
      Boolean(rawText) ||
      Boolean(message) ||
      Boolean(optimizationInfo) ||
      Object.values(editableTimes).some(Boolean) ||
      Object.values(detectedTimes).some(Boolean);

    const storageKey = getOcrDraftStorageKey();
    if (!hasStateToPersist) {
      window.sessionStorage.removeItem(storageKey);
      return;
    }

    const draft: StoredOcrDraft = {
      editableTimes,
      detectedTimes,
      rawText,
      imagePreviewDataUrl: storedPreviewDataUrl,
      fileName: selectedFile?.name || selectedFileName,
      message,
      optimizationInfo,
      ocrStep,
    };

    window.sessionStorage.setItem(storageKey, JSON.stringify(draft));
  }, [
    detectedTimes,
    editableTimes,
    message,
    ocrStep,
    optimizationInfo,
    rawText,
    selectedFile,
    selectedFileName,
    storedPreviewDataUrl,
  ]);

  function updateTime(field: keyof ExtractedPrayerTimes, value: string) {
    setEditableTimes((current) => ({
      ...current,
      [field]: value || null,
    }));
    setHasVerifiedDetectedData(false);
  }

  async function handleFileSelect(file: File | null) {
    setSelectedFile(file);
    setSelectedFileName(file?.name || null);
    setStoredPreviewDataUrl(file ? await buildStoredPreviewDataUrl(file) : null);
    setError(null);
    setMessage(null);
    setOptimizationInfo(null);
    setOcrStep("idle");
    setHasVerifiedDetectedData(false);
  }

  async function runOcr() {
    if (!selectedFile) {
      setError("Choose a timetable image first.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setMessage(null);
    setOptimizationInfo(null);
    setOcrStep("preparing");

    try {
      const optimizedImage = await compressImageForUpload(selectedFile);
      setOcrStep("reading");

      if (optimizedImage !== selectedFile) {
        const beforeKb = Math.round(selectedFile.size / 1024);
        const afterKb = Math.round(optimizedImage.size / 1024);
        setOptimizationInfo(`Image optimized for faster upload (${beforeKb} KB -> ${afterKb} KB).`);
      }

      const formData = new FormData();
      formData.set("image", optimizedImage);

      const response = await fetchWithTimeout("/api/ocr/timetable", {
        method: "POST",
        body: formData,
      }, 35000);

      setOcrStep("matching");

      const payload = (await safeParseOcrResponse(response)) as OcrResponse;
      if (!response.ok) {
        throw new Error(resolveOcrError(payload, response.status));
      }

      const extracted = payload.extracted || EMPTY_EXTRACTED;
      setEditableTimes(extracted);
      setDetectedTimes(extracted);
      setRawText(payload.rawText || "");
      setOcrStep("done");
      setHasVerifiedDetectedData(false);

      if (payload.hasAnyExtractedValue) {
        setMessage("Done. Review each detected timing, correct anything needed, then verify before applying.");
      } else {
        setMessage("OCR could not detect all timings. You can continue in manual mode.");
      }

      if (payload.warning) {
        setError(payload.warning);
      }
    } catch (ocrError) {
      setOcrStep("idle");
      setError(
        ocrError instanceof Error
          ? ocrError.message
          : "Could not read this image. Choose another image or continue manually.",
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function applyToUpdateForm() {
    if (hasDetectedValues && !hasVerifiedDetectedData) {
      setError("Review detected timings and confirm they are correct before applying them.");
      return;
    }

    onApply(editableTimes);
    setMessage("Timings applied to the form below. You can still edit before submit.");
  }

  function clearDetectedValues() {
    setEditableTimes(EMPTY_EXTRACTED);
    setDetectedTimes(EMPTY_EXTRACTED);
    setRawText("");
    setSelectedFile(null);
    setSelectedFileName(null);
    setStoredPreviewDataUrl(null);
    setError(null);
    setMessage("Detected values cleared. You can fill timings manually.");
    setOptimizationInfo(null);
    setOcrStep("idle");
    setHasVerifiedDetectedData(false);
  }

  return (
    <section className="rounded-[22px] border border-stone-200 bg-stone-50 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
            Upload timetable photo
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Step 1 add photo, step 2 review timings, step 3 apply. Manual edit always available.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { step: "1", label: "Add photo", active: ocrStep !== "idle" || Boolean(selectedFile) },
          { step: "2", label: "Review", active: ocrStep === "matching" || ocrStep === "done" },
          { step: "3", label: "Apply", active: ocrStep === "done" },
        ].map(({ step, label, active }) => (
          <span
            key={step}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              active
                ? "border-orange-300 bg-orange-100 text-orange-800"
                : "border-stone-300 bg-white text-stone-600"
            }`}
          >
            {step}. {label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="min-h-11 rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              Upload image
            </button>
            <button
              type="button"
              onClick={() => captureInputRef.current?.click()}
              className="min-h-11 rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              Capture image
            </button>
          </div>

          <input
            ref={uploadInputRef}
            type="file"
            accept="image/*,.heic,.heif"
            hidden
            onChange={(event) => {
              void handleFileSelect(event.target.files?.[0] || null);
              event.target.value = "";
            }}
          />

          <input
            ref={captureInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={(event) => {
              void handleFileSelect(event.target.files?.[0] || null);
              event.target.value = "";
            }}
          />

          <div className="rounded-[14px] border border-stone-200 bg-white px-3 py-2 text-xs text-stone-600">
            {selectedFile ? (
              <p className="font-semibold text-stone-800">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            ) : selectedFileName ? (
              <p className="font-semibold text-stone-800">Restored: {selectedFileName}</p>
            ) : (
              <p>No image selected yet.</p>
            )}
            <p className="mt-1">Tip: keep photo straight, avoid glare, include full timetable.</p>
          </div>

          {previewUrl ? (
            <div className="overflow-hidden rounded-[16px] border border-stone-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Selected timetable" className="h-auto w-full object-cover" />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void runOcr()}
            disabled={!selectedFile || isProcessing}
            className="min-h-12 w-full rounded-full bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isProcessing
              ? ocrStep === "preparing"
                ? "Preparing image..."
                : ocrStep === "matching"
                  ? "Matching prayer names..."
                  : "Reading timetable..."
              : "Read timetable"}
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void runOcr()}
              disabled={!selectedFile || isProcessing}
              className="min-h-10 rounded-full border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Retry OCR
            </button>
            <button
              type="button"
              onClick={clearDetectedValues}
              className="min-h-10 rounded-full border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              Clear detected values
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-[18px] border border-stone-200 bg-white p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(
              [
                ["fajr", "Fajr"],
                ["zuhr", "Zuhr"],
                ["asr", "Asr"],
                ["maghrib", "Maghrib"],
                ["isha", "Isha"],
                ["jumma", "Jumma"],
              ] as const
            ).map(([field, label]) => (
              <label
                key={field}
                className={`space-y-1 rounded-[14px] p-2 text-xs text-stone-600 ${
                  detectedTimes[field]
                    ? `bg-emerald-50 ring-1 ring-emerald-200 ${
                        ocrStep === "done"
                          ? "motion-safe:animate-[ocr-detected-pop_680ms_ease-out]"
                          : ""
                      }`
                    : ""
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold uppercase tracking-[0.14em] text-stone-500">{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getFieldStatusStyle(
                      field,
                      editableTimes,
                      detectedTimes,
                    )}`}
                  >
                    {getFieldStatusLabel(field, editableTimes, detectedTimes)}
                  </span>
                </span>
                <input
                  type="time"
                  value={editableTimes[field] || ""}
                  onChange={(event) => updateTime(field, event.target.value)}
                  className={`min-h-11 w-full rounded-[12px] px-2.5 text-sm text-stone-900 focus:border-orange-400 focus:outline-none ${
                    detectedTimes[field]
                      ? "border border-emerald-300 bg-white"
                      : "border border-stone-300 bg-stone-50"
                  }`}
                />
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={applyToUpdateForm}
            disabled={hasDetectedValues && !hasVerifiedDetectedData}
            className="min-h-11 w-full rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Apply to update form
          </button>

          {hasDetectedValues ? (
            <label className="flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <input
                type="checkbox"
                checked={hasVerifiedDetectedData}
                onChange={(event) => {
                  setHasVerifiedDetectedData(event.target.checked);
                  if (event.target.checked) {
                    setError(null);
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-orange-600 focus:ring-orange-500"
              />
              <span>
                I reviewed the OCR timings against the timetable photo and confirmed they are correct.
              </span>
            </label>
          ) : null}

          {rawText ? (
            <details className="rounded-[12px] border border-stone-200 bg-stone-50 p-2">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                OCR text
              </summary>
              <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-[11px] text-stone-600">
                {rawText}
              </pre>
            </details>
          ) : null}
        </div>
      </div>

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {optimizationInfo ? <p className="mt-2 text-sm text-amber-700">{optimizationInfo}</p> : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      {!isProcessing && !error ? (
        <p className="mt-2 text-xs text-stone-500">
          OCR never updates the main form automatically. If OCR is wrong, edit the timings here or continue manually below. Progress is kept for this tab.
        </p>
      ) : null}
    </section>
  );
}

function getFieldStatusLabel(
  field: keyof ExtractedPrayerTimes,
  editableTimes: ExtractedPrayerTimes,
  detectedTimes: ExtractedPrayerTimes,
) {
  if (detectedTimes[field]) {
    return "Detected";
  }

  if (editableTimes[field]) {
    return "Manual";
  }

  return "Missing";
}

function getFieldStatusStyle(
  field: keyof ExtractedPrayerTimes,
  editableTimes: ExtractedPrayerTimes,
  detectedTimes: ExtractedPrayerTimes,
) {
  if (detectedTimes[field]) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (editableTimes[field]) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-stone-100 text-stone-600";
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function safeParseOcrResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const rawText = await response.text();
  return {
    error: rawText || "Unexpected OCR response from server.",
  };
}

function resolveOcrError(payload: OcrResponse, status: number) {
  if (payload.error) {
    return payload.error;
  }

  if (status === 413) {
    return "Image is too large. Use a smaller photo and try again.";
  }

  if (status === 429) {
    return "Server is busy right now. Please try again in a moment.";
  }

  if (status >= 500) {
    return "OCR service is unavailable right now. Please retry or continue manually.";
  }

  return "Could not process this image. Choose another photo or continue manually.";
}

async function buildStoredPreviewDataUrl(file: File) {
  if (!file.type.startsWith("image/")) {
    return null;
  }

  try {
    const dataUrl = await fileToDataUrl(file);
    const image = await loadImage(dataUrl);
    const maxDimension = 960;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return dataUrl;
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return null;
  }
}

function getOcrDraftStorageKey() {
  return `namaz-route-ocr-draft:${window.location.pathname}:${window.location.search}`;
}

function readStoredOcrDraft() {
  try {
    const stored = window.sessionStorage.getItem(getOcrDraftStorageKey());
    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as StoredOcrDraft;
  } catch {
    window.sessionStorage.removeItem(getOcrDraftStorageKey());
    return null;
  }
}

async function compressImageForUpload(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  if (file.size < 900 * 1024) {
    return file;
  }

  try {
    const imageDataUrl = await fileToDataUrl(file);
    const image = await loadImage(imageDataUrl);

    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }

    context.drawImage(image, 0, 0, width, height);

    const compressedBlob = await canvasToBlob(canvas, "image/jpeg", 0.82);
    if (!compressedBlob) {
      return file;
    }

    if (compressedBlob.size >= file.size * 0.95) {
      return file;
    }

    const compressedName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([compressedBlob], compressedName, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Unable to read selected image."));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("Unable to read selected image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to decode selected image."));
    image.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}
