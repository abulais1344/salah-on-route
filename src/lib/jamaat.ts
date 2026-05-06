import {
  DAILY_PRAYERS,
  type DailyPrayerName,
  type JamaatStatus,
  type NextJamaatInfo,
  type PrayerTimes,
} from "@/types/mosque";

export function getNextJamaat(prayers: PrayerTimes, now = new Date()): NextJamaatInfo {
  if (!hasCompleteJamaatData(prayers)) {
    return {
      prayer: "fajr",
      time24h: "00:00",
      displayTime: "--",
      relativeText: "No jamaat data yet",
      urgencyLabel: "",
      minutesLeft: 0,
      status: "Missed",
      isTomorrow: false,
    };
  }

  const todayPrayers = DAILY_PRAYERS.map((prayer) => ({
    prayer,
    time24h: prayers[prayer] as string,
    date: getDateForTime(prayers[prayer] as string, now),
  }));

  const justStarted =
    [...todayPrayers]
      .reverse()
      .find((entry) => now.getTime() >= entry.date.getTime()) ?? null;

  if (justStarted) {
    const elapsedMinutes = Math.floor((now.getTime() - justStarted.date.getTime()) / 60000);
    if (elapsedMinutes <= 45) {
      return {
        prayer: justStarted.prayer,
        time24h: justStarted.time24h,
        displayTime: formatDisplayTime(justStarted.time24h),
        relativeText: `started ${formatDuration(elapsedMinutes)} ago`,
        urgencyLabel: "Missed",
        minutesLeft: -elapsedMinutes,
        status: "Missed",
        isTomorrow: false,
      };
    }
  }

  const upcoming = todayPrayers.find((entry) => entry.date.getTime() > now.getTime());
  if (upcoming) {
    const remainingMinutes = Math.max(
      1,
      Math.ceil((upcoming.date.getTime() - now.getTime()) / 60000),
    );
    const status = getUrgencyStatus(remainingMinutes);

    return {
      prayer: upcoming.prayer,
      time24h: upcoming.time24h,
      displayTime: formatDisplayTime(upcoming.time24h),
      relativeText: remainingMinutes < 1 ? "Now" : `in ${formatDuration(remainingMinutes)}`,
      urgencyLabel: getUrgencyLabel(remainingMinutes),
      minutesLeft: remainingMinutes,
      status,
      isTomorrow: false,
    };
  }

  const fajrTomorrow = getDateForTime(prayers.fajr as string, now);
  fajrTomorrow.setDate(fajrTomorrow.getDate() + 1);
  const untilTomorrowMinutes = Math.max(
    1,
    Math.ceil((fajrTomorrow.getTime() - now.getTime()) / 60000),
  );

  return {
    prayer: "fajr",
    time24h: prayers.fajr as string,
    displayTime: formatDisplayTime(prayers.fajr as string),
    relativeText: `in ${formatDuration(untilTomorrowMinutes)}`,
    urgencyLabel: "Tomorrow",
    minutesLeft: untilTomorrowMinutes,
    status: "Upcoming",
    isTomorrow: true,
  };
}

export function formatDisplayTime(time24h: string) {
  const [hoursText = "0", minutesText = "0"] = time24h.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const period = hours >= 12 ? "PM" : "AM";
  const normalizedHours = hours % 12 || 12;

  return `${normalizedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

export function formatPrayerLabel(prayer: DailyPrayerName) {
  return prayer.charAt(0).toUpperCase() + prayer.slice(1);
}

export function getUpdatedAgo(lastUpdated: string, now = new Date()) {
  const diffMs = now.getTime() - new Date(lastUpdated).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 48) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function isVerified(lastUpdated: string) {
  const ageMs = Date.now() - new Date(lastUpdated).getTime();
  return ageMs <= 1000 * 60 * 60 * 24 * 5;
}

export function getUrgencyLabel(minutesLeft: number): string {
  if (minutesLeft < 5) return "Very tight";
  if (minutesLeft <= 10) return "Hurry";
  if (minutesLeft <= 20) return "Safe";
  return "Plenty of time";
}

function getUrgencyStatus(minutesLeft: number): JamaatStatus {
  if (minutesLeft < 5) return "Risky";
  if (minutesLeft <= 10) return "Hurry";
  return "Upcoming";
}

export function getStatusTone(status: JamaatStatus) {
  if (status === "Upcoming") return "bg-emerald-100 text-emerald-800";
  if (status === "Hurry") return "bg-amber-100 text-amber-800";
  if (status === "Risky") return "bg-rose-100 text-rose-700";
  return "bg-rose-100 text-rose-700";
}

function getDateForTime(time24h: string, now: Date) {
  const [hoursText = "0", minutesText = "0"] = time24h.split(":");
  const candidate = new Date(now);
  candidate.setHours(Number(hoursText), Number(minutesText), 0, 0);
  return candidate;
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 1) return "Now";
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function hasCompleteJamaatData(prayers: PrayerTimes) {
  return DAILY_PRAYERS.every((prayer) => {
    const value = prayers[prayer];
    return typeof value === "string" && value.trim().length > 0;
  });
}
