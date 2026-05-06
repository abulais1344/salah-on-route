"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { GoogleMap } from "@/components/google-map";
import { buildJourneyPrayerPlan, type JourneyPrayerStop } from "@/lib/journey-plan";
import { MosqueCard } from "@/components/mosque-card";
import type { GeoPoint } from "@/lib/geo";
import { loadGoogleMaps } from "@/lib/google-maps";
import { formatPrayerLabel } from "@/lib/jamaat";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import type { MosqueView } from "@/types/mosque";

type Mode = "nearby" | "route";
type NearbySource = "featured" | "current";

interface MosqueApiResponse {
  mosques: MosqueView[];
}

interface PlaceSuggestion {
  placeId: string;
  description: string;
}

const AUTOCOMPLETE_MIN_CHARS = 4;
const AUTOCOMPLETE_DEBOUNCE_MS = 450;

export function HomeShell() {
  const router = useRouter();
  const [heroLanguage, setHeroLanguage] = useState<"en" | "ur" | "mr">("en");
  const [mode, setMode] = useState<Mode>("nearby");
  const [currentLocation, setCurrentLocation] = useState<GeoPoint | null>(null);
  const [nearbyMosques, setNearbyMosques] = useState<MosqueView[]>([]);
  const [routeMosques, setRouteMosques] = useState<MosqueView[]>([]);
  const [routePath, setRoutePath] = useState<GeoPoint[]>([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [departAt, setDepartAt] = useState(() => formatLocalDateTimeInput(new Date()));
  const [routeStatus, setRouteStatus] = useState(
    "Enter a source and destination to see mosques within 3 km of the route.",
  );
  const [nearbyNotice, setNearbyNotice] = useState<string | null>(null);
  const [nearbySource, setNearbySource] = useState<NearbySource>("featured");
  const [nearbyAreaLabel, setNearbyAreaLabel] = useState("your area");
  const [journeyPlan, setJourneyPlan] = useState<JourneyPrayerStop[]>([]);
  const [isNearbyLoading, setIsNearbyLoading] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [creatingMosqueId, setCreatingMosqueId] = useState<string | null>(null);
  const [sourceSuggestions, setSourceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<PlaceSuggestion[]>([]);
  const [activeSuggestionField, setActiveSuggestionField] = useState<"source" | "destination" | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const areaLabelCacheRef = useRef(new Map<string, string>());

  function getAutocompleteSessionToken() {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }

    return sessionTokenRef.current;
  }

  function resetAutocompleteSession() {
    sessionTokenRef.current = null;
  }

  const fetchPlaceSuggestions = useCallback(async (field: "source" | "destination", query: string) => {
    try {
      await loadGoogleMaps();

      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      }

      const service = autocompleteServiceRef.current;
      if (!service) {
        return;
      }

      const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>(
        (resolve) => {
          service.getPlacePredictions(
            {
              input: query,
              componentRestrictions: { country: "in" },
              region: "in",
              sessionToken: getAutocompleteSessionToken(),
            },
            (results, status) => {
              if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
                resolve([]);
                return;
              }

              resolve(results.slice(0, 5));
            },
          );
        },
      );

      const mapped = predictions.map((item) => ({
        placeId: item.place_id,
        description: item.description,
      }));

      if (field === "source") {
        setSourceSuggestions(mapped);
      } else {
        setDestinationSuggestions(mapped);
      }

      setActiveSuggestionField(mapped.length > 0 ? field : null);
    } catch {
      if (field === "source") {
        setSourceSuggestions([]);
      } else {
        setDestinationSuggestions([]);
      }
    }
  }, []);

  useEffect(() => {
    void loadFeaturedMosques();
  }, []);

  const visibleMosques = useMemo(
    () => (mode === "nearby" ? nearbyMosques : routeMosques),
    [mode, nearbyMosques, routeMosques],
  );

  const nearbyHeading =
    nearbySource === "current" ? `Nearby masjids in ${nearbyAreaLabel}` : "Added masjids";
  const nearbySubtext =
    nearbySource === "current"
      ? "Prioritized by distance and next jamaat timing around your current area."
      : "Browse masjids already added to the app, or turn on location for nearest results.";
  const hasNoAddedMasjids = nearbySource === "featured" && !isNearbyLoading && nearbyMosques.length === 0;
  const nearbyStatusLabel =
    nearbyNotice ||
    (nearbySource === "current"
      ? `${nearbyMosques.length} near ${nearbyAreaLabel}`
      : `${nearbyMosques.length} added masjids`);

  useEffect(() => {
    if (mode !== "route") {
      return;
    }

    const query = source.trim();
    if (query.length < AUTOCOMPLETE_MIN_CHARS) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchPlaceSuggestions("source", query);
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [source, mode, fetchPlaceSuggestions]);

  useEffect(() => {
    if (mode !== "route") {
      return;
    }

    const query = destination.trim();
    if (query.length < AUTOCOMPLETE_MIN_CHARS) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchPlaceSuggestions("destination", query);
    }, AUTOCOMPLETE_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [destination, mode, fetchPlaceSuggestions]);

  async function loadNearbyMosques(location: GeoPoint, source: NearbySource) {
    setIsNearbyLoading(true);
    setNearbyNotice(null);
    setCurrentLocation(location);
    setNearbySource(source);

    const fallbackLabel = source === "current" ? "your area" : "added masjids";
    const areaLabelPromise =
      source === "current"
        ? resolveAreaLabel(location)
        : Promise.resolve(fallbackLabel);

    try {
      const [response, resolvedAreaLabel] = await Promise.all([
        fetch(`/api/mosques?lat=${location.latitude}&lng=${location.longitude}&radiusKm=8`),
        areaLabelPromise,
      ]);
      const data = (await response.json()) as MosqueApiResponse;
      setNearbyMosques(data.mosques);
      setNearbyAreaLabel(resolvedAreaLabel);
    } catch {
      setNearbyMosques([]);
      setNearbyNotice("Unable to load nearby masjids right now.");
    } finally {
      setIsNearbyLoading(false);
    }
  }

  async function loadFeaturedMosques() {
    setIsNearbyLoading(true);
    setNearbyNotice(null);
    setCurrentLocation(null);
    setNearbySource("featured");
    setNearbyAreaLabel("your area");

    try {
      const response = await fetch("/api/mosques?radiusKm=8");
      const data = (await response.json()) as MosqueApiResponse;
      setNearbyMosques(data.mosques);
    } catch {
      setNearbyMosques([]);
      setNearbyNotice("Unable to load added masjids right now.");
    } finally {
      setIsNearbyLoading(false);
    }
  }

  async function handleRouteSearch() {
    if (!source.trim() || !destination.trim()) {
      setRouteStatus("Enter both start location and destination.");
      return;
    }

    const departureDate = new Date(departAt);

    if (Number.isNaN(departureDate.getTime())) {
      setRouteStatus("Set a valid journey start date and time.");
      return;
    }

    setMode("route");
    resetAutocompleteSession();
    setIsRouteLoading(true);
    setRouteStatus("Calculating route and checking mosques near the path...");
    setJourneyPlan([]);

    try {
      await loadGoogleMaps();
      const directionsService = new google.maps.DirectionsService();
      const directions = await directionsService.route({
        origin: source,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      const overviewPath = directions.routes[0]?.overview_path ?? [];
      const points = overviewPath.map((point) => ({
        latitude: point.lat(),
        longitude: point.lng(),
      }));

      const routeResponse = await fetch("/api/route-mosques", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ routePath: points }),
      });

      const routePayload = (await routeResponse.json()) as {
        mosques?: MosqueView[];
        error?: string;
      };

      if (!routeResponse.ok) {
        throw new Error(routePayload.error || "Unable to discover route mosques.");
      }

      const data = {
        mosques: routePayload.mosques || [],
      } as MosqueApiResponse;
      const matches = data.mosques;
      const totalDurationSeconds = directions.routes[0]?.legs?.[0]?.duration?.value;
      const plan = buildJourneyPrayerPlan({
        mosques: matches,
        routePath: points,
        departureAt: departureDate,
        routeDurationSeconds: totalDurationSeconds,
      });

      startTransition(() => {
        setRoutePath(points);
        setRouteMosques(matches);
        setJourneyPlan(plan);
      });

      setRouteStatus(
        matches.length > 0
          ? `Found ${matches.length} mosques near your route.`
          : "No mosques found within 3 km of this route.",
      );
    } catch (error) {
      setRouteStatus(
        error instanceof Error
          ? error.message
          : "Route discovery is not available right now.",
      );
      setJourneyPlan([]);
    } finally {
      setIsRouteLoading(false);
    }
  }

  function selectSuggestion(field: "source" | "destination", suggestion: PlaceSuggestion) {
    if (field === "source") {
      setSource(suggestion.description);
      setSourceSuggestions([]);
    } else {
      setDestination(suggestion.description);
      setDestinationSuggestions([]);
    }

    setActiveSuggestionField(null);
    resetAutocompleteSession();
  }

  async function handleUseCurrentLocation() {
    if (currentLocation && nearbySource === "current") {
      await loadNearbyMosques(currentLocation, "current");
      return;
    }

    if (!("geolocation" in navigator)) {
      await loadFeaturedMosques();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        void loadNearbyMosques(location, "current");
      },
      () => {
        void loadFeaturedMosques();
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function resolveAreaLabel(location: GeoPoint) {
    const cacheKey = `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`;
    const cached = areaLabelCacheRef.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      await loadGoogleMaps();

      if (!geocoderRef.current) {
        geocoderRef.current = new google.maps.Geocoder();
      }

      const label = await new Promise<string>((resolve) => {
        geocoderRef.current?.geocode(
          {
            location: {
              lat: location.latitude,
              lng: location.longitude,
            },
          },
          (results, statusCode) => {
            if (statusCode !== "OK" || !results || results.length === 0) {
              resolve("your area");
              return;
            }

            resolve(getAreaLabel(results));
          },
        );
      });

      areaLabelCacheRef.current.set(cacheKey, label);
      return label;
    } catch {
      return "your area";
    }
  }

  async function handleAddTimings(mosque: MosqueView, sourceMode: Mode) {
    if (!mosque.placeId) {
      return;
    }

    setCreatingMosqueId(mosque.id);
    if (sourceMode === "route") {
      setRouteStatus("Creating mosque entry and opening update form...");
    } else {
      setNearbyNotice("Creating mosque entry and opening update form...");
    }

    try {
      const response = await fetch("/api/mosques/create-from-place", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId: mosque.placeId,
          name: mosque.name,
          latitude: mosque.latitude,
          longitude: mosque.longitude,
          address: mosque.address,
          distanceFromRouteKm: mosque.distanceFromRouteKm,
        }),
      });

      const payload = (await response.json()) as { redirectTo?: string; error?: string };
      if (!response.ok || !payload.redirectTo) {
        throw new Error(payload.error || "Unable to create mosque right now.");
      }

      router.push(payload.redirectTo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create mosque.";
      if (sourceMode === "route") {
        setRouteStatus(message);
      } else {
        setNearbyNotice(message);
      }
    } finally {
      setCreatingMosqueId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[32px] border border-amber-200/30 bg-[radial-gradient(circle_at_12%_18%,_rgba(251,146,60,0.34),_transparent_34%),radial-gradient(circle_at_85%_20%,_rgba(252,211,77,0.16),_transparent_40%),linear-gradient(130deg,#111827_0%,#1f2937_48%,#312e81_100%)] px-5 py-8 text-white shadow-[0_24px_100px_rgba(15,23,42,0.34)] sm:px-8 sm:py-10">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-orange-300/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 left-12 h-56 w-56 rounded-full bg-amber-200/10 blur-3xl" aria-hidden />

        <div className="relative grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-100/90">
                Namaz Route • India
              </p>
              <div className="inline-flex rounded-full border border-white/30 bg-white/10 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setHeroLanguage("en")}
                  className={`rounded-full px-3 py-1 transition ${
                    heroLanguage === "en" ? "bg-white text-slate-900" : "text-orange-100 hover:bg-white/10"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setHeroLanguage("ur")}
                  className={`font-urdu rounded-full px-3 py-1 transition ${
                    heroLanguage === "ur" ? "bg-white text-slate-900" : "text-orange-100 hover:bg-white/10"
                  }`}
                >
                  اردو
                </button>
                <button
                  type="button"
                  onClick={() => setHeroLanguage("mr")}
                  className={`rounded-full px-3 py-1 transition ${
                    heroLanguage === "mr" ? "bg-white text-slate-900" : "text-orange-100 hover:bg-white/10"
                  }`}
                >
                  मराठी
                </button>
              </div>
            </div>

            {heroLanguage === "ur" ? (
              <>
                <h1 className="font-urdu mt-2 text-3xl leading-relaxed font-semibold text-orange-50 sm:text-5xl sm:leading-relaxed">
                  سفر میں ہیں؟ اگلی جماعت مت چھوڑیں۔
                </h1>
                <p className="font-urdu mt-3 max-w-2xl text-base leading-8 text-orange-100/95 sm:text-lg">
                  قریب کی مسجد تلاش کریں، تازہ اوقات دیکھیں، اور ایک ٹیپ میں راستہ پائیں۔
                </p>
              </>
            ) : heroLanguage === "mr" ? (
              <>
                <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-orange-50 sm:text-5xl">
                  प्रवासात आहात? पुढची जमाअत चुकवू नका.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100 sm:text-base">
                  जवळच्या मस्जिद शोधा, नवीन वेळा पाहा, आणि एका टॅपमध्ये मार्गदर्शन मिळवा.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-orange-50 sm:text-5xl">
                  Travelling? Don&apos;t miss your next jamaat.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-100 sm:text-base">
                  Discover nearby masjids, check latest timings, and navigate in one tap.
                </p>
              </>
            )}
          </div>

          <div className="grid gap-2.5 rounded-[24px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-100">
              {heroLanguage === "ur" ? "یہ کیوں بہتر ہے" : heroLanguage === "mr" ? "हे कसे मदत करते" : "Why it helps"}
            </p>
            <p className={`text-sm font-medium text-white ${heroLanguage === "ur" ? "font-urdu" : ""}`}>
              {heroLanguage === "ur"
                ? "کمیونٹی سے اپڈیٹ • روٹ آویئر • بھارت کے لیے بنایا گیا"
                : heroLanguage === "mr"
                  ? "समुदाय-अपडेटेड • मार्ग-जाणकार • भारतासाठी तयार"
                  : "Community-updated • Route-aware • Made for India"}
            </p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold">
              <span className={`rounded-full bg-white/15 px-3 py-1 text-orange-100 ${heroLanguage === "ur" ? "font-urdu" : ""}`}>
                {heroLanguage === "ur" ? "راستہ ذہین" : heroLanguage === "mr" ? "मार्ग-जाणकार" : "Route aware"}
              </span>
              <span className={`rounded-full bg-white/15 px-3 py-1 text-orange-100 ${heroLanguage === "ur" ? "font-urdu" : ""}`}>
                {heroLanguage === "ur" ? "اردو دوستانہ" : heroLanguage === "mr" ? "मराठी अनुकूल" : "Urdu friendly"}
              </span>
              <span className={`rounded-full bg-white/15 px-3 py-1 text-orange-100 ${heroLanguage === "ur" ? "font-urdu" : ""}`}>
                {heroLanguage === "ur" ? "ہندوستان کیلئے" : heroLanguage === "mr" ? "भारतासाठी तयार" : "India ready"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-2 z-20 rounded-[24px] border border-stone-200 bg-white/95 p-3 shadow-[0_12px_40px_rgba(41,37,36,0.08)] backdrop-blur">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("nearby");
                setActiveSuggestionField(null);
              }}
              className={`min-h-11 rounded-[16px] px-4 text-sm font-semibold transition ${
                mode === "nearby"
                  ? "bg-orange-500 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Nearby
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("route");
                setActiveSuggestionField(null);
              }}
              className={`min-h-11 rounded-[16px] px-4 text-sm font-semibold transition ${
                mode === "route"
                  ? "bg-orange-500 text-white"
                  : "bg-stone-100 text-stone-700 hover:bg-stone-200"
              }`}
            >
              Route
            </button>
          </div>

          {mode === "nearby" ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-stone-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-stone-700">{nearbyStatusLabel}</p>
                <p className="mt-1 text-xs text-stone-500">
                  {nearbySource === "current"
                    ? `Location pin: ${nearbyAreaLabel}`
                    : hasNoAddedMasjids
                      ? "No added masjids yet. Turn on location to discover nearby ones."
                      : "Allow location to find nearest masjids around your city, village, or taluka."}
                </p>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[320px] sm:max-w-md">
                {nearbySource !== "current" ? (
                  <p className="mb-1 px-1 text-[11px] text-stone-500">
                    We ask location only to find nearby masjids. You can continue with browse mode anytime.
                  </p>
                ) : null}
                <div className="grid w-full grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleUseCurrentLocation()}
                    className={`min-h-11 rounded-full border px-3 text-sm font-semibold shadow-sm transition ${
                      nearbySource === "current"
                        ? "border-orange-300 bg-orange-500 text-white hover:bg-orange-600"
                        : "border-stone-200 bg-white text-stone-800 hover:bg-orange-50"
                    }`}
                  >
                    Show nearby masjids
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (nearbySource !== "featured") void loadFeaturedMosques();
                    }}
                    disabled={hasNoAddedMasjids}
                    className={`min-h-11 rounded-full border px-3 text-sm font-semibold shadow-sm transition ${
                      hasNoAddedMasjids
                        ? "border-stone-200 bg-stone-100 text-stone-400"
                        : nearbySource === "featured"
                          ? "border-orange-300 bg-orange-500 text-white hover:bg-orange-600"
                          : "border-stone-200 bg-white text-stone-800 hover:bg-orange-50"
                    }`}
                  >
                    Browse added masjids
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.95fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                void handleRouteSearch();
              }}
            >
              <div className="relative">
                <input
                  value={source}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSource(value);
                    if (value.trim().length < AUTOCOMPLETE_MIN_CHARS) {
                      setActiveSuggestionField((current) =>
                        current === "source" ? null : current,
                      );
                    }
                  }}
                  onFocus={() => {
                    if (sourceSuggestions.length > 0) {
                      setActiveSuggestionField("source");
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setActiveSuggestionField((current) =>
                        current === "source" ? null : current,
                      );
                    }, 120);
                  }}
                  placeholder="Choose starting point"
                  className="min-h-11 w-full rounded-[14px] border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 placeholder:text-stone-500 focus:border-orange-400 focus:outline-none"
                />
                {activeSuggestionField === "source" && sourceSuggestions.length > 0 ? (
                  <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-[0_12px_30px_rgba(41,37,36,0.15)]">
                    {sourceSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectSuggestion("source", suggestion);
                        }}
                        className="block w-full border-b border-stone-100 px-3 py-2 text-left text-sm text-stone-700 last:border-b-0 hover:bg-orange-50"
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <input
                  value={destination}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDestination(value);
                    if (value.trim().length < AUTOCOMPLETE_MIN_CHARS) {
                      setActiveSuggestionField((current) =>
                        current === "destination" ? null : current,
                      );
                    }
                  }}
                  onFocus={() => {
                    if (destinationSuggestions.length > 0) {
                      setActiveSuggestionField("destination");
                    }
                  }}
                  onBlur={() => {
                    window.setTimeout(() => {
                      setActiveSuggestionField((current) =>
                        current === "destination" ? null : current,
                      );
                    }, 120);
                  }}
                  placeholder="Choose destination"
                  className="min-h-11 w-full rounded-[14px] border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 placeholder:text-stone-500 focus:border-orange-400 focus:outline-none"
                />
                {activeSuggestionField === "destination" && destinationSuggestions.length > 0 ? (
                  <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-[12px] border border-stone-200 bg-white shadow-[0_12px_30px_rgba(41,37,36,0.15)]">
                    {destinationSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectSuggestion("destination", suggestion);
                        }}
                        className="block w-full border-b border-stone-100 px-3 py-2 text-left text-sm text-stone-700 last:border-b-0 hover:bg-orange-50"
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <input
                type="datetime-local"
                value={departAt}
                onChange={(event) => setDepartAt(event.target.value)}
                aria-label="Journey start time"
                className="min-h-11 rounded-[14px] border border-stone-200 bg-stone-50 px-3 text-sm text-stone-900 focus:border-orange-400 focus:outline-none"
              />
              <button
                type="submit"
                className="min-h-11 rounded-full bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                {isRouteLoading ? "Checking..." : "Find"}
              </button>
            </form>
          )}
        </div>
        {mode === "route" ? <p className="mt-2 text-sm text-stone-600">{routeStatus}</p> : null}

        {mode === "route" && journeyPlan.length > 0 ? (
          <div className="mt-3 rounded-[18px] border border-orange-200 bg-orange-50/70 p-3 sm:p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700">Journey Namaz plan</h3>
            <p className="mt-1 text-sm text-stone-700">
              Suggested stops from your route timing. Follow in order while travelling.
            </p>
            <div className="mt-3 grid gap-2.5">
              {journeyPlan.map((stop) => {
                const mapsUrl = getGoogleMapsDirectionsUrl({
                  placeId: stop.placeId,
                  latitude: stop.mosqueLat,
                  longitude: stop.mosqueLng,
                });

                return (
                  <div
                    key={`${stop.prayer}-${stop.mosqueId}`}
                    className="flex flex-col gap-2 rounded-[14px] border border-orange-200/70 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900">
                          {formatPrayerLabel(stop.prayer)} at {stop.mosqueName}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${getPlanConfidenceTone(
                            stop.confidence,
                          )}`}
                        >
                          {stop.confidence}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600">
                        ETA {stop.estimatedArrival} • Jamaat {stop.prayerTimeDisplay} • wait {stop.waitMinutes} min
                      </p>
                    </div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-9 items-center self-start rounded-full bg-orange-600 px-3.5 text-xs font-semibold text-white transition hover:bg-orange-700"
                    >
                      Navigate
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {mode === "nearby" && nearbySource === "current" ? (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-700 motion-safe:animate-pulse" aria-hidden>
                    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
                      <path d="M10 1.75a6 6 0 0 0-6 6c0 4.31 5.15 9.68 5.37 9.9a.9.9 0 0 0 1.26 0c.22-.22 5.37-5.59 5.37-9.9a6 6 0 0 0-6-6Zm0 8.25a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5Z" />
                    </svg>
                  </span>
                ) : null}
                <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
                  {mode === "nearby" ? nearbyHeading : "Mosques on route"}
                </h2>
              </div>
              <p className="mt-1 text-sm text-stone-600">
                {mode === "nearby"
                  ? nearbySubtext
                  : "Within 3 km buffer of your route, sorted by closest stop."}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            {visibleMosques.length > 0 ? (
              visibleMosques.map((mosque) => (
                <MosqueCard
                  key={mosque.id}
                  mosque={mosque}
                  onAddTimings={(entry) => void handleAddTimings(entry, mode)}
                  isCreating={creatingMosqueId === mosque.id}
                />
              ))
            ) : (
              <div className="rounded-[28px] border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center text-sm text-stone-600">
                {isNearbyLoading || isRouteLoading
                  ? "Loading masjids..."
                  : mode === "nearby" && hasNoAddedMasjids
                    ? "No added masjids yet. Tap \"Show nearby masjids\" to discover around your current location."
                    : "No masjids to show right now."}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900">Map view</h2>
            <p className="mt-1 text-sm text-stone-600">
              Live map context for your nearby and route decisions.
            </p>
          </div>
          <GoogleMap
            currentLocation={currentLocation}
            mosques={visibleMosques}
            routePath={mode === "route" ? routePath : []}
          />

          <div className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_16px_60px_rgba(41,37,36,0.08)]">
            <h3 className="text-lg font-semibold text-stone-900">Trust and freshness</h3>
            <div className="mt-4 grid gap-3 text-sm text-stone-600">
              <p>1. Verified badges are shown when mosque data is refreshed within the last 5 days.</p>
              <p>2. Public view is read-only and focused on speed and clarity.</p>
              <p>3. Mosque add/update remains admin-only through QR or direct update links.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="rounded-[20px] border border-stone-200 bg-white px-4 py-3 text-xs text-stone-600 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/privacy" className="font-medium text-stone-700 hover:text-orange-700">
            Privacy Policy
          </Link>
          <Link href="/terms" className="font-medium text-stone-700 hover:text-orange-700">
            Terms
          </Link>
          <Link href="/disclaimer" className="font-medium text-stone-700 hover:text-orange-700">
            Disclaimer
          </Link>
          <Link href="/community-guidelines" className="font-medium text-stone-700 hover:text-orange-700">
            Community Guidelines
          </Link>
          <Link href="/contact" className="font-medium text-stone-700 hover:text-orange-700">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}

function formatLocalDateTimeInput(date: Date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function getPlanConfidenceTone(confidence: JourneyPrayerStop["confidence"]) {
  switch (confidence) {
    case "On-time":
      return "bg-emerald-100 text-emerald-800";
    case "Tight":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-rose-100 text-rose-700";
  }
}

function getAreaLabel(results: google.maps.GeocoderResult[]) {
  const componentMap = new Map<string, string>();

  for (const result of results) {
    for (const component of result.address_components) {
      for (const type of component.types) {
        if (!componentMap.has(type)) {
          componentMap.set(type, component.long_name);
        }
      }
    }
  }

  const primary =
    componentMap.get("locality") ||
    componentMap.get("sublocality_level_1") ||
    componentMap.get("administrative_area_level_3") ||
    componentMap.get("administrative_area_level_2") ||
    componentMap.get("postal_town");
  const secondary =
    componentMap.get("administrative_area_level_3") ||
    componentMap.get("administrative_area_level_2") ||
    componentMap.get("administrative_area_level_1");

  if (primary && secondary && primary !== secondary) {
    return `${primary}, ${secondary}`;
  }

  return primary || secondary || "your area";
}
