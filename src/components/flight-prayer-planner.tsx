"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FLIGHT_AIRPORTS, FLIGHT_AIRPORT_CODES, getAirportByCode } from "@/lib/flight-airports";

const MAX_AIRPORT_SUGGESTIONS = 8;

const PRAYER_SLOTS = [
  { name: "Fajr", minutes: 5 * 60 + 15 },
  { name: "Zuhr", minutes: 13 * 60 + 15 },
  { name: "Asr", minutes: 17 * 60 },
  { name: "Maghrib", minutes: 18 * 60 + 45 },
  { name: "Isha", minutes: 20 * 60 + 15 },
] as const;

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface FlightPlanResult {
  departureLocalIso: string;
  arrivalLocalIso: string;
  departureUtcMs: number;
  arrivalUtcMs: number;
  durationHours: number;
  crossingTimezoneHours: number;
  likelyInFlightPrayers: string[];
}

interface FlightPrayerPlannerProps {
  initialDepartureCode?: string;
  initialArrivalCode?: string;
  initialDepartureDateTime?: string;
  initialDurationHoursText?: string;
  initialLayoverCode?: string;
  initialLayoverHoursText?: string;
}

type Tone = "green" | "amber" | "red";

interface InstantAction {
  title: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  tone: Tone;
}

interface TimelineStep {
  phase: string;
  title: string;
  detail: string;
  tone: Tone;
}

interface LayoverAdvice {
  summary: string;
  recommendation: string;
  gateBufferMinutes: number;
}

interface PrayerCountdown {
  prayerName: string;
  minutesLeft: number;
}

function formatAirportOptionLabel(code: string) {
  const airport = getAirportByCode(code);
  if (!airport) {
    return code;
  }

  return `${airport.code} - ${airport.city} (${airport.country})`;
}

function findAirportCodeByQuery(query: string): string | null {
  const value = query.trim();
  if (!value) {
    return null;
  }

  const upper = value.toUpperCase();
  if (FLIGHT_AIRPORT_CODES.includes(upper)) {
    return upper;
  }

  const fromPrefixed = FLIGHT_AIRPORTS.find((airport) =>
    upper.startsWith(`${airport.code} `) || upper === `${airport.code}-` || upper === `${airport.code} -`,
  );
  if (fromPrefixed) {
    return fromPrefixed.code;
  }

  const lower = value.toLowerCase();
  const fromCity = FLIGHT_AIRPORTS.find((airport) => airport.city.toLowerCase().includes(lower));
  if (fromCity) {
    return fromCity.code;
  }

  const fromCountry = FLIGHT_AIRPORTS.find((airport) => airport.country.toLowerCase().includes(lower));
  return fromCountry ? fromCountry.code : null;
}

function getAirportSuggestions(query: string, fallbackCode: string) {
  const value = query.trim().toLowerCase();
  if (!value) {
    return FLIGHT_AIRPORTS
      .filter((airport) => airport.code !== fallbackCode)
      .slice(0, MAX_AIRPORT_SUGGESTIONS)
      .map((airport) => airport.code);
  }

  return FLIGHT_AIRPORTS.filter((airport) => {
    const label = `${airport.code} ${airport.city} ${airport.country}`.toLowerCase();
    return label.includes(value);
  })
    .slice(0, MAX_AIRPORT_SUGGESTIONS)
    .map((airport) => airport.code);
}

function parseDateTimeLocalInput(value: string) {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) {
    return null;
  }

  const [yearText, monthText, dayText] = datePart.split("-");
  const [hourText, minuteText] = timePart.split(":");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if ([year, month, day, hour, minute].some((valuePart) => Number.isNaN(valuePart))) {
    return null;
  }

  return {
    year,
    month,
    day,
    hour,
    minute,
  };
}

function buildDefaultDepartureDateTime() {
  const date = new Date();
  date.setHours(date.getHours() + 4);
  date.setMinutes(0, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function sanitizeAirportCode(value: string | undefined, fallback: string) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) {
    return fallback;
  }

  return FLIGHT_AIRPORT_CODES.includes(normalized) ? normalized : fallback;
}

function toUtcMsFromLocal(dateTimeLocal: string, timezoneOffsetHours: number) {
  const parsed = parseDateTimeLocalInput(dateTimeLocal);
  if (!parsed) {
    return null;
  }

  const localAsUtcMs = Date.UTC(
    parsed.year,
    parsed.month - 1,
    parsed.day,
    parsed.hour,
    parsed.minute,
    0,
    0,
  );

  return localAsUtcMs - timezoneOffsetHours * HOUR_MS;
}

function formatLocalTimeFromUtc(utcMs: number, timezoneOffsetHours: number) {
  const localMs = utcMs + timezoneOffsetHours * HOUR_MS;
  const date = new Date(localMs);
  return date.toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function collectLikelyInFlightPrayers(
  departureUtcMs: number,
  arrivalUtcMs: number,
  departureOffset: number,
  arrivalOffset: number,
) {
  const result = new Set<string>();

  const collectFromTimezone = (offsetHours: number) => {
    const startLocalMs = departureUtcMs + offsetHours * HOUR_MS;
    const endLocalMs = arrivalUtcMs + offsetHours * HOUR_MS;
    const startDayUtc = Date.UTC(
      new Date(startLocalMs).getUTCFullYear(),
      new Date(startLocalMs).getUTCMonth(),
      new Date(startLocalMs).getUTCDate(),
      0,
      0,
      0,
      0,
    );
    const endDayUtc = Date.UTC(
      new Date(endLocalMs).getUTCFullYear(),
      new Date(endLocalMs).getUTCMonth(),
      new Date(endLocalMs).getUTCDate(),
      0,
      0,
      0,
      0,
    );

    for (let dayUtc = startDayUtc - DAY_MS; dayUtc <= endDayUtc + DAY_MS; dayUtc += DAY_MS) {
      for (const prayer of PRAYER_SLOTS) {
        const prayerLocalUtc = dayUtc + prayer.minutes * 60 * 1000;
        const prayerAbsoluteUtc = prayerLocalUtc - offsetHours * HOUR_MS;
        if (prayerAbsoluteUtc >= departureUtcMs && prayerAbsoluteUtc <= arrivalUtcMs) {
          result.add(prayer.name);
        }
      }
    }
  };

  collectFromTimezone(departureOffset);
  collectFromTimezone(arrivalOffset);

  return PRAYER_SLOTS.map((slot) => slot.name).filter((name) => result.has(name));
}

function buildFlightPlan(
  departureCode: string,
  arrivalCode: string,
  departureDateTimeLocal: string,
  durationHours: number,
): FlightPlanResult | null {
  const departureAirport = getAirportByCode(departureCode);
  const arrivalAirport = getAirportByCode(arrivalCode);

  if (!departureAirport || !arrivalAirport) {
    return null;
  }

  const departureUtcMs = toUtcMsFromLocal(
    departureDateTimeLocal,
    departureAirport.timezoneOffsetHours,
  );
  if (!departureUtcMs || Number.isNaN(durationHours) || durationHours <= 0) {
    return null;
  }

  const arrivalUtcMs = departureUtcMs + durationHours * HOUR_MS;
  const likelyInFlightPrayers = collectLikelyInFlightPrayers(
    departureUtcMs,
    arrivalUtcMs,
    departureAirport.timezoneOffsetHours,
    arrivalAirport.timezoneOffsetHours,
  );

  return {
    departureLocalIso: formatLocalTimeFromUtc(departureUtcMs, departureAirport.timezoneOffsetHours),
    arrivalLocalIso: formatLocalTimeFromUtc(arrivalUtcMs, arrivalAirport.timezoneOffsetHours),
    departureUtcMs,
    arrivalUtcMs,
    durationHours,
    crossingTimezoneHours:
      arrivalAirport.timezoneOffsetHours - departureAirport.timezoneOffsetHours,
    likelyInFlightPrayers,
  };
}

function getToneByMinutes(minutesUntil: number): Tone {
  if (minutesUntil <= 45) return "red";
  if (minutesUntil <= 120) return "amber";
  return "green";
}

function getToneClasses(tone: Tone) {
  if (tone === "green") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (tone === "amber") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-rose-200 bg-rose-50 text-rose-900";
}

function getLayoverAdvice(hours: number): LayoverAdvice {
  const minutes = Math.round(hours * 60);

  if (minutes < 60) {
    return {
      summary: "Short layover",
      recommendation: "Pray inside terminal prayer room only. Avoid leaving airport zone.",
      gateBufferMinutes: 25,
    };
  }

  if (minutes <= 180) {
    return {
      summary: "Medium layover",
      recommendation: "Terminal prayer room is best. Nearby masjid only if very close and transport is confirmed.",
      gateBufferMinutes: 45,
    };
  }

  return {
    summary: "Long layover",
    recommendation: "Nearby masjid visit is possible if traffic is predictable. Keep strong return margin.",
    gateBufferMinutes: 60,
  };
}

function buildInstantAction(
  hasLayover: boolean,
  layoverAirportCode: string,
  layoverAdvice: LayoverAdvice | null,
  plan: FlightPlanResult,
  departureCode: string,
  arrivalCode: string,
): InstantAction {
  const minutesToDeparture = Math.floor((plan.departureUtcMs - Date.now()) / 60000);

  if (hasLayover && layoverAdvice) {
    return {
      title: `Plan for layover at ${layoverAirportCode}`,
      detail: `${layoverAdvice.summary}: ${layoverAdvice.recommendation}`,
      ctaLabel: "Open layover airport page",
      ctaHref: `/flight/${layoverAirportCode.toLowerCase()}`,
      tone: "amber",
    };
  }

  if (minutesToDeparture <= 45) {
    return {
      title: `Pray now at departure airport (${departureCode})`,
      detail: "Boarding window is tight. Use terminal prayer space before gate call.",
      ctaLabel: "Open departure airport page",
      ctaHref: `/flight/${departureCode.toLowerCase()}`,
      tone: "red",
    };
  }

  if (plan.likelyInFlightPrayers.length > 0) {
    return {
      title: "In-flight prayer likely",
      detail: `Likely slot(s): ${plan.likelyInFlightPrayers.join(", ")}. Prepare before boarding.`,
      ctaLabel: "View journey timeline",
      ctaHref: "#journey-timeline",
      tone: getToneByMinutes(minutesToDeparture),
    };
  }

  return {
    title: `Pray after landing at ${arrivalCode}`,
    detail: "No primary in-flight slot detected. Plan terminal or nearby masjid after arrival.",
    ctaLabel: "Open arrival airport page",
    ctaHref: `/flight/${arrivalCode.toLowerCase()}`,
    tone: "green",
  };
}

function buildTimeline(
  plan: FlightPlanResult,
  departureCode: string,
  arrivalCode: string,
  hasLayover: boolean,
  layoverCode: string,
  layoverAdvice: LayoverAdvice | null,
): TimelineStep[] {
  const minutesToDeparture = Math.floor((plan.departureUtcMs - Date.now()) / 60000);
  const beforeTone = getToneByMinutes(minutesToDeparture);

  const steps: TimelineStep[] = [
    {
      phase: "Before boarding",
      title: `Offer namaz at ${departureCode} terminal prayer room`,
      detail:
        minutesToDeparture > 0
          ? `Time to departure: ${minutesToDeparture} min. Keep wudu + gate buffer in mind.`
          : "Departure time has passed. Recheck current flight time before acting.",
      tone: beforeTone,
    },
    {
      phase: "In flight",
      title:
        plan.likelyInFlightPrayers.length > 0
          ? `Likely prayer slot: ${plan.likelyInFlightPrayers.join(", ")}`
          : "No primary prayer slot likely in-flight",
      detail:
        plan.likelyInFlightPrayers.length > 0
          ? "If movement is limited, prepare intention and timing before takeoff."
          : "Use departure or arrival windows as your main plan.",
      tone: plan.likelyInFlightPrayers.length > 0 ? "amber" : "green",
    },
  ];

  if (hasLayover && layoverAdvice) {
    steps.push({
      phase: "Layover",
      title: `Layover strategy at ${layoverCode}`,
      detail: `${layoverAdvice.summary}. ${layoverAdvice.recommendation} Return to gate ${layoverAdvice.gateBufferMinutes} min early.`,
      tone: "amber",
    });
  }

  steps.push({
    phase: "After landing",
    title: `If needed, offer at ${arrivalCode} airport or nearby masjid`,
    detail: "Use terminal prayer space first when tight on onward travel.",
    tone: "green",
  });

  return steps;
}

function getNextPrayerCountdown(timezoneOffsetHours: number, nowMs: number): PrayerCountdown | null {
  const localMs = nowMs + timezoneOffsetHours * HOUR_MS;
  const localDate = new Date(localMs);
  const dayStartUtc = Date.UTC(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
    0,
    0,
    0,
    0,
  );

  for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
    for (const slot of PRAYER_SLOTS) {
      const localPrayerUtc = dayStartUtc + dayOffset * DAY_MS + slot.minutes * 60 * 1000;
      const absolutePrayerUtc = localPrayerUtc - timezoneOffsetHours * HOUR_MS;

      if (absolutePrayerUtc > nowMs) {
        return {
          prayerName: slot.name,
          minutesLeft: Math.max(1, Math.ceil((absolutePrayerUtc - nowMs) / 60000)),
        };
      }
    }
  }

  return null;
}

export function FlightPrayerPlanner({
  initialDepartureCode,
  initialArrivalCode,
  initialDepartureDateTime,
  initialDurationHoursText,
  initialLayoverCode,
  initialLayoverHoursText,
}: FlightPrayerPlannerProps) {
  const [departureCode, setDepartureCode] = useState(
    sanitizeAirportCode(initialDepartureCode, "BOM"),
  );
  const [departureInput, setDepartureInput] = useState(() =>
    formatAirportOptionLabel(sanitizeAirportCode(initialDepartureCode, "BOM")),
  );
  const [arrivalCode, setArrivalCode] = useState(
    sanitizeAirportCode(initialArrivalCode, "DXB"),
  );
  const [arrivalInput, setArrivalInput] = useState(() =>
    formatAirportOptionLabel(sanitizeAirportCode(initialArrivalCode, "DXB")),
  );
  const [departureDateTime, setDepartureDateTime] = useState(() => {
    if (initialDepartureDateTime && parseDateTimeLocalInput(initialDepartureDateTime)) {
      return initialDepartureDateTime;
    }

    return buildDefaultDepartureDateTime();
  });
  const [durationHoursText, setDurationHoursText] = useState(() => {
    if (!initialDurationHoursText) {
      return "4";
    }

    const value = Number(initialDurationHoursText);
    return Number.isFinite(value) && value > 0 ? initialDurationHoursText : "4";
  });
  const [hasLayover, setHasLayover] = useState(() => Boolean(initialLayoverCode));
  const [layoverCode, setLayoverCode] = useState(
    sanitizeAirportCode(initialLayoverCode, "DXB"),
  );
  const [layoverInput, setLayoverInput] = useState(() =>
    formatAirportOptionLabel(sanitizeAirportCode(initialLayoverCode, "DXB")),
  );
  const [layoverHoursText, setLayoverHoursText] = useState(() => {
    if (!initialLayoverHoursText) {
      return "2";
    }

    const value = Number(initialLayoverHoursText);
    return Number.isFinite(value) && value > 0 ? initialLayoverHoursText : "2";
  });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [activeAirportField, setActiveAirportField] = useState<"departure" | "arrival" | "layover" | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const durationHours = Number(durationHoursText);
  const plan = useMemo(
    () => buildFlightPlan(departureCode, arrivalCode, departureDateTime, durationHours),
    [departureCode, arrivalCode, departureDateTime, durationHours],
  );

  const departureAirport = getAirportByCode(departureCode);
  const arrivalAirport = getAirportByCode(arrivalCode);
  const layoverAirport = getAirportByCode(layoverCode);
  const layoverHours = Number(layoverHoursText);
  const layoverAdvice = hasLayover && Number.isFinite(layoverHours) && layoverHours > 0
    ? getLayoverAdvice(layoverHours)
    : null;
  const instantAction = plan
    ? buildInstantAction(
        hasLayover,
        layoverCode,
        layoverAdvice,
        plan,
        departureCode,
        arrivalCode,
      )
    : null;
  const timeline = plan
    ? buildTimeline(plan, departureCode, arrivalCode, hasLayover, layoverCode, layoverAdvice)
    : [];
  const nextDeparturePrayer = useMemo(() => {
    if (!departureAirport) {
      return null;
    }

    return getNextPrayerCountdown(departureAirport.timezoneOffsetHours, nowMs);
  }, [departureAirport, nowMs]);

  const departureSuggestions = useMemo(
    () => getAirportSuggestions(departureInput, departureCode),
    [departureInput, departureCode],
  );
  const arrivalSuggestions = useMemo(
    () => getAirportSuggestions(arrivalInput, arrivalCode),
    [arrivalInput, arrivalCode],
  );
  const layoverSuggestions = useMemo(
    () => getAirportSuggestions(layoverInput, layoverCode),
    [layoverInput, layoverCode],
  );

  function handleAirportInputChange(
    value: string,
    setInput: (next: string) => void,
    setCode: (next: string) => void,
  ) {
    setInput(value);
    const maybeCode = findAirportCodeByQuery(value);
    if (maybeCode) {
      setCode(maybeCode);
    }
  }

  function handleAirportInputBlur(
    value: string,
    currentCode: string,
    setInput: (next: string) => void,
    setCode: (next: string) => void,
  ) {
    const maybeCode = findAirportCodeByQuery(value);
    if (maybeCode) {
      setCode(maybeCode);
      setInput(formatAirportOptionLabel(maybeCode));
      return;
    }

    setInput(formatAirportOptionLabel(currentCode));
  }

  function applyAirportSelection(
    code: string,
    setInput: (next: string) => void,
    setCode: (next: string) => void,
    field: "departure" | "arrival" | "layover",
  ) {
    setCode(code);
    setInput(formatAirportOptionLabel(code));
    setActiveAirportField((current) => (current === field ? null : current));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <section className="rounded-[22px] border border-stone-200 bg-white p-4 shadow-[0_12px_36px_rgba(41,37,36,0.08)] sm:p-5">
        <h2 className="text-lg font-semibold text-stone-900">Plan your flight prayer journey</h2>
        <p className="mt-1 text-sm text-stone-600">
          Enter basic flight details to get airport prayer guidance and a simple in-flight namaz timeline.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-stone-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">From airport</span>
            <div className="relative">
              <input
                value={departureInput}
                onFocus={() => setActiveAirportField("departure")}
                onChange={(event) =>
                  handleAirportInputChange(event.target.value, setDepartureInput, setDepartureCode)
                }
                onBlur={(event) => {
                  window.setTimeout(() => {
                    setActiveAirportField((current) => (current === "departure" ? null : current));
                  }, 120);
                  handleAirportInputBlur(
                    event.target.value,
                    departureCode,
                    setDepartureInput,
                    setDepartureCode,
                  );
                }}
                placeholder="Type city or airport code"
                className="min-h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-stone-900 focus:border-orange-300 focus:outline-none"
              />
              {activeAirportField === "departure" && departureSuggestions.length > 0 ? (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                  {departureSuggestions.map((code) => (
                    <button
                      key={`departure-${code}`}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        applyAirportSelection(code, setDepartureInput, setDepartureCode, "departure");
                      }}
                      className="block w-full border-b border-stone-100 px-3 py-2 text-left text-sm text-stone-700 last:border-b-0 hover:bg-stone-50"
                    >
                      {formatAirportOptionLabel(code)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </label>

          <label className="text-sm text-stone-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">To airport</span>
            <div className="relative">
              <input
                value={arrivalInput}
                onFocus={() => setActiveAirportField("arrival")}
                onChange={(event) =>
                  handleAirportInputChange(event.target.value, setArrivalInput, setArrivalCode)
                }
                onBlur={(event) => {
                  window.setTimeout(() => {
                    setActiveAirportField((current) => (current === "arrival" ? null : current));
                  }, 120);
                  handleAirportInputBlur(
                    event.target.value,
                    arrivalCode,
                    setArrivalInput,
                    setArrivalCode,
                  );
                }}
                placeholder="Type city or airport code"
                className="min-h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-stone-900 focus:border-orange-300 focus:outline-none"
              />
              {activeAirportField === "arrival" && arrivalSuggestions.length > 0 ? (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                  {arrivalSuggestions.map((code) => (
                    <button
                      key={`arrival-${code}`}
                      type="button"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        applyAirportSelection(code, setArrivalInput, setArrivalCode, "arrival");
                      }}
                      className="block w-full border-b border-stone-100 px-3 py-2 text-left text-sm text-stone-700 last:border-b-0 hover:bg-stone-50"
                    >
                      {formatAirportOptionLabel(code)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </label>

          <label className="text-sm text-stone-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Departure local time</span>
            <input
              type="datetime-local"
              value={departureDateTime}
              onChange={(event) => setDepartureDateTime(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-stone-900 focus:border-orange-300 focus:outline-none"
            />
          </label>

          <label className="text-sm text-stone-700">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Flight hours</span>
            <input
              type="number"
              inputMode="decimal"
              min="0.5"
              step="0.5"
              value={durationHoursText}
              onChange={(event) => setDurationHoursText(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-stone-300 bg-stone-50 px-3 text-stone-900 focus:border-orange-300 focus:outline-none"
            />
          </label>
        </div>

        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-800">
            <input
              type="checkbox"
              checked={hasLayover}
              onChange={(event) => setHasLayover(event.target.checked)}
              className="h-4 w-4 rounded border-stone-300"
            />
            I have a layover
          </label>

          {hasLayover ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-stone-700">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Layover airport</span>
                <div className="relative">
                  <input
                    value={layoverInput}
                    onFocus={() => setActiveAirportField("layover")}
                    onChange={(event) =>
                      handleAirportInputChange(event.target.value, setLayoverInput, setLayoverCode)
                    }
                    onBlur={(event) => {
                      window.setTimeout(() => {
                        setActiveAirportField((current) => (current === "layover" ? null : current));
                      }, 120);
                      handleAirportInputBlur(
                        event.target.value,
                        layoverCode,
                        setLayoverInput,
                        setLayoverCode,
                      );
                    }}
                    placeholder="Type city or airport code"
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-stone-900 focus:border-orange-300 focus:outline-none"
                  />
                  {activeAirportField === "layover" && layoverSuggestions.length > 0 ? (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg">
                      {layoverSuggestions.map((code) => (
                        <button
                          key={`layover-${code}`}
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            applyAirportSelection(code, setLayoverInput, setLayoverCode, "layover");
                          }}
                          className="block w-full border-b border-stone-100 px-3 py-2 text-left text-sm text-stone-700 last:border-b-0 hover:bg-stone-50"
                        >
                          {formatAirportOptionLabel(code)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>

              <label className="text-sm text-stone-700">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Layover hours</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.5"
                  step="0.5"
                  value={layoverHoursText}
                  onChange={(event) => setLayoverHoursText(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-stone-900 focus:border-orange-300 focus:outline-none"
                />
              </label>
            </div>
          ) : null}
        </div>

        <p className="mt-3 text-xs text-stone-500">
          Tip: you can bookmark this page after selecting airports to quickly reuse your plan.
        </p>

      </section>

      {plan ? (
        <>
          {instantAction ? (
            <section className={`rounded-[20px] border p-4 ${getToneClasses(instantAction.tone)}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Where to pray next</p>
              <h3 className="mt-1 text-lg font-semibold">{instantAction.title}</h3>
              <p className="mt-1 text-sm opacity-90">{instantAction.detail}</p>
              {nextDeparturePrayer ? (
                <p className="mt-2 text-sm font-semibold opacity-90">
                  Next local prayer near departure: {nextDeparturePrayer.prayerName} in {nextDeparturePrayer.minutesLeft} min
                </p>
              ) : null}
              <Link
                href={instantAction.ctaHref}
                className="mt-3 inline-flex min-h-10 items-center rounded-full bg-stone-950 px-4 text-sm font-semibold !text-white no-underline visited:!text-white hover:bg-black"
              >
                {instantAction.ctaLabel}
              </Link>
            </section>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[18px] border border-stone-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Departure</p>
              <p className="mt-2 text-base font-semibold text-stone-900">{departureAirport?.city} ({departureCode})</p>
              <p className="mt-1 text-sm text-stone-600">{plan.departureLocalIso}</p>
            </div>
            <div className="rounded-[18px] border border-stone-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Arrival</p>
              <p className="mt-2 text-base font-semibold text-stone-900">{arrivalAirport?.city} ({arrivalCode})</p>
              <p className="mt-1 text-sm text-stone-600">{plan.arrivalLocalIso}</p>
            </div>
            <div className="rounded-[18px] border border-stone-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Time shift</p>
              <p className="mt-2 text-base font-semibold text-stone-900">
                {plan.crossingTimezoneHours >= 0 ? "+" : ""}
                {plan.crossingTimezoneHours} hrs
              </p>
              <p className="mt-1 text-sm text-stone-600">Flight duration: {plan.durationHours.toFixed(1)} hrs</p>
            </div>
          </section>

          <section id="journey-timeline" className="rounded-[22px] border border-stone-200 bg-white p-4 sm:p-5">
            <h3 className="text-base font-semibold text-stone-900">Journey prayer timeline</h3>
            <p className="mt-1 text-sm text-stone-600">
              Follow this sequence to quickly decide where to offer namaz during travel.
            </p>

            <div className="mt-3 space-y-3">
              {timeline.map((step) => (
                <article key={step.phase} className={`rounded-xl border p-3 ${getToneClasses(step.tone)}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em]">{step.phase}</p>
                  <p className="mt-1 text-sm font-semibold">{step.title}</p>
                  <p className="mt-1 text-sm opacity-90">{step.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[22px] border border-stone-200 bg-white p-4 sm:p-5">
            <h3 className="text-base font-semibold text-stone-900">Likely in-flight prayer windows</h3>
            <p className="mt-1 text-sm text-stone-600">
              Based on departure and arrival timezone windows. Confirm exact times with your preferred prayer app.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {plan.likelyInFlightPrayers.length > 0 ? (
                plan.likelyInFlightPrayers.map((prayer) => (
                  <span
                    key={prayer}
                    className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-800"
                  >
                    {prayer}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  No primary prayer slot likely during flight window
                </span>
              )}
            </div>
          </section>

          <section className="rounded-[22px] border border-stone-200 bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_60%)] p-3 shadow-[0_12px_36px_rgba(41,37,36,0.08)] sm:p-4">
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
              Airport Prayer Guidance
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <article className="rounded-[18px] border border-orange-200 bg-white p-4 shadow-[0_8px_24px_rgba(249,115,22,0.10)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">At departure airport</p>
                <div className="mt-2 h-1 w-12 rounded-full bg-orange-400" />
              <h4 className="mt-2 text-base font-semibold text-stone-900">
                {departureAirport?.city} ({departureAirport?.code})
              </h4>
              <p className="mt-2 text-sm text-stone-700">{departureAirport?.prayerSpace}</p>
              <p className="mt-2 text-sm text-stone-600">Nearest masjid: {departureAirport?.nearestMasjid}</p>
              <p className="text-sm text-stone-600">Travel time: {departureAirport?.nearestMasjidTravel}</p>
              <Link
                href={`/flight/${departureCode.toLowerCase()}`}
                className="mt-3 inline-flex min-h-10 items-center rounded-full border border-orange-300 bg-orange-50 px-4 text-sm font-semibold text-orange-800 transition hover:bg-orange-100"
              >
                Airport prayer page
              </Link>
              </article>

              <article className="rounded-[18px] border border-emerald-200 bg-white p-4 shadow-[0_8px_24px_rgba(16,185,129,0.10)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">At arrival airport</p>
                <div className="mt-2 h-1 w-12 rounded-full bg-emerald-400" />
              <h4 className="mt-2 text-base font-semibold text-stone-900">
                {arrivalAirport?.city} ({arrivalAirport?.code})
              </h4>
              <p className="mt-2 text-sm text-stone-700">{arrivalAirport?.prayerSpace}</p>
              <p className="mt-2 text-sm text-stone-600">Nearest masjid: {arrivalAirport?.nearestMasjid}</p>
              <p className="text-sm text-stone-600">Travel time: {arrivalAirport?.nearestMasjidTravel}</p>
              <Link
                href={`/flight/${arrivalCode.toLowerCase()}`}
                className="mt-3 inline-flex min-h-10 items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Airport prayer page
              </Link>
              </article>
            </div>
          </section>

          {hasLayover && layoverAirport && layoverAdvice ? (
            <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 sm:p-5">
              <h3 className="text-base font-semibold text-amber-900">Layover recommendation</h3>
              <p className="mt-1 text-sm text-amber-900">
                {layoverAirport.city} ({layoverAirport.code}) - {layoverAdvice.summary}
              </p>
              <p className="mt-2 text-sm text-amber-800">{layoverAdvice.recommendation}</p>
              <p className="mt-1 text-sm text-amber-800">
                Recommended gate return buffer: {layoverAdvice.gateBufferMinutes} minutes.
              </p>
              <Link
                href={`/flight/${layoverAirport.code.toLowerCase()}`}
                className="mt-3 inline-flex text-sm font-semibold text-amber-900 underline-offset-2 hover:underline"
              >
                Open layover airport guide
              </Link>
            </section>
          ) : null}

          <section className="rounded-[22px] border border-stone-200 bg-white p-4 sm:p-5">
            <h3 className="text-base font-semibold text-stone-900">Quick travel checklist</h3>
            <ul className="mt-2 space-y-2 text-sm text-stone-700">
              <li>1. Plan one prayer before boarding if gate pressure is high.</li>
              <li>2. Keep wudu-friendly essentials and a compact prayer mat ready.</li>
              <li>3. Use airport prayer room first when available; avoid last-minute rush.</li>
              <li>4. For long flights, mark likely prayer windows and pray as feasible.</li>
              <li>5. After landing, use local masjid guidance near airport or hotel route.</li>
              <li>6. Times are estimates. Verify with local apps, airport signage, and gate updates.</li>
            </ul>
          </section>
        </>
      ) : (
        <section className="rounded-[20px] border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
          Enter valid flight details to generate a prayer-friendly timeline.
        </section>
      )}
    </div>
  );
}
