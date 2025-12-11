import React, { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };
type ChatResp = { answer: string };

const HELPTEXT =
  "Stel je vraag over plannen of beleid in en rond de Rotterdamse haven. Deze assistent gebruikt alleen de documenten die aan de app zijn toegevoegd. Als info ontbreekt, zegt hij dat eerlijk.";

export default function AssistantPanel() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hallo! Ik ben je wegwijzer voor plannen en ontwikkelingen in de Rotterdamse haven. Hoe kan ik je helpen?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Scroll alleen het chatpaneel naar beneden (niet het hele scherm)
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setError(null);
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      // probeer body als json (ook bij error)
      let data: any = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg =
          data?.error ||
          (res.status === 0 ? "Kan de server niet bereiken." : `Fout ${res.status}: ${res.statusText}`);
        throw new Error(msg);
      }

      const answer = (data as ChatResp)?.answer || "Ik heb hier geen extra info over gevonden.";
      setMessages([...next, { role: "assistant", content: answer }]);
    } catch (err: any) {
      setError(err?.message || "Er ging iets mis bij het ophalen van het antwoord.");
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Er ging iets mis bij het ophalen van het antwoord. Probeer het later opnieuw of controleer of de server draait.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    // vaste hoogte + interne scroll, zodat de pagina zelf niet meescrolt
    <div
      className="pv-card"
      style={{
        height: 560,               // zelfde hoogte als de 3D-kaart
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        overflow: "hidden",
      }}
    >
      <div className="pv-card-header">Wegwijzer (GPT)</div>

      <div
        ref={scrollerRef}
        style={{
          padding: 12,
          overflowY: "auto",       // scroll alléén hier
          display: "grid",
          gap: 10,
          alignContent: "start",
        }}
      >
        <div style={{ fontSize: 12, color: "#6b7280" }}>{HELPTEXT}</div>

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              borderRadius: 10,
              padding: "8px 10px",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              justifySelf: m.role === "user" ? "end" : "start",
              maxWidth: "90%",
              background: m.role === "user" ? "#e6f1ec" : "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "10px 12px",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.content}
          </div>
        ))}

        {loading && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "8px 10px",
              color: "#6b7280",
              width: "fit-content",
            }}
          >
            Even nadenken…
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #e5e7eb" }}
      >
        <input
          className="pv-input"
          placeholder="Typ je vraag…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="pv-btn" disabled={loading}>
          Verstuur
        </button>
      </form>
    </div>
  );
}
