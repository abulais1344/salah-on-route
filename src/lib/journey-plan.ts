import { formatDisplayTime } from "@/lib/jamaat";
import { haversineDistanceKm, type GeoPoint } from "@/lib/geo";
import { DAILY_PRAYERS, type DailyPrayerName, type MosqueView } from "@/types/mosque";

export type JourneyConfidence = "On-time" | "Tight" | "Risky";

export interface JourneyPrayerStop {
  prayer: DailyPrayerName;
  mosqueId: string;
  mosqueName: string;
  mosqueAddress: string;
  placeId: string | null;
  mosqueLat: number;
  mosqueLng: number;
  prayerTime24h: string;
  prayerTimeDisplay: string;
  estimatedArrival: string;
  waitMinutes: number;
  distanceFromRouteKm: number;
  confidence: JourneyConfidence;
}

interface BuildJourneyPrayerPlanOptions {
  mosques: MosqueView[];
  routePath: GeoPoint[];
  departureAt: Date;
  arrivalAt?: Date;
  routeDurationSeconds?: number;
}

const MAX_WAIT_MINUTES = 120;

export function buildJourneyPrayerPlan({
  mosques,
  routePath,
  departureAt,
  arrivalAt,
  routeDurationSeconds,
}: BuildJourneyPrayerPlanOptions): JourneyPrayerStop[] {
  if (routePath.length < 2 || mosques.length === 0) {
    return [];
  }

  const travelDurationMs = getTravelDurationMs({ departureAt, arrivalAt, routeDurationSeconds });
  if (travelDurationMs <= 0) {
    return [];
  }

  const routeProgress = getRouteProgress(routePath);
  if (routeProgress.totalDistanceKm <= 0) {
    return [];
  }

  const candidates = mosques
    .filter((mosque) => mosque.hasJamaatData)
    .map((mosque) => {
      const nearestPointIndex = findNearestPathIndex(routePath, {
        latitude: mosque.latitude,
        longitude: mosque.longitude,
      });
      const distanceAlongKm = routeProgress.cumulativeDistanceKm[nearestPointIndex] ?? 0;
      const progressRatio = Math.min(1, Math.max(0, distanceAlongKm / routeProgress.totalDistanceKm));
      const eta = new Date(departureAt.getTime() + progressRatio * travelDurationMs);

      return {
        mosque,
        nearestPointIndex,
        eta,
      };
    })
    .sort((a, b) => a.eta.getTime() - b.eta.getTime());

  let minPointIndex = 0;
  const plan: JourneyPrayerStop[] = [];

  for (const prayer of DAILY_PRAYERS) {
    let bestCandidate: JourneyPrayerStop | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const entry of candidates) {
      if (entry.nearestPointIndex < minPointIndex) {
        continue;
      }

      const prayerTime24h = entry.mosque.prayers[prayer];
      if (!prayerTime24h) {
        continue;
      }

      const prayerDate = getPrayerDate(prayerTime24h, departureAt);
      if (prayerDate.getTime() < departureAt.getTime()) {
        continue;
      }

      const journeyEnd = new Date(departureAt.getTime() + travelDurationMs);
      if (prayerDate.getTime() > journeyEnd.getTime()) {
        continue;
      }

      const waitMinutes = Math.ceil((prayerDate.getTime() - entry.eta.getTime()) / 60000);
      if (waitMinutes < 0 || waitMinutes > MAX_WAIT_MINUTES) {
        continue;
      }

      const detour = typeof entry.mosque.distanceFromRouteKm === "number" ? entry.mosque.distanceFromRouteKm : 0;
      const score = waitMinutes + detour * 8;

      if (score < bestScore) {
        bestScore = score;
        bestCandidate = {
          prayer,
          mosqueId: entry.mosque.id,
          mosqueName: entry.mosque.name,
          mosqueAddress: entry.mosque.address,
          placeId: entry.mosque.placeId ?? null,
          mosqueLat: entry.mosque.latitude,
          mosqueLng: entry.mosque.longitude,
          prayerTime24h,
          prayerTimeDisplay: formatDisplayTime(prayerTime24h),
          estimatedArrival: formatTime(entry.eta),
          waitMinutes,
          distanceFromRouteKm: detour,
          confidence: getConfidenceFromWait(waitMinutes),
        };
      }
    }

    if (bestCandidate) {
      plan.push(bestCandidate);
      const selected = candidates.find((entry) => entry.mosque.id === bestCandidate.mosqueId);
      if (selected) {
        minPointIndex = selected.nearestPointIndex;
      }
    }
  }

  return plan;
}

function getTravelDurationMs({
  departureAt,
  arrivalAt,
  routeDurationSeconds,
}: {
  departureAt: Date;
  arrivalAt?: Date;
  routeDurationSeconds?: number;
}) {
  if (arrivalAt && arrivalAt.getTime() > departureAt.getTime()) {
    return arrivalAt.getTime() - departureAt.getTime();
  }

  if (typeof routeDurationSeconds === "number" && routeDurationSeconds > 0) {
    return routeDurationSeconds * 1000;
  }

  return 0;
}

function getPrayerDate(time24h: string, baseDate: Date) {
  const [hoursText = "0", minutesText = "0"] = time24h.split(":");
  const date = new Date(baseDate);
  date.setHours(Number(hoursText), Number(minutesText), 0, 0);
  return date;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getRouteProgress(path: GeoPoint[]) {
  const cumulativeDistanceKm = [0];

  for (let index = 1; index < path.length; index += 1) {
    const segmentDistanceKm = haversineDistanceKm(path[index - 1], path[index]);
    cumulativeDistanceKm[index] = cumulativeDistanceKm[index - 1] + segmentDistanceKm;
  }

  return {
    cumulativeDistanceKm,
    totalDistanceKm: cumulativeDistanceKm[cumulativeDistanceKm.length - 1] || 0,
  };
}

function findNearestPathIndex(path: GeoPoint[], point: GeoPoint) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < path.length; index += 1) {
    const distance = haversineDistanceKm(path[index], point);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function getConfidenceFromWait(waitMinutes: number): JourneyConfidence {
  if (waitMinutes >= 25) {
    return "On-time";
  }

  if (waitMinutes >= 10) {
    return "Tight";
  }

  return "Risky";
}
