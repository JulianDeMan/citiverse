import React, { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap } from "maplibre-gl";
import DeckGL from "@deck.gl/react";
import { MapView } from "@deck.gl/core";
import { Tile3DLayer } from "@deck.gl/geo-layers";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import { Tiles3DLoader } from "@loaders.gl/3d-tiles";
import { registerLoaders } from "@loaders.gl/core";

import "maplibre-gl/dist/maplibre-gl.css";
import { Project } from "../data";

registerLoaders([Tiles3DLoader]);

type Props = {
  projects: Project[];
  focus: { lat: number; lon: number; zoom?: number } | null;
  onSelect: (id: string | null) => void;
};

const OSM_LIGHT =
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

// 3D Rotterdam tileset (LOD2)
const ROTTERDAM_3D_TILES =
  "https://www.3drotterdam.nl/datasource-data/3adbe5af-d05c-475a-b34c-59e69ba8dadc/tileset.json";

const INITIAL = {
  longitude: 4.4899,
  latitude: 51.9142,
  zoom: 13,
  pitch: 60,
  bearing: -20,
};

// PlanVertaler kleuren
const PV_GREEN = [47, 111, 87]; // hoofdgroen
const PV_WHITE = [255, 255, 255, 255];

export default function City3D({ projects, focus, onSelect }: Props) {
  const mapRef = useRef<MapLibreMap | null>(null);
  const deckRef = useRef<any>(null);

  // viewState dat DeckGL gebruikt (gesynchroniseerd met MapLibre)
  const [viewState, setViewState] = useState({
    longitude: INITIAL.longitude,
    latitude: INITIAL.latitude,
    zoom: INITIAL.zoom,
    pitch: INITIAL.pitch,
    bearing: INITIAL.bearing,
    repeat: true as const,
  });

  // Basemap opzetten
  useEffect(() => {
    if (mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: "maplibre-3d",
        style: OSM_LIGHT,
        center: [INITIAL.longitude, INITIAL.latitude],
        zoom: INITIAL.zoom,
        pitch: INITIAL.pitch,
        bearing: INITIAL.bearing,
        antialias: true,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-left");

      // Sync camera naar DeckGL viewState
      const syncView = () => {
        const c = map.getCenter();
        setViewState({
          longitude: c.lng,
          latitude: c.lat,
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
          repeat: true,
        });
      };

      map.on("move", syncView);
      map.on("resize", syncView);
      map.once("load", syncView);

      // Klik op MapLibre => gebruik DeckGL picking voor markers
      map.on("click", (e) => {
        try {
          const deck = deckRef.current;
          if (!deck) return;
          const pick = deck.pickObject?.({
            x: (e.point as any).x,
            y: (e.point as any).y,
            layerIds: ["project-markers-core"], // klik op de kern
          });
          const obj = pick?.object as Project | undefined;
          if (obj?.id) onSelect(obj.id);
        } catch (err) {
          console.warn("Picking error:", err);
        }
      });

      mapRef.current = map;
    } catch (err) {
      console.error("MapLibre init error:", err);
    }

    return () => {
      try {
        mapRef.current?.remove();
        mapRef.current = null;
      } catch {}
    };
  }, [onSelect]);

  // Zoomen naar focus (MapLibre is leidend)
  useEffect(() => {
    if (!focus || !mapRef.current) return;
    const { lat, lon, zoom = 15 } = focus;
    try {
      mapRef.current.easeTo({ center: [lon, lat], zoom, duration: 800 });
    } catch (e) {
      console.warn("Focus move failed:", e);
    }
  }, [focus]);

  // Dynamische groottes obv zoom (subtiel)
  const markerRadius = Math.max(6, Math.min(11, 6 + (viewState.zoom - 11) * 0.8));
  const haloRadius = markerRadius + 5;
  const labelSize = Math.max(11, Math.min(16, 11 + (viewState.zoom - 11) * 0.8));

  // DeckGL-layers (3D-gebouwen + markers (halo+kern) + labels)
  const layers = useMemo(() => {
    const tileLayer = new Tile3DLayer({
      id: "rotterdam-3d-tiles",
      data: ROTTERDAM_3D_TILES,
      loader: Tiles3DLoader,
      loadOptions: { "3d-tiles": { loadGLTF: true } },
      onError: (e: any) => console.warn("3D Tiles error:", e?.message || e),
    });

    // Zachte halo achter de marker (mooier zichtbaar)
    const markerHalo = new ScatterplotLayer<Project>({
      id: "project-markers-halo",
      data: projects || [],
      pickable: false,
      getPosition: (d) => [d.lon, d.lat],
      getFillColor: [...PV_GREEN, 90], // semi-transparante halo
      getRadius: () => haloRadius,
      radiusUnits: "pixels",
      stroked: false,
      updateTriggers: { data: projects, haloRadius },
    });

    // Kern van de marker (klikbaar)
    const markerCore = new ScatterplotLayer<Project>({
      id: "project-markers-core",
      data: projects || [],
      pickable: true,
      getPosition: (d) => [d.lon, d.lat],
      getFillColor: [...PV_GREEN, 230],
      getLineColor: PV_WHITE,
      lineWidthUnits: "pixels",
      getRadius: () => markerRadius,
      radiusUnits: "pixels",
      stroked: true,
      updateTriggers: { data: projects, markerRadius },
    });

    // Korte labels (alleen de plek/gebied, geen hele titel) als “pill”
    const labelsLayer = new TextLayer<Project>({
      id: "project-labels",
      data: projects || [],
      pickable: false,
      getPosition: (d) => [d.lon, d.lat],
      // Toon alleen de plek/gebied; val terug op kortere titel als 'area' ontbreekt
      getText: (d) => d.area || (d.title?.split("–")[0]?.trim() ?? d.title),
      getSize: () => labelSize,
      getColor: PV_WHITE,
      fontFamily: "Inter, system-ui, Arial, sans-serif",
      background: true,
      getBackgroundColor: [...PV_GREEN, 220], // groene pill
      backgroundPadding: [8, 5], // pill-achtig
      getPixelOffset: [0, -(markerRadius + 12)], // net boven de marker
      // optionele tekstschaduw (pseudo via outline)
      outlineColor: [0, 0, 0, 80],
      outlineWidth: 0,
      updateTriggers: { data: projects, labelSize, markerRadius },
    });

    return [tileLayer, markerHalo, markerCore, labelsLayer];
  }, [projects, haloRadius, markerRadius, labelSize]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* MapLibre onderop */}
      <div id="maplibre-3d" style={{ position: "absolute", inset: 0 }} />

      {/* DeckGL erbovenop. controller=false, viewState uit MapLibre, pointer-events: none
          => Map blijft bedienbaar; picking doen we via deckRef.pickObject in MapLibre click */}
      <DeckGL
        ref={deckRef}
        views={[new MapView({ repeat: true })]}
        controller={false}
        viewState={viewState}
        layers={layers}
        onError={(e: any) => console.warn("Deck error:", e?.message || e)}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
