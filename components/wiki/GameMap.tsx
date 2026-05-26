"use client";

import type { Map as LeafletMap, LeafletMouseEvent, Marker } from "leaflet";
import { useCallback, useEffect, useRef } from "react";

export type MapMarker = {
  id: string;
  name: string;
  x: number;
  y: number;
  imageUrl?: string | null;
  role?: string | null;
  versionColor?: string | null;
};

export type GameMapProps = {
  markers?: MapMarker[];
  height?: number;
  interactive?: boolean;
  onMapClick?: (x: number, y: number) => void;
  highlightId?: string;
};

const MAP_SIZE = 2048;

// Déclaré hors du composant pour éviter le problème "accessed before declared"
function addMarkersToMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  L: any,
  map: LeafletMap,
  markersMap: Map<string, Marker>,
  list: MapMarker[],
  hId: string | undefined,
  isInteractive: boolean,
) {
  list.forEach((marker) => {
    const isHighlighted = marker.id === hId;

    const color = marker.versionColor ?? "#7F77DD";
    const dotSize = isHighlighted ? 16 : 12;

    const icon = L.divIcon({
      className: "",
      html: `
        <div style="
          width:${dotSize}px;height:${dotSize}px;border-radius:50%;
          background:${color};
          box-shadow:0 0 0 2px rgba(255,255,255,0.8),0 2px 6px rgba(0,0,0,0.5)${isHighlighted ? `,0 0 10px ${color}cc` : ""};
          cursor:pointer;
        "></div>`,
      iconSize: [dotSize, dotSize],
      iconAnchor: [dotSize / 2, dotSize / 2],
    });

    const lMarker: Marker = L.marker([marker.y, marker.x], { icon }).addTo(map);

    if (isInteractive) {
      lMarker.bindPopup(`
        <div style="font-family:sans-serif;min-width:140px;">
          <div style="display:flex;align-items:center;gap:10px;">
            ${marker.imageUrl ? `<img src="${marker.imageUrl}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" />` : ""}
            <div>
              <div style="font-weight:bold;font-size:14px;">${marker.name}</div>
              ${marker.role ? `<div style="font-size:12px;color:#64748b;">${marker.role}</div>` : ""}
            </div>
          </div>
          <a href="/wiki/character/${marker.id}" style="display:block;margin-top:8px;font-size:12px;color:#3b82f6;text-decoration:none;">
            Voir la fiche →
          </a>
        </div>`);
    }

    markersMap.set(marker.id, lMarker);
  });
}

export default function GameMap({
  markers = [],
  height = 300,
  interactive = true,
  onMapClick,
  highlightId,
}: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());

  const stableOnMapClick = useCallback(
    (x: number, y: number) => onMapClick?.(x, y),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Refs pour accéder aux dernières valeurs dans la Promise async
  const markersRef2 = useRef(markers);
  const highlightRef = useRef(highlightId);

  useEffect(() => {
    markersRef2.current = markers;
  }, [markers]);
  useEffect(() => {
    highlightRef.current = highlightId;
  }, [highlightId]);

  // ── Initialisation de la carte (une seule fois) ──────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const el = container as HTMLElement & { _leaflet_id?: number };
    delete el._leaflet_id;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    let cancelled = false;

    import("leaflet").then((L) => {
      import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current) return;

      const bounds: [[number, number], [number, number]] = [
        [0, 0],
        [MAP_SIZE, MAP_SIZE],
      ];

      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxZoom: 2,
        zoomSnap: 0.5,
        scrollWheelZoom: interactive,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
        zoomControl: interactive,
        attributionControl: false,
      });

      L.imageOverlay("/map.webp", bounds).addTo(map);

      const target = highlightRef.current
        ? markersRef2.current.find((m) => m.id === highlightRef.current)
        : null;
      if (target) {
        map.setView([target.y, target.x], 0);
      } else {
        map.fitBounds(bounds);
      }

      if (onMapClick) {
        map.on("click", (e: LeafletMouseEvent) => {
          const x = Math.max(0, Math.min(MAP_SIZE, Math.round(e.latlng.lng)));
          const y = Math.max(0, Math.min(MAP_SIZE, Math.round(e.latlng.lat)));
          stableOnMapClick(x, y);
        });
        map.getContainer().style.cursor = "crosshair";
      }

      mapRef.current = map;

      // Ajouter les markers initiaux une fois la carte prête
      addMarkersToMap(
        L,
        map,
        markersRef.current,
        markersRef2.current,
        highlightRef.current,
        interactive,
      );
    });

    const markersSnapshot = markersRef.current;
    return () => {
      cancelled = true;
      markersSnapshot.clear();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mise à jour des markers quand la liste ou le highlight change ─────────
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((L) => {
      if (!mapRef.current) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      addMarkersToMap(
        L,
        mapRef.current,
        markersRef.current,
        markers,
        highlightId,
        interactive,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, highlightId]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", borderRadius: "8px", overflow: "hidden" }}
      className="bg-slate-900"
    />
  );
}
