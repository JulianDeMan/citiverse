import React, { useMemo, useState, useEffect } from "react";

/** Demo-meldingen — vervang gerust door echte data later */
const DEMO_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Werkzaamheden Eemhaven",
    time: "Vandaag, 10:30",
    text: "Nachtwerk aan kade. Verwacht extra geluid tussen 23:00–05:00.",
    tag: "Geluid",
  },
  {
    id: "n2",
    title: "Porthos update",
    time: "Gisteren, 16:05",
    text: "CO₂-leiding inspectie. Geen hinder voor verkeer.",
    tag: "Project",
  },
  {
    id: "n3",
    title: "Scheepvaart verkeer",
    time: "Ma 08:15",
    text: "Drukte bij Waalhaven. Omrijden via Eemhavenweg aangeraden.",
    tag: "Verkeer",
  },
];

type NotificationItem = typeof DEMO_NOTIFICATIONS[number];

/** Eenvoudige localStorage helper voor “gelezen” status */
function useLocalStore<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

/**
 * Meldingen-knop + drawer in één component.
 * Je bestaande import/gebruik van <NotificationsButton /> blijft werken.
 */
export function NotificationsButton() {
  const [open, setOpen] = useState(false);
  const [seenIds, setSeenIds] = useLocalStore<string[]>("pv_seen_notifications", []);

  const unseenCount = useMemo(() => {
    const all = DEMO_NOTIFICATIONS.map((n) => n.id);
    const unseen = all.filter((id) => !seenIds.includes(id));
    return unseen.length;
  }, [seenIds]);

  function openPanel() {
    setOpen(true);
    // markeer alles als gelezen bij openen
    const all = DEMO_NOTIFICATIONS.map((n) => n.id);
    setSeenIds((prev) => Array.from(new Set([...prev, ...all])));
  }

  function closePanel() {
    setOpen(false);
  }

  return (
    <>
      {/* De knop zelf */}
      <button
        onClick={openPanel}
        className="pv-btn"
        aria-label="Meldingen"
        title="Meldingen"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid #d9e5df",
          background: "#f6fbf8",
          color: "#164e3b",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {/* bel-icoon (SVG, geen extra lib nodig) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0H9m6 0a3 3 0 1 1-6 0"
            stroke="#164e3b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Meldingen</span>
        {unseenCount > 0 && (
          <span
            style={{
              background: "#dc2626",
              color: "#fff",
              borderRadius: 999,
              padding: "2px 6px",
              fontSize: 12,
              lineHeight: 1,
            }}
            aria-label={`${unseenCount} nieuwe meldingen`}
          >
            {unseenCount}
          </span>
        )}
      </button>

      {/* Backdrop */}
      <div
        onClick={closePanel}
        style={{
          position: "fixed",
          inset: 0,
          background: open ? "rgba(0,0,0,0.25)" : "transparent",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity .2s ease",
          zIndex: 60,
        }}
      />

      {/* Drawer rechts */}
      <aside
        aria-hidden={!open}
        role="dialog"
        aria-label="Meldingen"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100dvh",
          width: "380px",
          maxWidth: "90vw",
          background: "#ffffff",
          borderLeft: "1px solid #e5efe9",
          boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform .25s ease",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <header
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #e5efe9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f9fdfb",
          }}
        >
          <div style={{ fontWeight: 700, color: "#164e3b" }}>Meldingen</div>
          <button
            onClick={closePanel}
            aria-label="Sluiten"
            style={{
              border: "1px solid #d9e5df",
              background: "#fff",
              color: "#164e3b",
              borderRadius: 10,
              padding: "6px 8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sluiten
          </button>
        </header>

        <div
          style={{
            padding: 12,
            overflow: "auto",
            display: "grid",
            gap: 10,
            flex: 1,
            background: "#fbfefc",
          }}
        >
          {DEMO_NOTIFICATIONS.map((n) => (
            <article
              key={n.id}
              style={{
                border: "1px solid #e5efe9",
                borderRadius: 14,
                padding: 12,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#2f6f57",
                    background: "#e7f4ee",
                    border: "1px solid #d4ece2",
                    borderRadius: 999,
                    padding: "2px 8px",
                  }}
                >
                  {n.tag}
                </span>
                <span style={{ fontSize: 12, color: "#6b7f76" }}>{n.time}</span>
              </div>
              <h3 style={{ margin: "8px 0 2px", fontSize: 16, color: "#164e3b" }}>
                {n.title}
              </h3>
              <p style={{ margin: 0, color: "#3b4a43", fontSize: 14 }}>{n.text}</p>
            </article>
          ))}
        </div>
      </aside>
    </>
  );
}

export default NotificationsButton;
