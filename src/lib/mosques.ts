// ...existing code...
// Add a helper to get Jummah landing data for a location
import { demoMosques } from "./demo-data";

export async function getJummahLandingData(location: string) {
  // For demo: match city/locality from slug
  const all = demoMosques;
  const loc = location.toLowerCase();
  const masjids = all.filter((m) =>
    m.city?.toLowerCase() === loc ||
    m.locality?.toLowerCase() === loc ||
    `${m.city?.toLowerCase()}/${m.locality?.toLowerCase()}` === loc
  );
  if (!masjids.length) return null;
  const formatLastUpdated = (iso: string | undefined) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };
  return {
    displayName: location.split("/").map((s) => s[0]?.toUpperCase() + s.slice(1)).join(", "),
    lastUpdatedDisplay: formatLastUpdated(masjids[0]?.lastUpdated),
    masjids: masjids.map((m) => ({
      id: m.id,
      name: m.name,
      address: m.address,
      qrToken: m.qrToken,
      latitude: m.latitude,
      longitude: m.longitude,
      placeId: m.placeId ?? null,
      jummah: m.juma1 || null,
      lastUpdatedDisplay: formatLastUpdated(m.lastUpdated),
    })),
  };
}
import { haversineDistanceKm } from "@/lib/geo";
import {
  getNextJamaat,
  getUpdatedAgo,
  hasCompleteJamaatData,
  isVerified,
} from "@/lib/jamaat";
import {
  createSupabaseReadClient,
  createSupabaseServiceClient,
  getStorageBucket,
  hasSupabaseReadConfig,
  hasSupabaseWriteConfig,
} from "@/lib/supabase";
import type {
  GoogleDiscoveredMosque,
  MosqueImage,
  MosqueRecord,
  MosqueView,
  UpdateMosquePayload,
} from "@/types/mosque";

interface MosqueRow {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  place_id: string | null;
  address: string;
  qr_token: string;
  fajr: string | null;
  zuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
  juma1: string | null;
  juma2: string | null;
  remarks: string | null;
  last_updated: string;
  is_verified: boolean;
}

interface MosqueImageRow {
  id: string;
  mosque_id: string;
  image_url: string;
  type: string;
}

interface DemoUpdateLog {
  mosqueId: string;
  deviceId: string;
  updatedAt: string;
}

const demoOverrides = new Map<string, Partial<MosqueRecord>>();
const demoUpdateLogs: DemoUpdateLog[] = [];
const demoGeneratedMosques = new Map<string, MosqueRecord>();

export async function listMosqueRecords() {
  return hasSupabaseReadConfig() ? listSupabaseMosques() : listDemoMosques();
}

export async function listMosques(options?: {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}) {
  const mosques = await listMosqueRecords();

// (removed duplicate import)
  const decorated = mosques.map((mosque) => decorateMosque(mosque, options));
  return decorated
    .filter((mosque) => {
      if (
        typeof options?.latitude !== "number" ||
        typeof options?.longitude !== "number" ||
        typeof options?.radiusKm !== "number"
      ) {
        return true;
      }

      return (mosque.distanceKm ?? Number.POSITIVE_INFINITY) <= options.radiusKm;
    })
    .sort((first, second) => {
      // 1. Soonest upcoming jamaat first (Missed / no data go to bottom)
      const firstMinutes =
        first.nextJamaat && first.nextJamaat.status !== "Missed"
          ? first.nextJamaat.minutesLeft
          : Number.POSITIVE_INFINITY;
      const secondMinutes =
        second.nextJamaat && second.nextJamaat.status !== "Missed"
          ? second.nextJamaat.minutesLeft
          : Number.POSITIVE_INFINITY;
      if (firstMinutes !== secondMinutes) return firstMinutes - secondMinutes;

      // 2. Distance
      const firstDistance = first.distanceKm ?? Number.POSITIVE_INFINITY;
      const secondDistance = second.distanceKm ?? Number.POSITIVE_INFINITY;
      if (firstDistance !== secondDistance) return firstDistance - secondDistance;

      // 3. Verified first
      if (first.isVerified !== second.isVerified) return first.isVerified ? -1 : 1;

      return 0;
    });
}

export async function getMosqueByQrToken(qrToken: string) {
  const mosque = (await listMosqueRecords()).find((entry) => entry.qrToken === qrToken);
  return mosque ? decorateMosque(mosque) : null;
}

export function findExistingMosqueByPlace(
  place: Pick<GoogleDiscoveredMosque, "placeId" | "latitude" | "longitude">,
  mosques: MosqueRecord[],
) {
  const byPlaceId = mosques.find(
    (mosque) => mosque.placeId && mosque.placeId === place.placeId,
  );
  if (byPlaceId) {
    return byPlaceId;
  }

  return mosques.find((mosque) =>
    haversineDistanceKm(
      { latitude: mosque.latitude, longitude: mosque.longitude },
      { latitude: place.latitude, longitude: place.longitude },
    ) <= 0.15,
  );
}

export async function createMosqueFromDiscoveredPlace(place: GoogleDiscoveredMosque) {
  if (!hasSupabaseWriteConfig()) {
    return {
      error:
        "Supabase write configuration is required to add new mosque timings. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
      status: 400 as const,
    };
  }

  return createSupabaseMosqueFromPlace(place);
}

export async function updateMosqueByQrToken(
  qrToken: string,
  payload: UpdateMosquePayload,
  files: File[],
) {
  if (hasSupabaseWriteConfig()) {
    return updateSupabaseMosque(qrToken, payload, files);
  }

  return updateDemoMosque(qrToken, payload, files);
}

function decorateMosque(
  mosque: MosqueRecord,
  options?: { latitude?: number; longitude?: number },
): MosqueView {
  const distanceKm =
    typeof options?.latitude === "number" && typeof options?.longitude === "number"
      ? haversineDistanceKm(
          { latitude: options.latitude, longitude: options.longitude },
          { latitude: mosque.latitude, longitude: mosque.longitude },
        )
      : undefined;

  const hasJamaatData = hasCompleteJamaatData(mosque.prayers) && Boolean(mosque.juma1);

  return {
    ...mosque,
    isVerified: mosque.isVerified || isVerified(mosque.lastUpdated),
    distanceKm,
    hasJamaatData,
    nextJamaat: hasJamaatData ? getNextJamaat(mosque.prayers) : null,
    updatedAgo: getUpdatedAgo(mosque.lastUpdated),
  };
}

async function listSupabaseMosques() {
  const supabase = createSupabaseReadClient();
  if (!supabase) {
    return listDemoMosques();
  }

  const mosqueRowsResult = await supabase.from("mosques").select("*").limit(250);

  if (mosqueRowsResult.error || !mosqueRowsResult.data) {
    return listDemoMosques();
  }

  const mosqueRows = mosqueRowsResult.data as MosqueRow[];
  const mosqueIds = mosqueRows.map((entry) => entry.id);
  let imageRows: MosqueImageRow[] = [];

  if (mosqueIds.length > 0) {
    const imagesResult = await supabase
      .from("mosque_images")
      .select("*")
      .in("mosque_id", mosqueIds);

    if (!imagesResult.error && imagesResult.data) {
      imageRows = imagesResult.data as MosqueImageRow[];
    }
  }

  return mosqueRows.map((row) => mapMosqueRow(row, imageRows));
}

function listDemoMosques() {
  const baseMosques = [...demoMosques, ...demoGeneratedMosques.values()];

  return baseMosques.map((mosque) => {
    const override = demoOverrides.get(mosque.id);
    if (!override) {
      return mosque;
    }

    return {
      ...mosque,
      ...override,
      prayers: override.prayers ? { ...mosque.prayers, ...override.prayers } : mosque.prayers,
      images: override.images ?? mosque.images,
    };
  });
}

async function createSupabaseMosqueFromPlace(place: GoogleDiscoveredMosque) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return createDemoMosqueFromPlace(place);
  }

  const existingByPlace = await supabase
    .from("mosques")
    .select("id")
    .eq("place_id", place.placeId)
    .maybeSingle();

  if (!existingByPlace.error && existingByPlace.data?.id) {
    const mosque = await getMosqueById(existingByPlace.data.id, supabase);
    return { mosque: mosque ? decorateMosque(mosque) : null, status: 200 as const };
  }

  const allMosques = await listSupabaseMosques();
  const existingByLocation = findExistingMosqueByPlace(place, allMosques);
  if (existingByLocation) {
    if (!existingByLocation.placeId) {
      await supabase
        .from("mosques")
        .update({ place_id: place.placeId })
        .eq("id", existingByLocation.id);
    }

    return { mosque: decorateMosque(existingByLocation), status: 200 as const };
  }

  const qrToken = generateQrToken(place.name);
  const insertResult = await supabase
    .from("mosques")
    .insert({
      place_id: place.placeId,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
      qr_token: qrToken,
      fajr: null,
      zuhr: null,
      asr: null,
      maghrib: null,
      isha: null,
      juma1: null,
      juma2: null,
      remarks: null,
      last_updated: new Date().toISOString(),
      is_verified: false,
    })
    .select("id")
    .single();

  if (insertResult.error || !insertResult.data?.id) {
    return { error: insertResult.error?.message || "Unable to create mosque.", status: 500 as const };
  }

  const created = await getMosqueById(insertResult.data.id as string, supabase);
  return { mosque: created ? decorateMosque(created) : null, status: 200 as const };
}

function createDemoMosqueFromPlace(place: GoogleDiscoveredMosque) {
  const existing = [...demoGeneratedMosques.values(), ...demoMosques].find(
    (mosque) =>
      mosque.placeId === place.placeId ||
      haversineDistanceKm(
        { latitude: mosque.latitude, longitude: mosque.longitude },
        { latitude: place.latitude, longitude: place.longitude },
      ) <= 0.15,
  );

  if (existing) {
    return { mosque: decorateMosque(existing), status: 200 as const };
  }

  const id = `generated-${place.placeId}`;
  const created: MosqueRecord = {
    id,
    name: place.name,
    latitude: place.latitude,
    longitude: place.longitude,
    placeId: place.placeId,
    address: place.address,
    qrToken: generateQrToken(place.name),
    prayers: {
      fajr: null,
      zuhr: null,
      asr: null,
      maghrib: null,
      isha: null,
    },
    juma1: null,
    juma2: null,
    remarks: null,
    lastUpdated: new Date().toISOString(),
    isVerified: false,
    images: [],
  };

  demoGeneratedMosques.set(id, created);
  return { mosque: decorateMosque(created), status: 200 as const };
}

async function updateSupabaseMosque(
  qrToken: string,
  payload: UpdateMosquePayload,
  files: File[],
) {
  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return updateDemoMosque(qrToken, payload, files);
  }

  const mosqueResult = await supabase
    .from("mosques")
    .select("id")
    .eq("qr_token", qrToken)
    .maybeSingle();

  if (mosqueResult.error || !mosqueResult.data) {
    return { error: "Mosque not found.", status: 404 as const };
  }

  const mosqueId = mosqueResult.data.id as string;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const rateLimitResult = await supabase
    .from("updates_log")
    .select("id", { count: "exact", head: true })
    .eq("mosque_id", mosqueId)
    .eq("device_id", payload.deviceId)
    .gte("updated_at", startOfDay.toISOString());

  if ((rateLimitResult.count ?? 0) >= 3) {
    return { error: "Daily update limit reached for this device.", status: 429 as const };
  }

  const lastUpdated = new Date().toISOString();
  const updateResult = await supabase
    .from("mosques")
    .update({
      fajr: payload.prayers.fajr,
      zuhr: payload.prayers.zuhr,
      asr: payload.prayers.asr,
      maghrib: payload.prayers.maghrib,
      isha: payload.prayers.isha,
      juma1: payload.juma1,
      juma2: payload.juma2 || null,
      remarks: payload.remarks || null,
      last_updated: lastUpdated,
      is_verified: true,
    })
    .eq("id", mosqueId);

  if (updateResult.error) {
    return { error: updateResult.error.message, status: 500 as const };
  }

  const uploadedImages: MosqueImage[] = [];
  const uploadErrors: string[] = [];
  if (files.length > 0) {
    const bucket = getStorageBucket();

    for (const file of files.slice(0, 5)) {
      try {
        const preparedUpload = await prepareImageForUpload(file);
        const safeName = preparedUpload.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const filePath = `${mosqueId}/${Date.now()}-${safeName}`;
        
        const uploadResult = await supabase.storage
          .from(bucket)
          .upload(filePath, preparedUpload.data, {
            contentType: preparedUpload.contentType,
            upsert: false,
          });

        if (uploadResult.error) {
          console.error(`Image upload failed for ${file.name}:`, uploadResult.error);
          uploadErrors.push(`Failed to upload ${preparedUpload.fileName}`);
          continue;
        }

        const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
        const imageInsert = await supabase.from("mosque_images").insert({
          mosque_id: mosqueId,
          image_url: publicUrl,
          type: "general",
        }).select("*").single();

        if (!imageInsert.error && imageInsert.data) {
          const row = imageInsert.data as MosqueImageRow;
          uploadedImages.push({
            id: row.id,
            mosqueId: row.mosque_id,
            imageUrl: row.image_url,
            type: row.type,
          });
        } else {
          console.error(`Image database insert failed for ${file.name}:`, imageInsert.error);
          uploadErrors.push(`Failed to save ${preparedUpload.fileName} to database`);
        }
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        uploadErrors.push(`Error processing ${file.name}`);
      }
    }
  }

  await supabase.from("updates_log").insert({
    mosque_id: mosqueId,
    device_id: payload.deviceId,
    updated_at: lastUpdated,
  });

  const updatedMosque = await getMosqueByQrToken(qrToken);

  return {
    mosque: updatedMosque,
    persistence: "supabase" as const,
    uploadedImages,
    status: 200 as const,
    ...(uploadErrors.length > 0 && { 
      warning: `Uploaded ${uploadedImages.length} of ${files.length} images. ${uploadErrors.join("; ")}`
    }),
  };
}

async function prepareImageForUpload(file: File) {
  if (isHeicLikeFile(file)) {
    const converted = await convertHeicToJpeg(file);
    if (converted) {
      return converted;
    }
  }

  return {
    data: file,
    contentType: inferUploadContentType(file),
    fileName: file.name,
  };
}

async function convertHeicToJpeg(file: File) {
  try {
    const heicConvertModule = await import("heic-convert");
    const heicConvert = heicConvertModule.default;
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    const converted = await heicConvert({
      buffer: inputBuffer,
      format: "JPEG",
      quality: 0.9,
    });

    // Handle different return types from heic-convert
    let bytes: Uint8Array;
    if (converted instanceof Uint8Array) {
      bytes = converted;
    } else if (converted instanceof ArrayBuffer) {
      bytes = new Uint8Array(converted);
    } else if (Buffer.isBuffer(converted)) {
      bytes = new Uint8Array(converted);
    } else {
      console.error("Unexpected heic-convert output type:", typeof converted);
      return null;
    }

    const nameWithoutExtension = file.name.replace(/\.(heic|heif)$/i, "") || "image";

    return {
      data: bytes,
      contentType: "image/jpeg",
      fileName: `${nameWithoutExtension}.jpg`,
    };
  } catch (error) {
    console.error("HEIC conversion failed; falling back to original upload.", error);
    return null;
  }
}

function isHeicLikeFile(file: File) {
  if (file.type === "image/heic" || file.type === "image/heif") {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".heic") || lowerName.endsWith(".heif");
}

function inferUploadContentType(file: File) {
  if (file.type) {
    return file.type;
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  if (lowerName.endsWith(".png")) {
    return "image/png";
  }

  if (lowerName.endsWith(".webp")) {
    return "image/webp";
  }

  if (lowerName.endsWith(".gif")) {
    return "image/gif";
  }

  if (lowerName.endsWith(".bmp")) {
    return "image/bmp";
  }

  if (lowerName.endsWith(".tif") || lowerName.endsWith(".tiff")) {
    return "image/tiff";
  }

  if (lowerName.endsWith(".heic")) {
    return "image/heic";
  }

  if (lowerName.endsWith(".heif")) {
    return "image/heif";
  }

  if (lowerName.endsWith(".avif")) {
    return "image/avif";
  }

  return "application/octet-stream";
}

function updateDemoMosque(qrToken: string, payload: UpdateMosquePayload, files: File[]) {
  const mosque = listDemoMosques().find((entry) => entry.qrToken === qrToken);
  if (!mosque) {
    return { error: "Mosque not found.", status: 404 as const };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const updatesToday = demoUpdateLogs.filter(
    (entry) =>
      entry.mosqueId === mosque.id &&
      entry.deviceId === payload.deviceId &&
      new Date(entry.updatedAt).getTime() >= startOfDay.getTime(),
  );

  if (updatesToday.length >= 3) {
    return { error: "Daily update limit reached for this device.", status: 429 as const };
  }

  demoOverrides.set(mosque.id, {
    prayers: payload.prayers,
    juma1: payload.juma1,
    juma2: payload.juma2 || null,
    remarks: payload.remarks || null,
    lastUpdated: new Date().toISOString(),
    isVerified: true,
  });

  demoUpdateLogs.push({
    mosqueId: mosque.id,
    deviceId: payload.deviceId,
    updatedAt: new Date().toISOString(),
  });

  return {
    mosque: decorateMosque({
      ...mosque,
      prayers: payload.prayers,
      juma1: payload.juma1,
      juma2: payload.juma2 || null,
      remarks: payload.remarks || null,
      lastUpdated: new Date().toISOString(),
      isVerified: true,
    }),
    persistence: "demo" as const,
    uploadedImages: [],
    warning:
      files.length > 0
        ? "Image uploads require Supabase storage configuration. Timings still updated in demo mode."
        : undefined,
    status: 200 as const,
  };
}

function mapMosqueRow(row: MosqueRow, imageRows: MosqueImageRow[]): MosqueRecord {
  return {
    id: row.id,
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    placeId: row.place_id,
    address: row.address,
    qrToken: row.qr_token,
    prayers: {
      fajr: row.fajr,
      zuhr: row.zuhr,
      asr: row.asr,
      maghrib: row.maghrib,
      isha: row.isha,
    },
    juma1: row.juma1,
    juma2: row.juma2,
    remarks: row.remarks,
    lastUpdated: row.last_updated,
    isVerified: row.is_verified,
    images: imageRows
      .filter((image) => image.mosque_id === row.id)
      .map((image) => ({
        id: image.id,
        mosqueId: image.mosque_id,
        imageUrl: image.image_url,
        type: image.type,
      })),
  };
}

async function getMosqueById(
  mosqueId: string,
  supabase = createSupabaseServiceClient(),
) {
  if (!supabase) {
    return listDemoMosques().find((mosque) => mosque.id === mosqueId) || null;
  }

  const mosqueResult = await supabase.from("mosques").select("*").eq("id", mosqueId).maybeSingle();
  if (mosqueResult.error || !mosqueResult.data) {
    return null;
  }

  const imageResult = await supabase.from("mosque_images").select("*").eq("mosque_id", mosqueId);
  const imageRows = (imageResult.data || []) as MosqueImageRow[];

  return mapMosqueRow(mosqueResult.data as MosqueRow, imageRows);
}

function generateQrToken(name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);

  return `${slug || "mosque"}-${Math.random().toString(36).slice(2, 8)}`;
}
