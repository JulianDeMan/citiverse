import { useEffect, useMemo, useRef } from "react";
import maplibregl, {
  Map as MapLibreMap,
  Marker as MLMarker,
  LngLatBounds,
  Popup,
  NavigationControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { PROJECTS } from "../data";

type Props = {
  onSelect: (id: string) => void;
  filteredIds: string[];
  focus?: { lat: number; lon: number; zoom?: number } | null;
  fitBump?: number;
};

function createMarkerEl(label: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "pv-marker";
  el.textContent = label;
  return el;
}

export default function Map({ onSelect, filteredIds, focus, fitBump = 0 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Record<string, MLMarker>>({});

  const visible = useMemo(
    () => PROJECTS.filter((p) => filteredIds.includes(p.id)),
    [filteredIds]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [4.05, 51.95],
      zoom: 9.5,
      pitch: 0,
      bearing: 0,
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), "top-left");
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};

    visible.forEach((p) => {
      const el = createMarkerEl(p.area);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.lon, p.lat])
        .addTo(map);

      el.addEventListener("click", () => {
        new Popup({ offset: 12 })
          .setLngLat([p.lon, p.lat])
          .setHTML(
            `<div style="font-size:12px">
               <div style="font-weight:600;margin-bottom:4px">${p.title}</div>
               <div style="color:#6b7280">${p.area}</div>
             </div>`
          )
          .addTo(map);
        onSelect(p.id);
      });

      markersRef.current[p.id] = marker;
    });
  }, [visible, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!visible.length) return;

    const b = new LngLatBounds();
    visible.forEach((p) => b.extend([p.lon, p.lat]));
    map.fitBounds(b, { padding: 60, maxZoom: 14, duration: 600 });
  }, [fitBump, visible]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focus) return;
    map.flyTo({
      center: [focus.lon, focus.lat],
      zoom: focus.zoom ?? Math.max(map.getZoom(), 12),
      speed: 0.8,
      curve: 1.42,
      essential: true,
    });
  }, [focus]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
