export interface ExtractedPrayerTimes {
  fajr: string | null;
  zuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
  jumma: string | null;
}

export type ExtractionFieldProvenance = "missing" | "detected" | "inferred" | "corrected";

export type ExtractionProvenanceMap = Record<keyof ExtractedPrayerTimes, ExtractionFieldProvenance>;

export interface ExtractedPrayerTimesWithProvenance {
  times: ExtractedPrayerTimes;
  provenance: ExtractionProvenanceMap;
}

export interface ExtractionIssue {
  code:
    | "missing-core-prayers"
    | "duplicate-daily-times"
    | "daily-order-invalid"
    | "jumma-out-of-range"
    | "asr-maghrib-collision"
    | "daily-pattern-drift";
  severity: "warning" | "critical";
  message: string;
}

export interface ExtractionQualityReport {
  confidence: "high" | "medium" | "low";
  hasCriticalIssues: boolean;
  issues: ExtractionIssue[];
}

type PrayerField = keyof ExtractedPrayerTimes;

interface TimeCandidate {
  hours: number;
  minutes: number;
  period?: string;
  index: number;
}

interface MinuteRange {
  min: number;
  max: number;
}

const ORDERED_DAILY_PRAYERS: PrayerField[] = ["fajr", "zuhr", "asr", "maghrib", "isha"];

const PRAYER_MINUTE_RANGES: Record<PrayerField, MinuteRange> = {
  fajr: { min: 120, max: 510 },
  zuhr: { min: 660, max: 930 },
  asr: { min: 750, max: 1170 },
  maghrib: { min: 960, max: 1320 },
  isha: { min: 1020, max: 1439 },
  jumma: { min: 660, max: 930 },
};

const PRAYER_TYPICAL_MINUTES: Record<PrayerField, number> = {
  fajr: 300,
  zuhr: 780,
  asr: 975,
  maghrib: 1130,
  isha: 1220,
  jumma: 810,
};

const MIN_GAP_AFTER: Partial<Record<PrayerField, number>> = {
  fajr: 180,
  zuhr: 60,
  asr: 45,
  maghrib: 40,
};

const ADJACENT_GAP_RANGES: Record<
  "fajr_zuhr" | "zuhr_asr" | "asr_maghrib" | "maghrib_isha",
  MinuteRange
> = {
  fajr_zuhr: { min: 330, max: 540 },
  zuhr_asr: { min: 90, max: 300 },
  asr_maghrib: { min: 45, max: 240 },
  maghrib_isha: { min: 40, max: 210 },
};

const OUTLIER_THRESHOLD_MINUTES = 55;
const TEMPLATE_INFER_MAX_DRIFT = 65;

const PRAYER_ALIASES: Record<keyof ExtractedPrayerTimes, string[]> = {
  fajr: ["fajr", "fajar", "fazr", "faj", "fair", "foir", "foir"],
  zuhr: ["zuhr", "zuhur", "dhuhr", "zohr", "zohar", "zuhar"],
  asr: ["asr", "asar"],
  maghrib: ["maghrib", "magrib", "magribh"],
  isha: ["isha", "esha"],
  jumma: [
    "jumma",
    "juma",
    "jummah",
    "jumuah",
    "jumua",
    "jum ah",
    "jum ahh",
    "juma1",
    "juma 1",
    "jamat",
    "jamaat",
    "khutbah",
    "khutba",
    "friday",
  ],
};

const OCR_TIME_PATTERN = /\b([01]?\d|2[0-3])[:.\-\s]([0-5]\d)\s*([ap]m)?\b/gi;
const OCR_TIME_WITHOUT_MINUTES_PATTERN = /\b(1[0-2]|0?[1-9])\s*([ap]m)\b/gi;

export function extractPrayerTimes(rawText: string): ExtractedPrayerTimes {
  return extractPrayerTimesWithProvenance(rawText).times;
}

export function extractPrayerTimesWithProvenance(rawText: string): ExtractedPrayerTimesWithProvenance {
  const normalizedText = normalizeOcrText(rawText);
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  console.log("🔧 NORMALIZED LINES:", lines);

  const extracted: ExtractedPrayerTimes = {
    fajr: null,
    zuhr: null,
    asr: null,
    maghrib: null,
    isha: null,
    jumma: null,
  };
  const provenance: ExtractionProvenanceMap = {
    fajr: "missing",
    zuhr: "missing",
    asr: "missing",
    maghrib: "missing",
    isha: "missing",
    jumma: "missing",
  };

  for (const prayer of Object.keys(PRAYER_ALIASES) as PrayerField[]) {
    const aliases = PRAYER_ALIASES[prayer];

    const directLineMatch = findTimeFromPrayerLines(lines, aliases, prayer);
    if (directLineMatch) {
      console.log(`✓ ${prayer} DIRECT MATCH:`, directLineMatch);
      extracted[prayer] = directLineMatch;
      provenance[prayer] = "detected";
      continue;
    }

    const nearbyMatch = findTimeNearAlias(normalizedText, aliases, prayer);
    if (nearbyMatch) {
      console.log(`✓ ${prayer} NEARBY MATCH:`, nearbyMatch);
      extracted[prayer] = nearbyMatch;
      provenance[prayer] = "detected";
    }
  }

  if (countExtractedTimes(extracted) < 3) {
    console.log("ℹ️ FEWER THAN 3 PRAYERS DETECTED - USING FALLBACK");
    mergeSequentialFallback(extracted, normalizedText, provenance);
  }

  if (!extracted.jumma) {
    extracted.jumma = findJummaFallback(lines);
    if (extracted.jumma) {
      provenance.jumma = "inferred";
    }
  }

  applyPrayerTimeIntelligence(extracted, normalizedText, provenance);

  return {
    times: extracted,
    provenance,
  };
}

export function analyzeExtractedPrayerTimes(times: ExtractedPrayerTimes): ExtractionQualityReport {
  const issues: ExtractionIssue[] = [];
  const dailyValues = ORDERED_DAILY_PRAYERS
    .map((prayer) => times[prayer])
    .filter((value): value is string => Boolean(value));

  const missingCore = ["fajr", "zuhr", "asr", "maghrib"] as const;
  const missingCount = missingCore.filter((prayer) => !times[prayer]).length;
  if (missingCount > 0) {
    issues.push({
      code: "missing-core-prayers",
      severity: missingCount >= 2 ? "critical" : "warning",
      message:
        missingCount >= 2
          ? "Multiple core prayers are missing. Please re-scan or fill manually."
          : "One core prayer is missing. Please verify before applying.",
    });
  }

  const duplicates = new Set<string>();
  const seen = new Set<string>();
  for (const value of dailyValues) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  if (duplicates.size > 0) {
    issues.push({
      code: "duplicate-daily-times",
      severity: "critical",
      message: "Two daily prayers have the same time. Please correct before applying.",
    });
  }

  const orderedMinutes = ORDERED_DAILY_PRAYERS.map((prayer) =>
    times[prayer] ? toMinutes(times[prayer] as string) : null,
  );
  for (let index = 1; index < orderedMinutes.length; index += 1) {
    const previous = orderedMinutes[index - 1];
    const current = orderedMinutes[index];
    if (previous === null || current === null) {
      continue;
    }
    if (current <= previous) {
      issues.push({
        code: "daily-order-invalid",
        severity: "critical",
        message: "Prayer order looks invalid (times are not increasing).",
      });
      break;
    }
  }

  if (times.asr && times.maghrib && toMinutes(times.asr) >= toMinutes(times.maghrib)) {
    issues.push({
      code: "asr-maghrib-collision",
      severity: "critical",
      message: "Asr must be earlier than Maghrib. Please verify these two fields.",
    });
  }

  if (times.jumma && !isLikelyJummaTime(times.jumma)) {
    issues.push({
      code: "jumma-out-of-range",
      severity: "critical",
      message: "Jummah time is outside Friday noon range. Please correct it.",
    });
  }

  const drift = computeDailyPatternDrift(times);
  if (drift !== null && drift > 70) {
    issues.push({
      code: "daily-pattern-drift",
      severity: "warning",
      message: "Detected daily timings look unusual for one timetable. Please double-check fields.",
    });
  }

  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const confidence: ExtractionQualityReport["confidence"] =
    criticalCount > 0 ? "low" : issues.length > 0 ? "medium" : "high";

  return {
    confidence,
    hasCriticalIssues: criticalCount > 0,
    issues,
  };
}

function computeDailyPatternDrift(times: ExtractedPrayerTimes) {
  const known = ORDERED_DAILY_PRAYERS
    .map((prayer) => ({ prayer, value: times[prayer] }))
    .filter((item): item is { prayer: PrayerField; value: string } => Boolean(item.value));

  if (known.length < 3) {
    return null;
  }

  const drifts = known.map((item) =>
    Math.abs(toMinutes(item.value) - PRAYER_TYPICAL_MINUTES[item.prayer]),
  );

  return median(drifts);
}

function applyPrayerTimeIntelligence(
  extracted: ExtractedPrayerTimes,
  text: string,
  provenance: ExtractionProvenanceMap,
) {
  for (const prayer of Object.keys(PRAYER_MINUTE_RANGES) as PrayerField[]) {
    const value = extracted[prayer];
    if (!value) {
      continue;
    }

    if (!isWithinPrayerRange(prayer, value)) {
      extracted[prayer] = null;
      provenance[prayer] = "missing";
    }
  }

  const candidateMap = buildPrayerCandidateMap(text);

  fillMissingDailyPrayers(extracted, candidateMap, provenance);
  inferDailyTimesFromAdaptiveTemplate(extracted, candidateMap, provenance);
  inferUsingAdjacentPrayerGaps(extracted, candidateMap, provenance);
  correctOutlierDailyTimes(extracted, candidateMap, provenance);
  repairAsrMaghribCollision(extracted, candidateMap, provenance);
  repairJummaTime(extracted, candidateMap, provenance);
  enforceChronologicalOrder(extracted, candidateMap, provenance);
}

function inferUsingAdjacentPrayerGaps(
  extracted: ExtractedPrayerTimes,
  candidateMap: Record<PrayerField, string[]>,
  provenance: ExtractionProvenanceMap,
) {
  const edges: Array<{
    left: PrayerField;
    right: PrayerField;
    gapKey: keyof typeof ADJACENT_GAP_RANGES;
  }> = [
    { left: "fajr", right: "zuhr", gapKey: "fajr_zuhr" },
    { left: "zuhr", right: "asr", gapKey: "zuhr_asr" },
    { left: "asr", right: "maghrib", gapKey: "asr_maghrib" },
    { left: "maghrib", right: "isha", gapKey: "maghrib_isha" },
  ];

  for (const edge of edges) {
    const leftValue = extracted[edge.left];
    const rightValue = extracted[edge.right];
    const gapRange = ADJACENT_GAP_RANGES[edge.gapKey];

    if (!leftValue && !rightValue) {
      continue;
    }

    if (!rightValue && leftValue) {
      const inferred = inferByNeighbor({
        prayer: edge.right,
        anchorMinutes: toMinutes(leftValue),
        range: { min: gapRange.min, max: gapRange.max },
        direction: "forward",
        candidates: candidateMap[edge.right],
      });

      if (inferred) {
        extracted[edge.right] = inferred;
        provenance[edge.right] = "inferred";
      }
      continue;
    }

    if (!leftValue && rightValue) {
      const inferred = inferByNeighbor({
        prayer: edge.left,
        anchorMinutes: toMinutes(rightValue),
        range: { min: gapRange.min, max: gapRange.max },
        direction: "backward",
        candidates: candidateMap[edge.left],
      });

      if (inferred) {
        extracted[edge.left] = inferred;
        provenance[edge.left] = "inferred";
      }
      continue;
    }

    // Both exist but gap implausible: prefer candidate adjustment for the right prayer.
    if (leftValue && rightValue) {
      if (provenance[edge.left] === "detected" && provenance[edge.right] === "detected") {
        continue;
      }

      const leftMinutes = toMinutes(leftValue);
      const rightMinutes = toMinutes(rightValue);
      const gap = rightMinutes - leftMinutes;
      if (gap >= gapRange.min && gap <= gapRange.max) {
        continue;
      }

      const correctedRight = inferByNeighbor({
        prayer: edge.right,
        anchorMinutes: leftMinutes,
        range: { min: gapRange.min, max: gapRange.max },
        direction: "forward",
        candidates: candidateMap[edge.right],
      });

      if (correctedRight && correctedRight !== rightValue) {
        extracted[edge.right] = correctedRight;
        provenance[edge.right] = "corrected";
      }
    }
  }
}

function inferByNeighbor({
  prayer,
  anchorMinutes,
  range,
  direction,
  candidates,
}: {
  prayer: PrayerField;
  anchorMinutes: number;
  range: MinuteRange;
  direction: "forward" | "backward";
  candidates: string[];
}) {
  const expected =
    direction === "forward"
      ? anchorMinutes + (range.min + range.max) / 2
      : anchorMinutes - (range.min + range.max) / 2;
  const lower = direction === "forward" ? anchorMinutes + range.min : anchorMinutes - range.max;
  const upper = direction === "forward" ? anchorMinutes + range.max : anchorMinutes - range.min;

  const inRangeCandidates = candidates
    .filter((value) => {
      const minutes = toMinutes(value);
      return minutes >= lower && minutes <= upper;
    })
    .sort(
      (left, right) =>
        Math.abs(toMinutes(left) - expected) - Math.abs(toMinutes(right) - expected),
    );

  if (inRangeCandidates.length > 0) {
    return inRangeCandidates[0];
  }

  const clampedExpected = clampMinutes(expected, PRAYER_MINUTE_RANGES[prayer]);
  return minutesToTime(clampedExpected);
}

function buildPrayerCandidateMap(text: string) {
  const candidates = collectTimeCandidates(text);
  const map: Record<PrayerField, string[]> = {
    fajr: [],
    zuhr: [],
    asr: [],
    maghrib: [],
    isha: [],
    jumma: [],
  };

  for (const prayer of Object.keys(map) as PrayerField[]) {
    const seen = new Set<string>();
    const values: string[] = [];

    for (const candidate of candidates) {
      const normalized = normalizeCandidate(candidate, prayer);
      if (!normalized || seen.has(normalized) || !isWithinPrayerRange(prayer, normalized)) {
        continue;
      }
      seen.add(normalized);
      values.push(normalized);
    }

    // Include direct parser results as extra candidates for robustness.
    for (const parsed of extractAllTimes(text, prayer)) {
      if (seen.has(parsed) || !isWithinPrayerRange(prayer, parsed)) {
        continue;
      }
      seen.add(parsed);
      values.push(parsed);
    }

    map[prayer] = values.sort((left, right) => toMinutes(left) - toMinutes(right));
  }

  return map;
}

function fillMissingDailyPrayers(
  extracted: ExtractedPrayerTimes,
  candidateMap: Record<PrayerField, string[]>,
  provenance: ExtractionProvenanceMap,
) {
  for (const prayer of ORDERED_DAILY_PRAYERS) {
    if (extracted[prayer]) {
      continue;
    }

    const previousPrayer = getPreviousPrayer(prayer);
    const nextPrayer = getNextPrayer(prayer);
    const previousMinutes = previousPrayer && extracted[previousPrayer] ? toMinutes(extracted[previousPrayer] as string) : null;
    const nextMinutes = nextPrayer && extracted[nextPrayer] ? toMinutes(extracted[nextPrayer] as string) : null;

    const minAllowed =
      previousMinutes === null
        ? PRAYER_MINUTE_RANGES[prayer].min
        : previousMinutes + (MIN_GAP_AFTER[previousPrayer as PrayerField] || 20);
    const maxAllowed =
      nextMinutes === null
        ? PRAYER_MINUTE_RANGES[prayer].max
        : nextMinutes - (MIN_GAP_AFTER[prayer] || 20);

    const candidates = candidateMap[prayer]
      .filter((value) => {
        const minutes = toMinutes(value);
        return minutes >= minAllowed && minutes <= maxAllowed;
      })
      .sort(
        (left, right) =>
          Math.abs(toMinutes(left) - PRAYER_TYPICAL_MINUTES[prayer]) -
          Math.abs(toMinutes(right) - PRAYER_TYPICAL_MINUTES[prayer]),
      );

    if (candidates.length > 0) {
      extracted[prayer] = candidates[0];
      provenance[prayer] = "inferred";
    }
  }
}

function repairAsrMaghribCollision(
  extracted: ExtractedPrayerTimes,
  candidateMap: Record<PrayerField, string[]>,
  provenance: ExtractionProvenanceMap,
) {
  if (!extracted.asr || !extracted.maghrib) {
    return;
  }

  const asr = toMinutes(extracted.asr);
  const maghrib = toMinutes(extracted.maghrib);
  if (maghrib > asr) {
    return;
  }

  const replacement = candidateMap.maghrib.find((value) => toMinutes(value) > asr + 25);
  extracted.maghrib = replacement || null;
  provenance.maghrib = replacement ? "corrected" : "missing";
}

function repairJummaTime(
  extracted: ExtractedPrayerTimes,
  candidateMap: Record<PrayerField, string[]>,
  provenance: ExtractionProvenanceMap,
) {
  const current = extracted.jumma;
  if (current && isLikelyJummaTime(current)) {
    return;
  }

  const zuhrMinutes = extracted.zuhr ? toMinutes(extracted.zuhr) : null;
  const asrMinutes = extracted.asr ? toMinutes(extracted.asr) : null;

  const candidates = candidateMap.jumma.filter((value) => {
    const minutes = toMinutes(value);

    if (zuhrMinutes !== null && minutes < zuhrMinutes - 45) {
      return false;
    }

    if (asrMinutes !== null && minutes > asrMinutes - 20) {
      return false;
    }

    return isLikelyJummaTime(value);
  });

  // If OCR missed Jummah label, a practical fallback is a little after Zuhr.
  if (candidates.length === 0 && zuhrMinutes !== null) {
    const inferred = clampMinutes(zuhrMinutes + 15, PRAYER_MINUTE_RANGES.jumma);
    extracted.jumma = minutesToTime(inferred);
    provenance.jumma = "inferred";
    return;
  }

  if (candidates.length > 0) {
    const best = candidates.sort(
      (left, right) =>
        Math.abs(toMinutes(left) - PRAYER_TYPICAL_MINUTES.jumma) -
        Math.abs(toMinutes(right) - PRAYER_TYPICAL_MINUTES.jumma),
    )[0];
    extracted.jumma = best;
    provenance.jumma = current ? "corrected" : "inferred";
    return;
  }

  extracted.jumma = null;
  provenance.jumma = "missing";
}

function inferDailyTimesFromAdaptiveTemplate(
  extracted: ExtractedPrayerTimes,
  candidateMap: Record<PrayerField, string[]>,
  provenance: ExtractionProvenanceMap,
) {
  const known = ORDERED_DAILY_PRAYERS
    .map((prayer) => ({ prayer, value: extracted[prayer] }))
    .filter((item): item is { prayer: PrayerField; value: string } => Boolean(item.value));

  if (known.length < 2) {
    return;
  }

  const drifts = known.map((item) => toMinutes(item.value) - PRAYER_TYPICAL_MINUTES[item.prayer]);
  const drift = median(drifts);

  for (const prayer of ORDERED_DAILY_PRAYERS) {
    if (extracted[prayer]) {
      continue;
    }

    const expectedMinutes = PRAYER_TYPICAL_MINUTES[prayer] + drift;
    const boundedExpected = clampMinutes(expectedMinutes, PRAYER_MINUTE_RANGES[prayer]);
    const preferred = candidateMap[prayer]
      .map((value) => ({ value, delta: Math.abs(toMinutes(value) - boundedExpected) }))
      .sort((a, b) => a.delta - b.delta)[0];

    if (preferred && preferred.delta <= TEMPLATE_INFER_MAX_DRIFT) {
      extracted[prayer] = preferred.value;
      provenance[prayer] = "inferred";
      continue;
    }

    extracted[prayer] = minutesToTime(boundedExpected);
    provenance[prayer] = "inferred";
  }
}

function correctOutlierDailyTimes(
  extracted: ExtractedPrayerTimes,
  candidateMap: Record<PrayerField, string[]>,
  provenance: ExtractionProvenanceMap,
) {
  const known = ORDERED_DAILY_PRAYERS
    .map((prayer) => ({ prayer, value: extracted[prayer] }))
    .filter((item): item is { prayer: PrayerField; value: string } => Boolean(item.value));

  if (known.length < 3) {
    return;
  }

  const drifts = known.map((item) => toMinutes(item.value) - PRAYER_TYPICAL_MINUTES[item.prayer]);
  const drift = median(drifts);

  for (const prayer of ORDERED_DAILY_PRAYERS) {
    const value = extracted[prayer];
    if (!value) {
      continue;
    }

    if (provenance[prayer] === "detected") {
      continue;
    }

    const currentMinutes = toMinutes(value);
    const expectedMinutes = clampMinutes(PRAYER_TYPICAL_MINUTES[prayer] + drift, PRAYER_MINUTE_RANGES[prayer]);
    const deviation = Math.abs(currentMinutes - expectedMinutes);

    if (deviation < OUTLIER_THRESHOLD_MINUTES) {
      continue;
    }

    const replacement = candidateMap[prayer]
      .map((candidate) => ({ candidate, delta: Math.abs(toMinutes(candidate) - expectedMinutes) }))
      .sort((a, b) => a.delta - b.delta)[0];

    if (replacement && replacement.delta + 10 < deviation) {
      extracted[prayer] = replacement.candidate;
      provenance[prayer] = "corrected";
    }
  }
}

function enforceChronologicalOrder(
  extracted: ExtractedPrayerTimes,
  candidateMap: Record<PrayerField, string[]>,
  provenance: ExtractionProvenanceMap,
) {
  for (let index = 1; index < ORDERED_DAILY_PRAYERS.length; index += 1) {
    const previousPrayer = ORDERED_DAILY_PRAYERS[index - 1];
    const prayer = ORDERED_DAILY_PRAYERS[index];
    const previousValue = extracted[previousPrayer];
    const currentValue = extracted[prayer];

    if (!previousValue || !currentValue) {
      continue;
    }

    const previousMinutes = toMinutes(previousValue);
    const currentMinutes = toMinutes(currentValue);
    const requiredGap = MIN_GAP_AFTER[previousPrayer] || 20;

    if (currentMinutes > previousMinutes + requiredGap) {
      continue;
    }

    const replacement = candidateMap[prayer].find(
      (value) => toMinutes(value) > previousMinutes + requiredGap,
    );

    extracted[prayer] = replacement || null;
    provenance[prayer] = replacement ? "corrected" : "missing";
  }
}

function getPreviousPrayer(prayer: PrayerField) {
  const index = ORDERED_DAILY_PRAYERS.indexOf(prayer);
  if (index <= 0) {
    return null;
  }
  return ORDERED_DAILY_PRAYERS[index - 1];
}

function getNextPrayer(prayer: PrayerField) {
  const index = ORDERED_DAILY_PRAYERS.indexOf(prayer);
  if (index < 0 || index >= ORDERED_DAILY_PRAYERS.length - 1) {
    return null;
  }
  return ORDERED_DAILY_PRAYERS[index + 1];
}

function isWithinPrayerRange(prayer: PrayerField, value: string) {
  const minutes = toMinutes(value);
  const range = PRAYER_MINUTE_RANGES[prayer];
  return minutes >= range.min && minutes <= range.max;
}

function clampMinutes(minutes: number, range: MinuteRange) {
  return Math.max(range.min, Math.min(range.max, Math.round(minutes)));
}

function findJummaFallback(lines: string[]) {
  const jummaContextPattern =
    /(jum|juma|jumma|jummah|jumuah|friday|khutba|khutbah|jamat|jamaat)/i;

  for (let index = 0; index < lines.length; index += 1) {
    if (!jummaContextPattern.test(lines[index])) {
      continue;
    }

    const windowLines = [
      lines[index - 2],
      lines[index - 1],
      lines[index],
      lines[index + 1],
      lines[index + 2],
    ].filter((value): value is string => Boolean(value));

    const candidates = extractAllTimes(windowLines.join(" "), "jumma").filter((time) =>
      isLikelyJummaTime(time),
    );

    if (candidates.length === 0) {
      continue;
    }

    // Prefer the latest valid noon slot when multiple values are present (often khutbah + jamaat).
    return candidates.sort((left, right) => toMinutes(right) - toMinutes(left))[0];
  }

  return null;
}

function findTimeFromPrayerLines(lines: string[], aliases: string[], prayer: PrayerField) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!containsAlias(line, aliases)) {
      continue;
    }

    const sameLineCandidates = extractAllTimes(line, prayer);
    const sameLine = pickBestPrayerTimeCandidate(sameLineCandidates, prayer, "same-line");
    if (sameLine) {
      return sameLine;
    }

    const windowLines = [lines[index - 1], lines[index], lines[index + 1]].filter(
      (value): value is string => Boolean(value),
    );

    const candidate = extractBestTime(windowLines.join(" "), prayer, "window");
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function findTimeNearAlias(text: string, aliases: string[], prayer: PrayerField) {
  for (const alias of aliases) {
    const escaped = escapeRegExp(alias);
    const nearbyPattern = new RegExp(`${escaped}[^\n\r]{0,40}`, "gi");
    const matches = text.match(nearbyPattern);
    if (!matches) {
      continue;
    }

    for (const match of matches) {
      const candidate = extractBestTime(match, prayer, "nearby");
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

function extractFirstTime(text: string, prayer?: PrayerField) {
  const candidates = extractAllTimes(text, prayer);
  return candidates[0] || null;
}

function extractBestTime(
  text: string,
  prayer: PrayerField,
  context: "same-line" | "window" | "nearby",
) {
  const candidates = extractAllTimes(text, prayer);
  return pickBestPrayerTimeCandidate(candidates, prayer, context);
}

function pickBestPrayerTimeCandidate(
  candidates: string[],
  prayer: PrayerField,
  context: "same-line" | "window" | "nearby",
) {
  if (candidates.length === 0) {
    return null;
  }

  if (prayer === "jumma") {
    const valid = candidates.filter((value) => isLikelyJummaTime(value));
    if (valid.length === 0) {
      return null;
    }
    return valid.sort((left, right) => toMinutes(right) - toMinutes(left))[0];
  }

  if (context === "same-line") {
    // Same row often contains Azan then Jamaat; prefer later value for Jamaat use-case.
    return [...candidates].sort((left, right) => toMinutes(right) - toMinutes(left))[0];
  }

  const scored = candidates
    .map((value) => {
      const minutes = toMinutes(value);
      const typicalDistance = Math.abs(minutes - PRAYER_TYPICAL_MINUTES[prayer]);
      const slightLaterPreference = minutes / 1000;
      return { value, score: typicalDistance - slightLaterPreference };
    })
    .sort((left, right) => left.score - right.score);

  return scored[0]?.value ?? null;
}

function extractAllTimes(text: string, prayer?: PrayerField) {
  const normalized: string[] = [];
  const seen = new Set<string>();

  OCR_TIME_PATTERN.lastIndex = 0;
  let first = OCR_TIME_PATTERN.exec(text);
  while (first) {
    const hours = Number(first[1]);
    const minutes = Number(first[2]);
    const period = first[3]?.toLowerCase();

    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      const value = normalizeTime(hours, minutes, period, prayer);
      if (value && !seen.has(value)) {
        seen.add(value);
        normalized.push(value);
      }
    }

    first = OCR_TIME_PATTERN.exec(text);
  }

  OCR_TIME_WITHOUT_MINUTES_PATTERN.lastIndex = 0;
  let fallback = OCR_TIME_WITHOUT_MINUTES_PATTERN.exec(text);
  while (fallback) {
    const hours = Number(fallback[1]);
    const period = fallback[2]?.toLowerCase();

    if (Number.isFinite(hours)) {
      const value = normalizeTime(hours, 0, period, prayer);
      if (value && !seen.has(value)) {
        seen.add(value);
        normalized.push(value);
      }
    }

    fallback = OCR_TIME_WITHOUT_MINUTES_PATTERN.exec(text);
  }

  return normalized;
}

function normalizeTime(hours: number, minutes: number, period?: string, prayer?: PrayerField) {
  let normalizedHours = hours;

  if (period === "pm" && normalizedHours < 12) {
    normalizedHours += 12;
  }

  if (period === "am" && normalizedHours === 12) {
    normalizedHours = 0;
  }

  if (!period && prayer && shouldAssumePostNoon(prayer, normalizedHours)) {
    normalizedHours += 12;
  }

  if (normalizedHours < 0 || normalizedHours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function shouldAssumePostNoon(prayer: PrayerField, hours: number) {
  if (hours < 1 || hours > 11) {
    return false;
  }

  return prayer !== "fajr";
}

function countExtractedTimes(extracted: ExtractedPrayerTimes) {
  return Object.values(extracted).filter(Boolean).length;
}

function mergeSequentialFallback(
  extracted: ExtractedPrayerTimes,
  text: string,
  provenance?: ExtractionProvenanceMap,
) {
  const candidates = collectTimeCandidates(text);
  if (candidates.length < 5) {
    return;
  }

  const prayers: PrayerField[] = ["fajr", "zuhr", "asr", "maghrib", "isha"];

  for (let start = 0; start <= candidates.length - prayers.length; start += 1) {
    const window = candidates.slice(start, start + prayers.length);
    const mapped = prayers.map((prayer, index) => normalizeCandidate(window[index], prayer));

    if (mapped.some((value) => !value)) {
      continue;
    }

    const normalizedWindow = mapped as string[];
    if (!isStrictlyAscending(normalizedWindow) || !matchesPrayerRanges(normalizedWindow)) {
      continue;
    }

    prayers.forEach((prayer, index) => {
      if (!extracted[prayer]) {
        extracted[prayer] = normalizedWindow[index];
        if (provenance) {
          provenance[prayer] = "inferred";
        }
      }
    });
    return;
  }
}

function collectTimeCandidates(text: string) {
  const candidates: TimeCandidate[] = [];
  const seen = new Set<string>();

  OCR_TIME_PATTERN.lastIndex = 0;
  let match = OCR_TIME_PATTERN.exec(text);
  while (match) {
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3]?.toLowerCase();
    const signature = `${match.index}:${hours}:${minutes}:${period || ""}`;

    if (!seen.has(signature) && Number.isFinite(hours) && Number.isFinite(minutes)) {
      seen.add(signature);
      candidates.push({ hours, minutes, period, index: match.index });
    }

    match = OCR_TIME_PATTERN.exec(text);
  }

  OCR_TIME_WITHOUT_MINUTES_PATTERN.lastIndex = 0;
  let fallback = OCR_TIME_WITHOUT_MINUTES_PATTERN.exec(text);
  while (fallback) {
    const hours = Number(fallback[1]);
    const period = fallback[2]?.toLowerCase();
    const signature = `${fallback.index}:${hours}:0:${period || ""}`;

    if (!seen.has(signature) && Number.isFinite(hours)) {
      seen.add(signature);
      candidates.push({ hours, minutes: 0, period, index: fallback.index });
    }

    fallback = OCR_TIME_WITHOUT_MINUTES_PATTERN.exec(text);
  }

  return candidates.sort((left, right) => left.index - right.index);
}

function normalizeCandidate(candidate: TimeCandidate, prayer: PrayerField) {
  return normalizeTime(candidate.hours, candidate.minutes, candidate.period, prayer);
}

function isStrictlyAscending(values: string[]) {
  const minutes = values.map(toMinutes);
  for (let index = 1; index < minutes.length; index += 1) {
    if (minutes[index] <= minutes[index - 1]) {
      return false;
    }
  }

  return true;
}

function matchesPrayerRanges(values: string[]) {
  const [fajr, zuhr, asr, maghrib, isha] = values.map(toMinutes);

  return (
    fajr >= 120 && fajr <= 510 &&
    zuhr >= 660 && zuhr <= 930 &&
    asr >= 750 && asr <= 1170 &&
    maghrib >= 960 && maghrib <= 1320 &&
    isha >= 1020 && isha <= 1439
  );
}

function isLikelyJummaTime(value: string) {
  const minutes = toMinutes(value);
  return minutes >= 660 && minutes <= 930;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const normalized = ((Math.round(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function containsAlias(text: string, aliases: string[]) {
  return aliases.some((alias) => text.includes(alias));
}

function normalizeOcrText(text: string) {
  return text
    .toLowerCase()
    .replace(/[|]/g, "l")
    .replace(/[’']/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
