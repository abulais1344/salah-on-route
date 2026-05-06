export const DAILY_PRAYERS = [
  "fajr",
  "zuhr",
  "asr",
  "maghrib",
  "isha",
] as const;

export type DailyPrayerName = (typeof DAILY_PRAYERS)[number];

export type JamaatStatus = "Upcoming" | "Hurry" | "Risky" | "Missed";

export interface PrayerTimes {
  fajr: string | null;
  zuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
}

export interface MosqueImage {
  id: string;
  mosqueId: string;
  imageUrl: string;
  type: string;
}

export interface NextJamaatInfo {
  prayer: DailyPrayerName;
  time24h: string;
  displayTime: string;
  relativeText: string;
  urgencyLabel: string;
  minutesLeft: number;
  status: JamaatStatus;
  isTomorrow: boolean;
}

export interface MosqueRecord {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  placeId?: string | null;
  address: string;
  qrToken: string;
  prayers: PrayerTimes;
  juma1: string | null;
  juma2?: string | null;
  remarks?: string | null;
  lastUpdated: string;
  isVerified: boolean;
  images: MosqueImage[];
}

export interface MosqueView extends MosqueRecord {
  distanceKm?: number;
  distanceFromRouteKm?: number;
  hasJamaatData: boolean;
  nextJamaat: NextJamaatInfo | null;
  updatedAgo: string;
}

export interface GoogleDiscoveredMosque {
  placeId: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  distanceFromRouteKm: number;
}

export interface UpdateMosquePayload {
  prayers: PrayerTimes;
  juma1: string | null;
  juma2?: string | null;
  remarks?: string | null;
  deviceId: string;
}
