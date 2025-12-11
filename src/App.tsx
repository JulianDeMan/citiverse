import React, { useMemo, useState } from "react";
import City3D from "./components/City3D";
import { PROJECTS, POSTCODE_AREAS, Project } from "./data";
import "./index.css";
import logo from "./assets/planvertaler.png";
import AssistantPanel from "./components/AssistantPanel";
import { NotificationsButton, NotificationsRoot } from "./components/Notifications";

type Focus = { lat: number; lon: number; zoom?: number } | null;

function ProjectCard({
  project,
  onZoom,
  onClose,
}: {
  project: Project;
  onZoom: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        bottom: 12,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        maxWidth: 380,
        width: 380,
        zIndex: 10,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 16 }}>{project.title}</div>
      <div style={{ color: "#6B7280", fontSize: 12, marginTop: 4 }}>
        Gebied: {project.area} • Fase: {project.status}
      </div>
      <p style={{ marginTop: 8, fontSize: 14, color: "#374151" }}>{project.summary}</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
        <div
          style={{
            background: "#ECF5F0",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
          }}
        >
          <div style={{ fontSize: 11, color: "#6B7280" }}>Start</div>
          <div style={{ fontWeight: 700 }}>{project.start}</div>
        </div>
        <div
          style={{
            background: "#ECF5F0",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
          }}
        >
          <div style={{ fontSize: 11, color: "#6B7280" }}>Gereed</div>
          <div style={{ fontWeight: 700 }}>{project.end}</div>
        </div>
        <div
          style={{
            background: "#ECF5F0",
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
          }}
        >
          <div style={{ fontSize: 11, color: "#6B7280" }}>Type</div>
          <div style={{ fontWeight: 700 }}>{project.type}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="pv-btn" onClick={onZoom}>
          Zoom naar project
        </button>
        <button className="pv-btn-outline" onClick={onClose}>
          Sluiten
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus3D, setFocus3D] = useState<Focus>(null);

  const filtered = useMemo(() => {
    if (!query.trim()) return PROJECTS;
    const q = query.toLowerCase();
    const areaHint = POSTCODE_AREAS[query.trim()];
    return PROJECTS.filter((p) => {
      const textHit =
        p.title.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q);
      const areaHit = areaHint ? p.area.toLowerCase().includes(areaHint.toLowerCase()) : false;
      return textHit || areaHit;
    });
  }, [query]);

  const selected = useMemo(
    () => PROJECTS.find((p) => p.id === selectedId) || null,
    [selectedId]
  );

  function handleSearchGo() {
    try {
      const pcHint = POSTCODE_AREAS[query.trim()];
      if (pcHint) {
        const p = PROJECTS.find((x) => x.area.toLowerCase().includes(pcHint.toLowerCase()));
        if (p) {
          setSelectedId(p.id);
          setFocus3D({ lat: p.lat, lon: p.lon, zoom: 15 });
          return;
        }
      }
      if (filtered.length === 1) {
        const p = filtered[0];
        setSelectedId(p.id);
        setFocus3D({ lat: p.lat, lon: p.lon, zoom: 16 });
        return;
      }
      if (filtered.length > 1) {
        const p = filtered[0];
        setSelectedId(p.id);
        setFocus3D({ lat: p.lat, lon: p.lon, zoom: 14 });
        return;
      }
      alert("Geen resultaten gevonden.");
    } catch (e) {
      console.warn("Search error:", e);
    }
  }

  return (
    <div>
      {/* Header */}
      <header className="pv-header">
        <div className="pv-header-inner">
          <img src={logo} alt="PlanVertaler Rotterdam" className="pv-logo" />
          <div className="pv-header-title">
            <div className="title">PlanVertaler – Citiverse</div>
            <div className="subtitle">Rotterdam</div>
          </div>
          <div className="pv-header-spacer" />
          <NotificationsButton />
        </div>
      </header>

      {/* Layout */}
      <main className="pv-main">
        {/* Linkerkolom */}
        <section className="pv-card">
          <div className="pv-card-header">Zoek</div>
          <div className="pv-card-body">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Project, gebied of postcode (bv. 3199)"
                className="pv-input"
              />
              <button className="pv-btn" onClick={handleSearchGo}>
                Zoek
              </button>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Tip: 3199 = Maasvlakte, 3087 = Waalhaven</div>

            <div className="pv-card-header" style={{ marginTop: 12 }}>
              Meedenken
            </div>
            <p style={{ fontSize: 14, color: "#374151" }}>
              Denk mee over plannen in jouw buurt. Deel ideeën of zorgen – we koppelen terug wat ermee gebeurt.
            </p>
            <button className="pv-btn-outline">Geef feedback</button>
          </div>
        </section>

        {/* Middenkolom: 3D-kaart */}
        <section className="pv-card" style={{ position: "relative" }}>
          <div className="pv-card-header">3D Rotterdam</div>
          <div className="pv-card-body">
            <div className="pv-map" style={{ height: 560, position: "relative" }}>
              <City3D
                projects={filtered}
                focus={focus3D}
                onSelect={(id) => {
                  // defensief: alleen als id bestaat
                  if (!id) {
                    setSelectedId(null);
                    return;
                  }
                  const p = PROJECTS.find((x) => x.id === id);
                  if (p) {
                    setSelectedId(id);
                  } else {
                    console.warn("Gekozen id niet gevonden:", id);
                    setSelectedId(null);
                  }
                }}
              />

              {selected && (
                <ProjectCard
                  project={selected}
                  onZoom={() => setFocus3D({ lat: selected.lat, lon: selected.lon, zoom: 16 })}
                  onClose={() => setSelectedId(null)}
                />
              )}
            </div>
          </div>
        </section>

        {/* Rechterkolom: Wegwijzer (GPT) */}
        <section className="pv-card" style={{ padding: 0 }}>
          <AssistantPanel />
        </section>
      </main>
    </div>
  );
  <Notifications />
}
