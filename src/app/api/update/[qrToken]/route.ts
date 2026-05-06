import { getMosqueByQrToken, updateMosqueByQrToken } from "@/lib/mosques";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_REMARKS_LENGTH = 800;
const MAX_DEVICE_ID_LENGTH = 128;
const MAX_FILE_COUNT = 5;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

export async function GET(
  _request: Request,
  context: RouteContext<"/api/update/[qrToken]">,
) {
  const { qrToken } = await context.params;
  const mosque = await getMosqueByQrToken(qrToken);

  if (!mosque) {
    return Response.json({ error: "Mosque not found." }, { status: 404 });
  }

  return Response.json({ mosque });
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/update/[qrToken]">,
) {
  const { qrToken } = await context.params;
  const formData = await request.formData();

  const deviceId = normalizeDeviceId(formData.get("deviceId"));
  const remarks = normalizeRemarks(formData.get("remarks"));
  const prayers = {
    fajr: toNullableTime(formData.get("fajr")),
    zuhr: toNullableTime(formData.get("zuhr")),
    asr: toNullableTime(formData.get("asr")),
    maghrib: toNullableTime(formData.get("maghrib")),
    isha: toNullableTime(formData.get("isha")),
  };
  const juma1 = toNullableTime(formData.get("juma1"));
  const juma2 = toNullableTime(formData.get("juma2"));

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

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, MAX_FILE_COUNT);

  const filesValidationError = validateFiles(files);
  if (filesValidationError) {
    return Response.json({ error: filesValidationError }, { status: 400 });
  }

  const result = await updateMosqueByQrToken(
    qrToken,
    {
      deviceId,
      prayers,
      juma1,
      juma2,
      remarks: remarks || null,
    },
    files,
  );

  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({
    mosque: result.mosque,
    warning: "warning" in result ? result.warning : undefined,
    message:
      result.persistence === "supabase"
        ? "Mosque timings updated successfully."
        : "Mosque timings updated in demo mode.",
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
