export interface ExtractedPrayerTimes {
  fajr: string | null;
  zuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
  jumma: string | null;
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

  for (const prayer of Object.keys(PRAYER_ALIASES) as Array<keyof ExtractedPrayerTimes>) {
    const aliases = PRAYER_ALIASES[prayer];

    const directLineMatch = findTimeFromPrayerLines(lines, aliases);
    if (directLineMatch) {
      extracted[prayer] = directLineMatch;
      continue;
    }

    const nearbyMatch = findTimeNearAlias(normalizedText, aliases);
    if (nearbyMatch) {
      extracted[prayer] = nearbyMatch;
    }
  }

  return extracted;
}

function findTimeFromPrayerLines(lines: string[], aliases: string[]) {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!containsAlias(line, aliases)) {
      continue;
    }

    const windowLines = [lines[index - 1], lines[index], lines[index + 1]].filter(
      (value): value is string => Boolean(value),
    );

    const candidate = extractFirstTime(windowLines.join(" "));
    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function findTimeNearAlias(text: string, aliases: string[]) {
  for (const alias of aliases) {
    const escaped = escapeRegExp(alias);
    const nearbyPattern = new RegExp(`${escaped}[^\n\r]{0,40}`, "gi");
    const matches = text.match(nearbyPattern);
    if (!matches) {
      continue;
    }

    for (const match of matches) {
      const candidate = extractFirstTime(match);
      if (candidate) {
        return candidate;
      }
    }
  }

  return null;
}

function extractFirstTime(text: string) {
  OCR_TIME_PATTERN.lastIndex = 0;
  OCR_TIME_WITHOUT_MINUTES_PATTERN.lastIndex = 0;

  const first = OCR_TIME_PATTERN.exec(text);
  if (first) {
    const hours = Number(first[1]);
    const minutes = Number(first[2]);
    const period = first[3]?.toLowerCase();

    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      return normalizeTime(hours, minutes, period);
    }
  }

  const fallback = OCR_TIME_WITHOUT_MINUTES_PATTERN.exec(text);
  if (fallback) {
    const hours = Number(fallback[1]);
    const period = fallback[2]?.toLowerCase();

    if (Number.isFinite(hours)) {
      return normalizeTime(hours, 0, period);
    }
  }

  return null;
}

function normalizeTime(hours: number, minutes: number, period?: string) {
  let normalizedHours = hours;

  if (period === "pm" && normalizedHours < 12) {
    normalizedHours += 12;
  }

  if (period === "am" && normalizedHours === 12) {
    normalizedHours = 0;
  }

  if (normalizedHours < 0 || normalizedHours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
