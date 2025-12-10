import React, { useMemo, useState } from "react";
import City3D from "./components/City3D";
import { PROJECTS, POSTCODE_AREAS } from "./data";
import "./index.css";
import logo from "./assets/planvertaler.png";

type Focus = { lat: number; lon: number; zoom?: number } | null;

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus3D, setFocus3D] = useState<Focus>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return PROJECTS;
    const q = query.toLowerCase();
    const maybeArea = POSTCODE_AREAS[query];
    return PROJECTS.filter(p =>
      [p.title, p.area, p.status, p.summary].some(v => v.toLowerCase().includes(q)) ||
      (maybeArea && p.area.toLowerCase().includes(maybeArea.toLowerCase()))
    );
  }, [query]);

  const selected = useMemo(() => PROJECTS.find(p => p.id === selectedId) || null, [selectedId]);

  function handleSearchGo() {
    // 1) Postcode -> focus op eerste match
    if (POSTCODE_AREAS[query]) {
      const area = POSTCODE_AREAS[query];
      const p = PROJECTS.find(x => x.area.toLowerCase().includes(area.toLowerCase()));
      if (p) {
        setSelectedId(p.id);
        setFocus3D({ lat: p.lat, lon: p.lon, zoom: 15 });
        return;
      }
    }
    // 2) Eén resultaat -> focus daarop
    if (filtered.length === 1) {
      const p = filtered[0];
      setSelectedId(p.id);
      setFocus3D({ lat: p.lat, lon: p.lon, zoom: 16 });
      return;
    }
    // 3) Meerdere resultaten -> focus op eerste (eenvoudig en duidelijk)
    if (filtered.length > 1) {
      const p = filtered[0];
      setSelectedId(p.id);
      setFocus3D({ lat: p.lat, lon: p.lon, zoom: 14 });
      return;
    }
    // 4) Geen resultaten
    alert("Geen resultaten gevonden voor je zoekopdracht.");
  }

  function handleFeedbackSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const naam = (fd.get("naam") as string) || "";
    const email = (fd.get("email") as string) || "";
    const onderwerp = (fd.get("onderwerp") as string) || "Feedback Citiverse";
    const bericht = (fd.get("bericht") as string) || "";
    const body =
      `Naam: ${naam}\nEmail: ${email}\nOnderwerp: ${onderwerp}\n\nBericht:\n${bericht}\n\n— Verzonden via PlanVertaler – Citiverse`;
    // Stuur via mailto (je kunt hier je echte mailadres invullen)
    const to = "citiverse@voorbeeld.nl";
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      onderwerp
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setShowFeedback(false);
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
          <button className="pv-header-btn" onClick={() => setShowFeedback(true)}>🔔 Meldingen</button>
        </div>
      </header>

      {/* Grid */}
      <main className="pv-main">
        {/* LINKS */}
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
              <button className="pv-btn" onClick={handleSearchGo}>Zoek</button>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Tip: 3199 = Maasvlakte, 3087 = Waalhaven
            </div>

            <div className="pv-card-header" style={{ marginTop: 12 }}>Meedenken</div>
            <p style={{ fontSize: 14, color: "#374151" }}>
              Denk mee over plannen in jouw buurt. Deel ideeën of zorgen – we koppelen terug wat ermee gebeurt.
            </p>
            <button className="pv-btn-outline" onClick={() => setShowFeedback(true)}>Geef feedback</button>
          </div>
        </section>

        {/* MIDDEN: alleen de 3D Rotterdam kaart (OUP) */}
        <section className="pv-card">
          <div className="pv-card-header">3D Rotterdam</div>
          <div className="pv-card-body">
            <div className="pv-map">
              <City3D
                projects={filtered}
                focus={focus3D}
                onSelect={(id) => setSelectedId(id)}
              />
            </div>
          </div>
        </section>

        {/* RECHTS */}
        <section className="pv-card">
          <div className="pv-card-header">Details</div>
          <div className="pv-card-body" style={{ display: "grid", gap: 8 }}>
            {!selected ? (
              filtered.map(p => (
                <button
                  key={p.id}
                  className="pv-btn-outline"
                  style={{ textAlign: "left" }}
                  onClick={() => setSelectedId(p.id)}
                >
                  {p.title}
                </button>
              ))
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <h3 style={{ margin: 0, color: "#16324f" }}>{selected.title}</h3>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Gebied: {selected.area} • Fase: {selected.status}
                </div>
                <div>{selected.summary}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  <div style={{ background: "#e6f1ec", padding: 8, borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>Start</div>
                    <div style={{ fontWeight: 600 }}>{selected.start}</div>
                  </div>
                  <div style={{ background: "#e6f1ec", padding: 8, borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>Gereed</div>
                    <div style={{ fontWeight: 600 }}>{selected.ready}</div>
                  </div>
                  <div style={{ background: "#e6f1ec", padding: 8, borderRadius: 12 }}>
                    <div style={{ fontSize: 10, color: "#6b7280" }}>Type</div>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{selected.type.join(", ")}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Feedback modal */}
      {showFeedback && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)",
            display: "grid", placeItems: "center", zIndex: 50
          }}
          onClick={() => setShowFeedback(false)}
        >
          <div
            className="pv-card"
            style={{ width: "min(680px, 96vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pv-card-header">Geef feedback</div>
            <form className="pv-card-body" onSubmit={handleFeedbackSubmit}>
              <input name="naam" className="pv-input" placeholder="Je naam (optioneel)" />
              <input name="email" type="email" className="pv-input" placeholder="Je e-mail (optioneel)" />
              <input name="onderwerp" className="pv-input" placeholder="Onderwerp" defaultValue="Feedback Citiverse" />
              <textarea name="bericht" className="pv-input" placeholder="Je bericht" rows={6} required />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" className="pv-btn-outline" onClick={() => setShowFeedback(false)}>Annuleer</button>
                <button type="submit" className="pv-btn">Verstuur</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
