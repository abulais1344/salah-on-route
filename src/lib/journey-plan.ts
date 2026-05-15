import { formatDisplayTime } from "@/lib/jamaat";
import { haversineDistanceKm, type GeoPoint } from "@/lib/geo";
import { DAILY_PRAYERS, type DailyPrayerName, type MosqueView } from "@/types/mosque";

export type JourneyUrgency = "Comfortable" | "Tight timing" | "Risk of missing";
export type EstimatedTimingConfidence = "High" | "Medium" | "Low";
export type JourneyTimingSource = "Verified" | "Community" | "Estimated";

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
  estimatedDetourMinutes: number;
  urgency: JourneyUrgency;
  timingSource: JourneyTimingSource;
  estimateConfidence: EstimatedTimingConfidence | null;
  estimateExplanation: string | null;
  recommendationReasons: string[];
  score: number;
  isPrimaryRecommendation: boolean;
}

interface BuildJourneyPrayerPlanOptions {
  mosques: MosqueView[];
  routePath: GeoPoint[];
  departureAt: Date;
  arrivalAt?: Date;
  routeDurationSeconds?: number;
}

const MAX_WAIT_MINUTES = 120;
const MIN_SAFE_WAIT_MINUTES = 5;
const IDEAL_WAIT_MINUTES = 8;
const NEARBY_PATTERN_RADIUS_KM = 6;
const MAX_NEIGHBOR_SAMPLE = 6;

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

  const journeyEnd = new Date(departureAt.getTime() + travelDurationMs);
  const opportunities: JourneyPrayerStop[] = [];

  for (const prayer of DAILY_PRAYERS) {
    for (const entry of candidates) {
      const timing = getEffectivePrayerTiming({
        prayer,
        mosque: entry.mosque,
        allMosques: mosques,
      });
      if (!timing) continue;

      const prayerDate = getPrayerDate(timing.time24h, departureAt);
      if (prayerDate.getTime() < departureAt.getTime()) {
        continue;
      }

      if (prayerDate.getTime() > journeyEnd.getTime()) {
        continue;
      }

      const waitMinutes = Math.ceil((prayerDate.getTime() - entry.eta.getTime()) / 60000);
      if (waitMinutes < 0 || waitMinutes > MAX_WAIT_MINUTES) {
        continue;
      }

      const detour = typeof entry.mosque.distanceFromRouteKm === "number" ? entry.mosque.distanceFromRouteKm : 0;
      const estimatedDetourMinutes = Math.max(1, Math.round(detour * 1.5));
      const urgency = getUrgencyFromWait(waitMinutes);
      const score = getRecommendationScore({
        waitMinutes,
        detourKm: detour,
        urgency,
        timingSource: timing.source,
        estimateConfidence: timing.estimateConfidence,
      });

      opportunities.push({
        prayer,
        mosqueId: entry.mosque.id,
        mosqueName: entry.mosque.name,
        mosqueAddress: entry.mosque.address,
        placeId: entry.mosque.placeId ?? null,
        mosqueLat: entry.mosque.latitude,
        mosqueLng: entry.mosque.longitude,
        prayerTime24h: timing.time24h,
        prayerTimeDisplay: formatDisplayTime(timing.time24h),
        estimatedArrival: formatTime(entry.eta),
        waitMinutes,
        distanceFromRouteKm: detour,
        estimatedDetourMinutes,
        urgency,
        timingSource: timing.source,
        estimateConfidence: timing.estimateConfidence,
        estimateExplanation: timing.estimateExplanation,
        recommendationReasons: buildRecommendationReasons({
          waitMinutes,
          estimatedDetourMinutes,
          timingSource: timing.source,
          urgency,
          estimateExplanation: timing.estimateExplanation,
        }),
        score,
        isPrimaryRecommendation: false,
      });
    }
  }

  if (opportunities.length === 0) {
    return [];
  }

  opportunities.sort((a, b) => a.score - b.score);

  const primary = opportunities[0];
  const byPrayerBest = new Map<DailyPrayerName, JourneyPrayerStop>();

  for (const stop of opportunities) {
    const existing = byPrayerBest.get(stop.prayer);
    if (!existing || stop.score < existing.score) {
      byPrayerBest.set(stop.prayer, stop);
    }
  }

  const deduped: JourneyPrayerStop[] = [primary];
  const usedKeys = new Set([`${primary.mosqueId}-${primary.prayer}`]);

  for (const prayer of DAILY_PRAYERS) {
    const stop = byPrayerBest.get(prayer);
    if (!stop) continue;
    const key = `${stop.mosqueId}-${stop.prayer}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    deduped.push(stop);
  }

  return deduped.map((stop, index) => ({
    ...stop,
    isPrimaryRecommendation: index === 0,
  }));
}

function getEffectivePrayerTiming({
  prayer,
  mosque,
  allMosques,
}: {
  prayer: DailyPrayerName;
  mosque: MosqueView;
  allMosques: MosqueView[];
}): {
  time24h: string;
  source: JourneyTimingSource;
  estimateConfidence: EstimatedTimingConfidence | null;
  estimateExplanation: string | null;
} | null {
  const direct = mosque.prayers[prayer];
  if (direct) {
    return {
      time24h: direct,
      source: mosque.isVerified ? "Verified" : "Community",
      estimateConfidence: null,
      estimateExplanation: null,
    };
  }

  const estimate = estimatePrayerTimeFromNearby({
    prayer,
    mosque,
    allMosques,
  });

  if (!estimate) {
    return null;
  }

  return {
    time24h: estimate.time24h,
    source: "Estimated",
    estimateConfidence: estimate.confidence,
    estimateExplanation: `Estimated ${formatPrayerName(prayer)}: ${formatDisplayTime(
      estimate.time24h,
    )} based on nearby mosques`,
  };
}

function estimatePrayerTimeFromNearby({
  prayer,
  mosque,
  allMosques,
}: {
  prayer: DailyPrayerName;
  mosque: MosqueView;
  allMosques: MosqueView[];
}): { time24h: string; confidence: EstimatedTimingConfidence } | null {
  const neighbors = allMosques
    .filter((entry) => entry.id !== mosque.id)
    .map((entry) => {
      const distanceKm = haversineDistanceKm(
        { latitude: mosque.latitude, longitude: mosque.longitude },
        { latitude: entry.latitude, longitude: entry.longitude },
      );
      return {
        entry,
        distanceKm,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const inRadius = neighbors.filter((item) => item.distanceKm <= NEARBY_PATTERN_RADIUS_KM);
  const sample = (inRadius.length > 0 ? inRadius : neighbors).slice(0, MAX_NEIGHBOR_SAMPLE);
  if (sample.length === 0) {
    return null;
  }

  const withTiming = sample.filter((item) => Boolean(item.entry.prayers[prayer]));
  if (withTiming.length === 0) {
    return null;
  }

  let weightedTotal = 0;
  let weightSum = 0;
  const timingMinutes: number[] = [];

  for (const item of withTiming) {
    const time24h = item.entry.prayers[prayer];
    if (!time24h) continue;
    const minutes = timeToMinutes(time24h);
    timingMinutes.push(minutes);
    const weight = 1 / Math.max(0.2, item.distanceKm);
    weightedTotal += minutes * weight;
    weightSum += weight;
  }

  if (weightSum === 0 || timingMinutes.length === 0) {
    return null;
  }

  const weightedAverage = weightedTotal / weightSum;
  const rounded = Math.round(weightedAverage / 5) * 5;
  const coverage = withTiming.length / sample.length;
  const spread = getSpreadMinutes(timingMinutes);

  return {
    time24h: minutesToTime(rounded),
    confidence: getEstimateConfidence({
      coverage,
      sampleCount: withTiming.length,
      spread,
    }),
  };
}

function getEstimateConfidence({
  coverage,
  sampleCount,
  spread,
}: {
  coverage: number;
  sampleCount: number;
  spread: number;
}): EstimatedTimingConfidence {
  if (coverage >= 0.75 && sampleCount >= 3 && spread <= 10) {
    return "High";
  }

  if (coverage >= 0.4 && sampleCount >= 2 && spread <= 20) {
    return "Medium";
  }

  return "Low";
}

function getSpreadMinutes(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return max - min;
}

function getRecommendationScore({
  waitMinutes,
  detourKm,
  urgency,
  timingSource,
  estimateConfidence,
}: {
  waitMinutes: number;
  detourKm: number;
  urgency: JourneyUrgency;
  timingSource: JourneyTimingSource;
  estimateConfidence: EstimatedTimingConfidence | null;
}) {
  const waitPenalty = Math.abs(waitMinutes - IDEAL_WAIT_MINUTES) + Math.max(0, waitMinutes - 40) * 0.5;
  const detourPenalty = detourKm * 9;
  const urgencyPenalty =
    urgency === "Comfortable"
      ? 0
      : urgency === "Tight timing"
        ? 6
        : 15;
  const sourceAdjustment =
    timingSource === "Verified"
      ? -4
      : timingSource === "Estimated"
        ? estimateConfidence === "High"
          ? 2
          : estimateConfidence === "Medium"
            ? 6
            : 10
        : 0;

  return waitPenalty + detourPenalty + urgencyPenalty + sourceAdjustment;
}

function buildRecommendationReasons({
  waitMinutes,
  estimatedDetourMinutes,
  timingSource,
  urgency,
  estimateExplanation,
}: {
  waitMinutes: number;
  estimatedDetourMinutes: number;
  timingSource: JourneyTimingSource;
  urgency: JourneyUrgency;
  estimateExplanation: string | null;
}) {
  const reasons = [
    `Arrive ${waitMinutes} mins before jamaat`,
    `Only ~${estimatedDetourMinutes} min detour`,
  ];

  if (timingSource === "Verified") {
    reasons.push("Verified timings");
  } else if (timingSource === "Community") {
    reasons.push("Community-updated timings");
  } else if (estimateExplanation) {
    reasons.push(estimateExplanation);
  }

  if (urgency === "Comfortable") {
    reasons.push("Comfortable arrival window");
  } else if (urgency === "Tight timing") {
    reasons.push("Tight but catchable timing");
  } else {
    reasons.push("Risk of missing if delayed");
  }

  return reasons.slice(0, 3);
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

function getUrgencyFromWait(waitMinutes: number): JourneyUrgency {
  if (waitMinutes >= 15) {
    return "Comfortable";
  }

  if (waitMinutes >= MIN_SAFE_WAIT_MINUTES) {
    return "Tight timing";
  }

  return "Risk of missing";
}

function timeToMinutes(time24h: string) {
  const [hoursText = "0", minutesText = "0"] = time24h.split(":");
  return Number(hoursText) * 60 + Number(minutesText);
}

function minutesToTime(totalMinutes: number) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function formatPrayerName(prayer: DailyPrayerName) {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1);
}
