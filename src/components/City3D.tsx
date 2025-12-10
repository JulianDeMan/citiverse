import { useMemo, useState, useCallback, useEffect } from "react";
import DeckGL from "@deck.gl/react";
import { Map } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import { Tile3DLayer } from "@deck.gl/geo-layers";
import { ScatterplotLayer, TextLayer } from "@deck.gl/layers";
import type { PickingInfo } from "@deck.gl/core";
import { registerLoaders } from "@loaders.gl/core";
import { Tiles3DLoader } from "@loaders.gl/3d-tiles";
import "maplibre-gl/dist/maplibre-gl.css";

registerLoaders([Tiles3DLoader]);

type Project = {
  id: string;
  title: string;
  area: string;
  status: string;
  summary: string;
  lat: number;
  lon: number;
  start: string;
  ready: string;
  type: string[];
};
type Focus = { lat: number; lon: number; zoom?: number } | null;

const FALLBACK = { longitude: 4.4777, latitude: 51.9244, zoom: 12.5, pitch: 60, bearing: 0 };
const TILESET_URL =
  "https://www.3drotterdam.nl/datasource-data/3adbe5af-d05c-475a-b34c-59e69ba8dadc/tileset.json";

const BRAND_GREEN_RGBA: [number, number, number, number] = [47, 111, 87, 220];
const rad2deg = (r: number) => (r * 180) / Math.PI;

type Props = {
  projects: Project[];
  focus?: Focus;
  onSelect?: (id: string, center?: { lat: number; lon: number }) => void;
};

export default function City3D({ projects, focus, onSelect }: Props) {
  const [status, setStatus] = useState<string>("");
  const [viewState, setViewState] = useState(FALLBACK);
  const [picked, setPicked] = useState<Project | null>(null);

  const zoomToCenter = useCallback((lon: number, lat: number, zoom = 15) => {
    setViewState((v) => ({ ...v, longitude: lon, latitude: lat, zoom, pitch: 60, bearing: 0 }));
  }, []);

  useEffect(() => { if (focus) zoomToCenter(focus.lon, focus.lat, focus.zoom ?? 15); }, [focus, zoomToCenter]);

  const projectLayer = useMemo(() => new ScatterplotLayer<Project>({
    id: "projects-pts",
    data: projects,
    pickable: true,
    getPosition: d => [d.lon, d.lat],
    getFillColor: BRAND_GREEN_RGBA,
    getLineColor: [255, 255, 255],
    lineWidthMinPixels: 1,
    stroked: true,
    radiusMinPixels: 6,
    radiusMaxPixels: 18,
    getRadius: () => 60,
    onClick: (info: PickingInfo<Project>) => {
      if (info.object) {
        setPicked(info.object);
        onSelect?.(info.object.id, { lat: info.object.lat, lon: info.object.lon });
      }
    },
  }), [projects, onSelect]);

  const labelLayer = useMemo(() => new TextLayer<Project>({
    id: "projects-labels",
    data: projects,
    pickable: false,
    getPosition: d => [d.lon, d.lat],
    getText: d => d.area,
    getSize: 12,
    getColor: [30, 56, 43, 230],
    getTextAnchor: "start",
    getAlignmentBaseline: "center",
    getPixelOffset: [10, 0],
  }), [projects]);

  const tilesLayer = useMemo(() => {
    if (!TILESET_URL) { setStatus("Geen tileset URL."); return null as any; }
    setStatus("3D tiles laden…");
    return new Tile3DLayer({
      id: "rotterdam-3d-buildings",
      data: TILESET_URL,
      loadOptions: { fetch: { mode: "cors" }, "3d-tiles": { loadGLTF: true } },
      pickable: false,
      onTilesetLoad: (tileset: any) => {
        try {
          const cc = tileset?.cartographicCenter || tileset?._cartographicCenter;
          if (cc && typeof cc.longitude === "number" && typeof cc.latitude === "number") {
            zoomToCenter(cc.longitude, cc.latitude, 16);
            setStatus("3D tiles geladen."); return;
          }
          const region: number[] | undefined =
            tileset?.root?.boundingVolume?.region || tileset?.tilesetJson?.root?.boundingVolume?.region;
          if (Array.isArray(region) && region.length >= 4) {
            const west = region[0], south = region[1], east = region[2], north = region[3];
            const lon = rad2deg((west + east) / 2), lat = rad2deg((south + north) / 2);
            const span = Math.abs(rad2deg(east - west));
            const estZoom = span > 1 ? 11 : span > 0.5 ? 12 : span > 0.25 ? 13 : span > 0.1 ? 14 : 16;
            zoomToCenter(lon, lat, estZoom);
            setStatus("3D tiles geladen."); return;
          }
          setStatus("3D tiles geladen (fallback).");
        } catch (e: any) {
          setStatus(`Tileset geladen, maar geen auto-zoom: ${e?.message || e}`);
        }
      },
    });
  }, [zoomToCenter]);

  const layers = useMemo(() => [tilesLayer, projectLayer, labelLayer].filter(Boolean), [tilesLayer, projectLayer, labelLayer]);

  return (
    <DeckGL
      useDevicePixels={1}
      layers={layers as any}
      initialViewState={viewState}
      viewState={viewState}
      controller={true}
      onViewStateChange={(e) => setViewState(e.viewState as any)}
      getTooltip={({ object }) => object && (object as Project).title ? `${(object as Project).title}\n${(object as Project).area}` : null}
      style={{ width: "100%", height: "100%" }}
    >
      <Map mapLib={maplibregl} mapStyle="https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" reuseMaps />
      {(status || picked) && (
        <div style={{ position: "absolute", left: 12, bottom: 12, display: "grid", gap: 8, maxWidth: 420 }}>
          {status && (
            <div style={{ background: "rgba(0,0,0,.6)", color: "#fff", padding: "6px 8px", borderRadius: 8, fontSize: 12, width: "fit-content" }}>
              {status}
            </div>
          )}
          {picked && (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.12)", padding: 12 }}>
              <div style={{ fontWeight: 700, color: "#16324f" }}>{picked.title}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Gebied: {picked.area} • Fase: {picked.status}</div>
              <div style={{ fontSize: 14, marginBottom: 8 }}>{picked.summary}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                <div style={{ background: "#e6f1ec", padding: 8, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>Start</div>
                  <div style={{ fontWeight: 600 }}>{picked.start}</div>
                </div>
                <div style={{ background: "#e6f1ec", padding: 8, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>Gereed</div>
                  <div style={{ fontWeight: 600 }}>{picked.ready}</div>
                </div>
                <div style={{ background: "#e6f1ec", padding: 8, borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: "#6b7280" }}>Type</div>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{picked.type.join(", ")}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="pv-btn-outline" onClick={() => zoomToCenter(picked.lon, picked.lat, 16)}>Zoom naar project</button>
                <button className="pv-btn" onClick={() => setPicked(null)}>Sluiten</button>
              </div>
            </div>
          )}
        </div>
      )}
    </DeckGL>
  );
}
