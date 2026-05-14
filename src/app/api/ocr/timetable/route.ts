import { randomUUID } from "crypto";

import { recognize } from "tesseract.js";

import { extractPrayerTimes } from "@/lib/extract-prayer-times";
import { createSupabaseServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const TIMETABLE_STORAGE_BUCKET = "timetables";
const OCR_TIMEOUT_MS = 30000;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File) || image.size <= 0) {
      return Response.json({ error: "Please upload a timetable image." }, { status: 400 });
    }

    const validationError = validateImageFile(image);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const uploadResult = await uploadTimetableImage(image);
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const ocrResult = await withTimeout(recognize(imageBuffer, "eng"), OCR_TIMEOUT_MS);
    const rawText = ocrResult.data?.text?.trim() || "";
    const extracted = extractPrayerTimes(rawText);
    const hasAnyExtractedValue = Object.values(extracted).some(Boolean);

    return Response.json({
      rawText,
      extracted,
      hasAnyExtractedValue,
      timetableImageUrl: uploadResult.publicUrl,
      warning: uploadResult.warning,
    });
  } catch (error) {
    console.error("Timetable OCR failed:", error);

    if (isAbortError(error)) {
      return Response.json(
        {
          error: "OCR timed out. Please retry with a clearer image or fill timings manually.",
          errorCode: "OCR_TIMEOUT",
        },
        { status: 504 },
      );
    }

    return Response.json(
      {
        error: "Unable to process timetable image right now. You can retry or continue manually.",
        errorCode: "OCR_FAILED",
      },
      { status: 500 },
    );
  }
}

function validateImageFile(file: File) {
  if (!isLikelyImageFile(file)) {
    return "Only image uploads are supported for OCR.";
  }

  if (file.size > MAX_FILE_BYTES) {
    return "Image must be 8 MB or smaller.";
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

async function uploadTimetableImage(file: File) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return {
      publicUrl: null,
      warning: "Supabase Storage is not configured. OCR result is available but image was not stored.",
    };
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "timetable.jpg";
    const filePath = `uploads/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;

    const upload = await supabase.storage
      .from(TIMETABLE_STORAGE_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (upload.error) {
      console.error("Timetable storage upload failed:", upload.error);
      return {
        publicUrl: null,
        warning: "Image OCR succeeded but storage upload failed.",
      };
    }

    const publicUrl = supabase.storage
      .from(TIMETABLE_STORAGE_BUCKET)
      .getPublicUrl(filePath).data.publicUrl;

    return {
      publicUrl,
      warning: null,
    };
  } catch (error) {
    console.error("Unexpected timetable upload error:", error);
    return {
      publicUrl: null,
      warning: "Image OCR succeeded but storage upload failed.",
    };
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("OCR_TIMEOUT"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function isAbortError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "AbortError" || error.message === "OCR_TIMEOUT";
}
