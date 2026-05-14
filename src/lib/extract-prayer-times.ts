export interface ExtractedPrayerTimes {
  fajr: string | null;
  zuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
  jumma: string | null;
}

type PrayerField = keyof ExtractedPrayerTimes;

interface TimeCandidate {
  hours: number;
  minutes: number;
  period?: string;
  index: number;
}

const PRAYER_ALIASES: Record<keyof ExtractedPrayerTimes, string[]> = {
  fajr: ["fajr", "fajar", "fazr", "faj"],
  zuhr: ["zuhr", "zuhur", "dhuhr", "zohr", "zohar"],
  asr: ["asr", "asar"],
  maghrib: ["maghrib", "magrib", "magribh"],
  isha: ["isha", "esha"],
  jumma: ["jumma", "juma", "jummah", "jumuah", "jumua", "khutbah"],
};

const OCR_TIME_PATTERN = /\b([01]?\d|2[0-3])[:.\-\s]([0-5]\d)\s*([ap]m)?\b/gi;
const OCR_TIME_WITHOUT_MINUTES_PATTERN = /\b(1[0-2]|0?[1-9])\s*([ap]m)\b/gi;

export function extractPrayerTimes(rawText: string): ExtractedPrayerTimes {
  const normalizedText = normalizeOcrText(rawText);
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const extracted: ExtractedPrayerTimes = {
    fajr: null,
    zuhr: null,
    asr: null,
    maghrib: null,
    isha: null,
    jumma: null,
  };

  for (const prayer of Object.keys(PRAYER_ALIASES) as PrayerField[]) {
    const aliases = PRAYER_ALIASES[prayer];

    const directLineMatch = findTimeFromPrayerLines(lines, aliases, prayer);
    if (directLineMatch) {
      extracted[prayer] = directLineMatch;
      continue;
    }

    const nearbyMatch = findTimeNearAlias(normalizedText, aliases, prayer);
    if (nearbyMatch) {
      extracted[prayer] = nearbyMatch;
    }
  }

  if (countExtractedTimes(extracted) < 3) {
    mergeSequentialFallback(extracted, normalizedText);
  }

  return extracted;
}

function findTimeFromPrayerLines(lines: string[], aliases: string[], prayer: PrayerField) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!containsAlias(line, aliases)) {
      continue;
    }

    const windowLines = [lines[index - 1], lines[index], lines[index + 1]].filter(
      (value): value is string => Boolean(value),
    );

    const candidate = extractFirstTime(windowLines.join(" "), prayer);
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
      const candidate = extractFirstTime(match, prayer);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

function extractFirstTime(text: string, prayer?: PrayerField) {
  OCR_TIME_PATTERN.lastIndex = 0;
  OCR_TIME_WITHOUT_MINUTES_PATTERN.lastIndex = 0;

  const first = OCR_TIME_PATTERN.exec(text);
  if (first) {
    const hours = Number(first[1]);
    const minutes = Number(first[2]);
    const period = first[3]?.toLowerCase();

    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      return normalizeTime(hours, minutes, period, prayer);
    }
  }

  const fallback = OCR_TIME_WITHOUT_MINUTES_PATTERN.exec(text);
  if (fallback) {
    const hours = Number(fallback[1]);
    const period = fallback[2]?.toLowerCase();

    if (Number.isFinite(hours)) {
      return normalizeTime(hours, 0, period, prayer);
    }
  }

  return null;
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

function mergeSequentialFallback(extracted: ExtractedPrayerTimes, text: string) {
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

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
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
