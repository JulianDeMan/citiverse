import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import OpenAI from "openai";

// ✅ pdf-parse via CommonJS require (dit werkt stabiel met ts-node/Windows)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require("pdf-parse");

/** === Basis app === */
const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/** === Paden === */
const ROOT = process.cwd(); // project root
// Zet je PDF's hier neer:
const DOCS_DIR = path.join(ROOT, "server", "docs");
// Embeddings-bestand
const DATA_DIR = path.join(ROOT, "server", "data");
const EMB_PATH = path.join(DATA_DIR, "embeddings.json");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

/** === OpenAI clients & modellen === */
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";

/** === Jouw GPT-persoonlijkheid (SYSTEM PROMPT) === */
const SYSTEM_PROMPT = `
Deze GPT is bedoeld om inwoners van Rotterdam op een toegankelijke en betrouwbare manier te informeren over de haven. Hij helpt mensen om plannen, beleid en ontwikkelingen in en rond de haven beter te begrijpen en te plaatsen in hun dagelijks leven. Bedrijven en beleidsmakers kunnen ook vragen stellen, maar de toon en uitleg zijn in eerste instantie gericht op burgers.

De GPT gebruikt uitsluitend de documenten die aan deze GPT zijn toegevoegd en zoekt nooit informatie op internet. Als informatie ontbreekt, zegt hij dat eerlijk en helpt hij de gebruiker verder met een gerichte vervolgvraag of toelichting. Alleen wanneer er in de beschikbare documenten iets staat dat kan helpen, geeft hij dat door.

De toon is menselijk, vriendelijk en deskundig — alsof je met een goed geïnformeerde buur praat die weet hoe het zit, maar het rustig uitlegt. De GPT past zijn toon aan op de vraag: nuchter en feitelijk bij beleidsvragen, en wat persoonlijker en betrokken bij vragen van inwoners.

De antwoorden zijn:
- Duidelijk en feitelijk, met uitleg van begrippen en context.
- Evenwichtig, waarbij zowel voordelen als aandachtspunten van plannen worden benoemd.
- Respectvol en betrokken, met oog voor de belangen van burgers, bedrijven en overheid.
- In verzorgd, begrijpelijk Nederlands geschreven, zonder onnodig vakjargon.

De GPT denkt mee over praktische gevolgen, corrigeert misverstanden waar nodig en helpt gebruikers om de inhoud van beleidsstukken, plannen of rapporten over de haven te begrijpen en toepasbaar te maken. Wanneer iemand doorvraagt en de informatie beschikbaar is, deelt de GPT die op een begrijpelijke manier.
`.trim();

/** === Types & helpers === */
type Chunk = { id: string; text: string; source: string; embedding: number[] };

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

function splitText(txt: string, max = 1200, overlap = 150) {
  const chunks: string[] = [];
  let i = 0;
  while (i < txt.length) {
    const part = txt.slice(i, Math.min(i + max, txt.length));
    const cleaned = part.replace(/\s+/g, " ").trim();
    if (cleaned) chunks.push(cleaned);
    i += max - overlap;
  }
  return chunks;
}

/** === Health & status === */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/status", (_req, res) => {
  const docs = fs.existsSync(DOCS_DIR)
    ? fs.readdirSync(DOCS_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"))
    : [];
  const embeddings = fs.existsSync(EMB_PATH);
  const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY);
  res.json({ embeddings, docs, hasOpenAIKey });
});

/** === Ingest: lees PDF's → maak embeddings === */
app.post("/api/ingest", async (_req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: "Geen OPENAI_API_KEY gevonden (.env)." });
    }

    const files = fs.existsSync(DOCS_DIR)
      ? fs.readdirSync(DOCS_DIR).filter((f) => f.toLowerCase().endsWith(".pdf"))
      : [];

    if (!files.length) {
      return res.status(400).json({ error: "Geen PDF's gevonden in server/docs/." });
    }

    const allChunks: Chunk[] = [];

    for (const file of files) {
      const full = path.join(DOCS_DIR, file);
      const buf = fs.readFileSync(full);

      // ✅ pdf-parse (CJS) – stabiel op ts-node/Windows
      const pdfRes = await pdfParse(buf);
      const text = String(pdfRes?.text || "");
      const chunks = splitText(text, 1200, 150);
      if (!chunks.length) continue;

      // Embeddings in batches
      const batchSize = 64;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        try {
          const resp = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: batch,
          });
          batch.forEach((t, j) => {
            allChunks.push({
              id: `${file}#${i + j}`,
              text: t,
              source: file,
              embedding: resp.data[j].embedding as unknown as number[],
            });
          });
        } catch (e: any) {
          const msg = String(e?.message || e);
          if (msg.includes("You exceeded your current quota")) {
            return res.status(402).json({
              error:
                "OpenAI-billing/tegoed ontbreekt of is op. Activeer billing of gebruik een lokale (gratis) RAG.",
            });
          }
          return res.status(500).json({ error: "Embedding request faalde: " + msg });
        }
      }
    }

    if (!allChunks.length) {
      return res.status(400).json({ error: "Geen tekstchunks gevonden in de PDF's." });
    }

    fs.writeFileSync(EMB_PATH, JSON.stringify({ chunks: allChunks }, null, 2), "utf8");
    res.json({ ok: true, chunks: allChunks.length, files: files.length });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || "ingest failed" });
  }
});

/** === Chat: retrieve + antwoord op basis van context === */
app.post("/api/chat", async (req, res) => {
  try {
    if (!fs.existsSync(EMB_PATH)) {
      return res.status(400).json({ error: "Geen embeddings gevonden. Voer eerst /api/ingest uit." });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: "Geen OPENAI_API_KEY gevonden (.env)." });
    }

    const { messages } = req.body as { messages: { role: string; content: string }[] };
    const userMsg = [...(messages || [])].reverse().find((m) => m.role === "user")?.content || "";
    if (!userMsg) return res.status(400).json({ error: "Geen vraag ontvangen." });

    // Embed vraag
    let qvec: number[];
    try {
      const e = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: userMsg,
      });
      qvec = e.data[0].embedding as unknown as number[];
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("You exceeded your current quota")) {
        return res.status(402).json({
          error:
            "OpenAI-tegoed/billing ontbreekt of is op. Activeer billing of schakel over op lokale RAG.",
        });
      }
      return res.status(500).json({ error: "Embedding request faalde: " + msg });
    }

    // Laden + scoren
    const store = JSON.parse(fs.readFileSync(EMB_PATH, "utf8")) as { chunks: Chunk[] };
    const top = store.chunks
      .map((c) => ({ c, score: cosine(qvec, c.embedding) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const context = top.map((s) => `[[Bron: ${s.c.source}]]\n${s.c.text}`).join("\n\n---\n\n");

    const PROMPT = `
[CONTEXT START]
${context}
[CONTEXT END]

Vraag van de gebruiker:
${userMsg}

ANTWOORDRICHTLIJNEN:
- Antwoord ALLEEN op basis van de CONTEXT hierboven (geen aannames, geen internet).
- Als info ontbreekt: zeg dat eerlijk en geef een korte vervolgstap.
- Schrijf in helder, verzorgd Nederlands, zonder onnodig vakjargon.
- Leg begrippen kort uit en noem relevante gevolgen (geluid, verkeer, planning, inspraak) als dat kan.
`.trim();

    let answer = "";
    try {
      const chat = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: PROMPT },
        ],
      });
      answer = chat.choices[0]?.message?.content?.trim() || "";
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("You exceeded your current quota")) {
        return res.status(402).json({
          error:
            "OpenAI-tegoed/billing ontbreekt of is op. Activeer billing of schakel over op een lokale (gratis) RAG.",
        });
      }
      return res.status(500).json({ error: "Chat request faalde: " + msg });
    }

    if (!answer)
      answer = "Ik kan hier niets zinnigs over zeggen op basis van de beschikbare documenten.";
    res.json({ answer });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || "chat failed" });
  }
});

/** === Start server === */
app.listen(PORT, () => {
  console.log(`RAG server listening on http://localhost:${PORT}`);
});
