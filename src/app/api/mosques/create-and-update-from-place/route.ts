import { createMosqueFromDiscoveredPlace, updateMosqueByQrToken } from "@/lib/mosques";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_REMARKS_LENGTH = 800;
const MAX_DEVICE_ID_LENGTH = 128;
const MAX_FILE_COUNT = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();

  const placeId = String(formData.get("placeId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const address = String(formData.get("address") || "Address unavailable").trim();
  const distanceFromRouteKm = Number(formData.get("distanceFromRouteKm") || 0);

  if (!placeId || !name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return Response.json({ error: "Invalid mosque payload." }, { status: 400 });
  }

  const deviceId = normalizeDeviceId(formData.get("deviceId"));
  const remarks = normalizeRemarks(formData.get("remarks"));
  const rawPrayers = {
    fajr: toNullableTime(formData.get("fajr")),
    zuhr: toNullableTime(formData.get("zuhr")),
    asr: toNullableTime(formData.get("asr")),
    maghrib: toNullableTime(formData.get("maghrib")),
    isha: toNullableTime(formData.get("isha")),
  };
  const rawJuma1 = toNullableTime(formData.get("juma1"));
  const rawJuma2 = toNullableTime(formData.get("juma2"));

  const prayers = {
    fajr: normalizeTimeBySlot(rawPrayers.fajr, "am"),
    zuhr: normalizeTimeBySlot(rawPrayers.zuhr, "pm"),
    asr: normalizeTimeBySlot(rawPrayers.asr, "pm"),
    maghrib: normalizeTimeBySlot(rawPrayers.maghrib, "pm"),
    isha: normalizeTimeBySlot(rawPrayers.isha, "pm"),
  };
  const juma1 = normalizeTimeBySlot(rawJuma1, "pm");
  const juma2 = normalizeTimeBySlot(rawJuma2, "pm");

  if (!deviceId) {
    return Response.json({ error: "Invalid device identifier." }, { status: 400 });
  }

  if (remarks.length > MAX_REMARKS_LENGTH) {
    return Response.json(
      { error: `Remarks must be ${MAX_REMARKS_LENGTH} characters or fewer.` },
      { status: 400 },
    );
  }

  if (juma2 && !juma1) {
    return Response.json({ error: "Set Juma 1 before adding Juma 2." }, { status: 400 });
  }

  const hasAnyTimingDetails =
    Boolean(prayers.fajr) ||
    Boolean(prayers.zuhr) ||
    Boolean(prayers.asr) ||
    Boolean(prayers.maghrib) ||
    Boolean(prayers.isha) ||
    Boolean(juma1) ||
    Boolean(juma2);

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_FILE_COUNT);

  const filesValidationError = validateFiles(files);
  if (filesValidationError) {
    return Response.json({ error: filesValidationError }, { status: 400 });
  }

  if (!hasAnyTimingDetails) {
    return Response.json(
      { error: "Add at least one prayer or Juma timing before submitting." },
      { status: 400 },
    );
  }

  const createResult = await createMosqueFromDiscoveredPlace({
    placeId,
    name,
    latitude,
    longitude,
    address,
    distanceFromRouteKm: Number.isNaN(distanceFromRouteKm) ? 0 : distanceFromRouteKm,
  });

  if ("error" in createResult) {
    return Response.json({ error: createResult.error }, { status: createResult.status });
  }

  if (!createResult.mosque?.qrToken) {
    return Response.json({ error: "Unable to open update flow for mosque." }, { status: 500 });
  }

  const updateResult = await updateMosqueByQrToken(
    createResult.mosque.qrToken,
    {
      deviceId,
      prayers,
      juma1,
      juma2,
      remarks: remarks || null,
    },
    files,
  );

  if ("error" in updateResult) {
    return Response.json({ error: updateResult.error }, { status: updateResult.status });
  }

  return Response.json({
    mosque: updateResult.mosque,
    warning: "warning" in updateResult ? updateResult.warning : undefined,
    message:
      updateResult.persistence === "supabase"
        ? "Mosque timings updated successfully."
        : "Mosque timings updated in demo mode.",
    redirectTo: `/update/${createResult.mosque.qrToken}?edit=1`,
  });
}

function toNullableTime(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }

  if (!TIME_PATTERN.test(text)) {
    return null;
  }

  return text;
}

function normalizeDeviceId(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  if (!text || text.length > MAX_DEVICE_ID_LENGTH) {
    return null;
  }

  return text;
}

function normalizeRemarks(value: FormDataEntryValue | null) {
  return String(value || "").trim();
}

function validateFiles(files: File[]) {
  let totalBytes = 0;

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
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

function normalizeTimeBySlot(value: string | null, slot: "am" | "pm") {
  if (!value) {
    return null;
  }

  const [hoursText] = value.split(":");
  const hours = Number(hoursText);
  if (!Number.isFinite(hours)) {
    return value;
  }

  const minutesText = value.split(":")[1] ?? "00";
  let normalizedHours = hours;

  if (slot === "am" && normalizedHours >= 12) {
    normalizedHours -= 12;
  }

  if (slot === "pm" && normalizedHours < 12) {
    normalizedHours += 12;
  }

  return `${String(normalizedHours).padStart(2, "0")}:${minutesText}`;
}
