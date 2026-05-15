"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PSM, createWorker } from "tesseract.js";

import {
  analyzeExtractedPrayerTimes,
  extractPrayerTimesWithProvenance,
  type ExtractionProvenanceMap,
} from "@/lib/extract-prayer-times";
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
  detectedProvenance?: ExtractionProvenanceMap;
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

const EMPTY_PROVENANCE: ExtractionProvenanceMap = {
  fajr: "missing",
  zuhr: "missing",
  asr: "missing",
  maghrib: "missing",
  isha: "missing",
  jumma: "missing",
};

export function TimetableUpload({ onApply }: TimetableUploadProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const captureInputRef = useRef<HTMLInputElement | null>(null);
  const workerRef = useRef<Promise<Awaited<ReturnType<typeof createWorker>>> | null>(null);
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
  const [detectedProvenance, setDetectedProvenance] = useState<ExtractionProvenanceMap>(
    () => readStoredOcrDraft()?.detectedProvenance || EMPTY_PROVENANCE,
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
  const qualityReport = useMemo(() => analyzeExtractedPrayerTimes(editableTimes), [editableTimes]);

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

      const workerPromise = workerRef.current;
      if (workerPromise) {
        void workerPromise.then((worker) => worker.terminate()).catch(() => undefined);
        workerRef.current = null;
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
      detectedProvenance,
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
    detectedProvenance,
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
      const [ocrImage, optimizedImage] = await Promise.all([
        prepareImageForOcr(selectedFile),
        compressImageForUpload(selectedFile),
      ]);

      if (optimizedImage !== selectedFile) {
        const beforeKb = Math.round(selectedFile.size / 1024);
        const afterKb = Math.round(optimizedImage.size / 1024);
        setOptimizationInfo(`Image optimized for faster upload (${beforeKb} KB -> ${afterKb} KB).`);
      }

      setOcrStep("reading");
      const worker = await getOcrWorker(workerRef);
      const ocrResult = await worker.recognize(ocrImage);

      setOcrStep("matching");
      const rawText = ocrResult.data?.text?.trim() || "";
      const extracted = extractPrayerTimesWithProvenance(rawText);
      setEditableTimes(extracted.times);
      setDetectedTimes(extracted.times);
      setDetectedProvenance(extracted.provenance);
      setRawText(rawText);
      setOcrStep("done");
      setHasVerifiedDetectedData(false);

      const hasAnyExtractedValue = Object.values(extracted.times).some(Boolean);
      if (hasAnyExtractedValue) {
        setMessage("Done. Review each detected timing, correct anything needed, then verify before applying.");
      } else {
        setMessage("Photo scan could not detect all timings. You can continue in manual mode.");
      }

      const uploadWarning = await uploadOptimizedImage(optimizedImage);
      if (uploadWarning) {
        setError(uploadWarning);
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

    if (qualityReport.hasCriticalIssues) {
      setError("Detected timings still have logical conflicts. Please fix highlighted issues first.");
      return;
    }

    onApply(editableTimes);
    setMessage("Timings applied to the form below. You can still edit before submit.");
  }

  function clearDetectedValues() {
    setEditableTimes(EMPTY_EXTRACTED);
    setDetectedTimes(EMPTY_EXTRACTED);
    setDetectedProvenance(EMPTY_PROVENANCE);
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
    <section className="rounded-xl border border-stone-200 bg-white p-3.5 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-blue-700">
            Step 1: Scan timetable photo
          </p>
          <p className="mt-1 text-xs text-stone-600 sm:text-sm">
            Choose image source, run scan, then review timings.
          </p>
        </div>
      </div>

      <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        {ocrStep === "done"
          ? "Scan complete. Review timings below, confirm, then apply."
          : "Pick a photo source first, then tap Read timetable."}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="min-h-11 rounded-xl border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
            >
              Upload image
            </button>
            <button
              type="button"
              onClick={() => captureInputRef.current?.click()}
              className="min-h-11 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
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

          <div className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-[11px] text-stone-600">
            {selectedFile ? (
              <p className="font-semibold text-stone-800">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            ) : selectedFileName ? (
              <p className="font-semibold text-stone-800">Restored: {selectedFileName}</p>
            ) : (
              <p>No image selected yet.</p>
            )}
            <p className="mt-1">Tip: keep photo straight and full-frame.</p>
          </div>

          {previewUrl ? (
            <div className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Selected timetable" className="h-auto w-full object-cover" />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => void runOcr()}
            disabled={!selectedFile || isProcessing}
            className="min-h-11 w-full rounded-lg bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isProcessing
              ? ocrStep === "preparing"
                ? "Preparing image..."
                : ocrStep === "matching"
                  ? "Matching prayer names..."
                  : "Reading timetable..."
              : "Read timetable"}
          </button>

          {ocrStep === "done" ? (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => void runOcr()}
                disabled={!selectedFile || isProcessing}
                className="font-semibold text-blue-700 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Scan again
              </button>
              <button
                type="button"
                onClick={clearDetectedValues}
                className="font-semibold text-stone-600 transition hover:text-stone-800"
              >
                Clear detected values
              </button>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-2.5 sm:p-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-stone-500">
            Step 2: Review timings
          </p>
          <div className="rounded-lg border border-stone-200 bg-white p-2.5 sm:p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Daily prayers
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(
                [
                  ["fajr", "Fajr"],
                  ["zuhr", "Zuhr"],
                  ["asr", "Asr"],
                  ["maghrib", "Maghrib"],
                  ["isha", "Isha"],
                ] as const
              ).map(([field, label]) => (
                <label
                  key={field}
                  className={`space-y-1 rounded-lg border p-1.5 text-xs text-stone-600 ${
                    detectedTimes[field]
                      ? "border-emerald-200 bg-emerald-50/40"
                      : "border-stone-200 bg-stone-50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold uppercase tracking-[0.08em] text-stone-500">{label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getFieldStatusStyle(
                        field,
                        editableTimes,
                        detectedTimes,
                        detectedProvenance,
                      )}`}
                    >
                      {getFieldStatusLabel(field, editableTimes, detectedTimes, detectedProvenance)}
                    </span>
                  </span>
                  <input
                    type="time"
                    value={editableTimes[field] || ""}
                    onChange={(event) => updateTime(field, event.target.value)}
                    className={`min-h-10 w-full rounded-lg px-2 text-sm text-stone-900 focus:border-blue-300 focus:outline-none ${
                      detectedTimes[field]
                        ? "border border-emerald-200 bg-white"
                        : "border border-stone-300 bg-stone-50"
                    }`}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-2.5 sm:p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-500">
              Jummah
            </p>
            <label
              className={`block space-y-1 rounded-lg border p-1.5 text-xs text-stone-600 ${
                detectedTimes.jumma ? "border-emerald-200 bg-emerald-50/40" : "border-stone-200 bg-stone-50"
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold uppercase tracking-[0.08em] text-stone-500">Jumma</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getFieldStatusStyle(
                    "jumma",
                    editableTimes,
                    detectedTimes,
                    detectedProvenance,
                  )}`}
                >
                  {getFieldStatusLabel("jumma", editableTimes, detectedTimes, detectedProvenance)}
                </span>
              </span>
              <input
                type="time"
                value={editableTimes.jumma || ""}
                onChange={(event) => updateTime("jumma", event.target.value)}
                className={`min-h-10 w-full rounded-lg px-2 text-sm text-stone-900 focus:border-blue-300 focus:outline-none ${
                  detectedTimes.jumma
                    ? "border border-emerald-200 bg-white"
                    : "border border-stone-300 bg-stone-50"
                }`}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={applyToUpdateForm}
            disabled={(hasDetectedValues && !hasVerifiedDetectedData) || qualityReport.hasCriticalIssues}
            className="min-h-11 w-full rounded-lg bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            Step 3: Apply to update form
          </button>

          <details className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs">
            <summary className="cursor-pointer font-semibold text-stone-700">
              Scan details ({qualityReport.confidence === "high" ? "High" : qualityReport.confidence === "medium" ? "Medium" : "Low"} confidence)
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Detected</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">Auto-filled</span>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">Auto-corrected</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Manual</span>
            </div>
            {qualityReport.issues.length > 0 ? (
              <div className="mt-1.5 space-y-1">
                {qualityReport.issues.map((issue) => (
                  <p
                    key={issue.code}
                    className={issue.severity === "critical" ? "text-rose-700" : "text-amber-700"}
                  >
                    • {issue.message}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-1.5 text-emerald-700">No logical conflicts detected.</p>
            )}
          </details>

          {hasDetectedValues ? (
            <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
              <input
                type="checkbox"
                checked={hasVerifiedDetectedData}
                onChange={(event) => {
                  setHasVerifiedDetectedData(event.target.checked);
                  if (event.target.checked) {
                    setError(null);
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-amber-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                I checked these timings against the photo.
              </span>
            </label>
          ) : null}

          {rawText ? (
            <details className="rounded-lg border border-stone-200 bg-white p-2">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.1em] text-stone-500">
                Detected text
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
      {!isProcessing && !error ? <p className="mt-2 text-[11px] text-stone-500">Photo scan never auto-publishes. Always verify before submit.</p> : null}
    </section>
  );
}

function getFieldStatusLabel(
  field: keyof ExtractedPrayerTimes,
  editableTimes: ExtractedPrayerTimes,
  detectedTimes: ExtractedPrayerTimes,
  detectedProvenance: ExtractionProvenanceMap,
) {
  if (detectedTimes[field]) {
    const provenance = detectedProvenance[field];
    if (provenance === "corrected") {
      return "Auto-corrected";
    }
    if (provenance === "inferred") {
      return "Auto-filled";
    }
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
  detectedProvenance: ExtractionProvenanceMap,
) {
  if (detectedTimes[field]) {
    const provenance = detectedProvenance[field];
    if (provenance === "corrected") {
      return "border border-violet-200 bg-violet-50 text-violet-700";
    }
    if (provenance === "inferred") {
      return "border border-blue-200 bg-blue-50 text-blue-700";
    }
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (editableTimes[field]) {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border border-stone-200 bg-stone-50 text-stone-600";
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
  if (typeof window === "undefined") {
    return "namaz-route-ocr-draft:ssr";
  }

  return `namaz-route-ocr-draft:${window.location.pathname}:${window.location.search}`;
}

function readStoredOcrDraft() {
  if (typeof window === "undefined") {
    return null;
  }

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

async function uploadOptimizedImage(file: File) {
  try {
    const formData = new FormData();
    formData.set("image", file);

    const response = await fetch("/api/ocr/timetable", {
      method: "POST",
      body: formData,
    });

    const payload = (await safeParseOcrResponse(response)) as OcrResponse;
    if (!response.ok) {
      return payload.error || "Unable to upload timetable image right now. You can still continue manually.";
    }

    return payload.warning || null;
  } catch {
    return "Unable to upload timetable image right now. You can still continue manually.";
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

async function prepareImageForOcr(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const imageDataUrl = await fileToDataUrl(file);
    const image = await loadImage(imageDataUrl);
    const largestSide = Math.max(image.width, image.height);

    let scale = 1;
    if (largestSide < 1400) {
      scale = 1400 / largestSide;
    } else if (largestSide > 2200) {
      scale = 2200 / largestSide;
    }

    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return file;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const pixels = imageData.data;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const luminance = red * 0.299 + green * 0.587 + blue * 0.114;
      const contrasted = clampColor((luminance - 128) * 1.55 + 136);
      const cleaned = contrasted > 244 ? 255 : contrasted < 18 ? 0 : contrasted;

      pixels[index] = cleaned;
      pixels[index + 1] = cleaned;
      pixels[index + 2] = cleaned;
      pixels[index + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
    return canvas;
  } catch {
    return file;
  }
}

function clampColor(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

async function getOcrWorker(
  workerRef: React.MutableRefObject<Promise<Awaited<ReturnType<typeof createWorker>>> | null>,
) {
  if (!workerRef.current) {
    workerRef.current = (async () => {
      const worker = await createWorker("eng", 1, {
        errorHandler: () => undefined,
      });

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        tessedit_char_whitelist:
          "0123456789:.-/()[]ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ",
        preserve_interword_spaces: "1",
        user_defined_dpi: "220",
      });

      return worker;
    })();
  }

  return workerRef.current;
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
