"use client";

import { useEffect, useRef, useState } from "react";

import { loadGoogleMaps } from "@/lib/google-maps";
import type { GeoPoint } from "@/lib/geo";
import { getGoogleMapsDirectionsUrl } from "@/lib/maps-links";
import type { MosqueView } from "@/types/mosque";

interface GoogleMapProps {
  currentLocation?: GeoPoint | null;
  mosques: MosqueView[];
  routePath?: GeoPoint[];
}

export function GoogleMap({ currentLocation, mosques, routePath = [] }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!mapRef.current) {
        return;
      }

      try {
        await loadGoogleMaps();
      } catch {
        if (!cancelled) {
          setError("Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the live map.");
        }
        return;
      }

      if (cancelled || !mapRef.current) {
        return;
      }

      const center =
        currentLocation ||
        routePath[0] || {
          latitude: 52.4862,
          longitude: -1.8904,
        };

      const map =
        mapInstanceRef.current ||
        new google.maps.Map(mapRef.current, {
          center: { lat: center.latitude, lng: center.longitude },
          zoom: 11,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

      mapInstanceRef.current = map;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      routePolylineRef.current?.setMap(null);

      const bounds = new google.maps.LatLngBounds();

      if (currentLocation) {
        const youMarker = new google.maps.Marker({
          map,
          position: { lat: currentLocation.latitude, lng: currentLocation.longitude },
          title: "You are here",
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#f97316",
            fillOpacity: 1,
            strokeColor: "#fff7ed",
            strokeWeight: 3,
            scale: 8,
          },
        });

        markersRef.current.push(youMarker);
        bounds.extend(youMarker.getPosition() as google.maps.LatLng);
      }

      mosques.forEach((mosque) => {
        const nextLine = mosque.nextJamaat
          ? `${mosque.nextJamaat.prayer.toUpperCase()} - ${mosque.nextJamaat.displayTime}`
          : "No jamaat data yet";
        const mapsUrl = getGoogleMapsDirectionsUrl(mosque);

        const marker = new google.maps.Marker({
          map,
          position: { lat: mosque.latitude, lng: mosque.longitude },
          title: mosque.name,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `<div style="padding:8px 10px; max-width:220px;"><strong>${mosque.name}</strong><br/>${nextLine}<br/><a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;color:#ea580c;font-weight:600;text-decoration:none;">🧭 Open in Maps</a></div>`,
        });

        marker.addListener("click", () => infoWindow.open({ anchor: marker, map }));
        markersRef.current.push(marker);
        bounds.extend(marker.getPosition() as google.maps.LatLng);
      });

      if (routePath.length > 0) {
        routePolylineRef.current = new google.maps.Polyline({
          map,
          path: routePath.map((point) => ({ lat: point.latitude, lng: point.longitude })),
          strokeColor: "#ea580c",
          strokeOpacity: 0.8,
          strokeWeight: 4,
        });

        routePath.forEach((point) => bounds.extend({ lat: point.latitude, lng: point.longitude }));
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 48);
      }

      setError(null);
    }

    void renderMap();

    return () => {
      cancelled = true;
    };
  }, [currentLocation, mosques, routePath]);

  if (error) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-[28px] border border-dashed border-stone-300 bg-stone-100/80 px-6 text-center text-sm text-stone-600">
        {error}
      </div>
    );
  }

  return <div ref={mapRef} className="min-h-80 rounded-[28px] border border-stone-200" />;
}
