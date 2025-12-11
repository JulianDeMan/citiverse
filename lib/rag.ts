// lib/rag.ts
import OpenAI from "openai";
import { kv } from "@vercel/kv";
import fs from "node:fs/promises";
import path from "node:path";

export type DocChunk = {
  id: string;
  docId: string;
  source: string;
  title?: string;
  text: string;
  embedding?: number[];
};

const KV_INDEX_KEY = "rag:index:v1"; // array<DocChunk> met embedding
const FS_DIR = path.join(process.cwd(), ".data");
const FS_INDEX = path.join(FS_DIR, "rag-index.json");

// --- Storage helpers (KV -> FS fallback) ---

async function hasKV() {
  return !!process.env.KV_REST_API_URL;
}

export async function loadIndex(): Promise<DocChunk[]> {
  if (await hasKV()) {
    const value = await kv.get<DocChunk[]>(KV_INDEX_KEY);
    return value ?? [];
  }
  try {
    const buf = await fs.readFile(FS_INDEX, "utf-8");
    return JSON.parse(buf);
  } catch {
    return [];
  }
}

export async function saveIndex(chunks: DocChunk[]) {
  if (await hasKV()) {
    await kv.set(KV_INDEX_KEY, chunks);
    return;
  }
  await fs.mkdir(FS_DIR, { recursive: true });
  await fs.writeFile(FS_INDEX, JSON.stringify(chunks), "utf-8");
}

// --- Chunking ---

export function chunkText(text: string, chunkSize = 1200, overlap = 200) {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length);
    out.push(text.slice(i, end));
    if (end === text.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return out;
}

// --- Embeddings & similarity ---

export async function embed(client: OpenAI, texts: string[]) {
  const resp = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: texts
  });
  return resp.data.map(d => d.embedding);
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

export function topK(questionVec: number[], chunks: DocChunk[], k = 6) {
  return chunks
    .map(c => ({ c, score: cosine(questionVec, c.embedding ?? []) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(x => x.c);
}

// --- System prompt (in NL, zoals gevraagd) ---

export const SYSTEM_INSTRUCTION = `
Deze GPT is bedoeld om inwoners van Rotterdam op een toegankelijke en betrouwbare manier te informeren over de haven. 
Hij helpt mensen om plannen, beleid en ontwikkelingen in en rond de haven beter te begrijpen en te plaatsen in hun dagelijks leven.
Bedrijven en beleidsmakers kunnen ook vragen stellen, maar de toon en uitleg zijn in eerste instantie gericht op burgers.

De GPT gebruikt uitsluitend de documenten die aan deze GPT zijn toegevoegd en zoekt nooit informatie op internet. 
Als informatie ontbreekt, zeg dat eerlijk en help de gebruiker verder met een gerichte vervolgvraag of toelichting. 
Alleen wanneer er in de beschikbare documenten iets staat dat kan helpen, geef dat door.

Toon: menselijk, vriendelijk, deskundig — alsof je met een goed geïnformeerde buur praat die rustig uitlegt.
Pas de toon aan: nuchter en feitelijk bij beleidsvragen; persoonlijker bij vragen van inwoners.

Antwoorden zijn:
- Duidelijk en feitelijk, met uitleg van begrippen en context.
- Evenwichtig: benoem zowel voordelen als aandachtspunten.
- Respectvol en betrokken.
- In verzorgd, begrijpelijk Nederlands zonder onnodig jargon.

Denk mee over praktische gevolgen, corrigeer misverstanden waar nodig, en help gebruikers om beleidsstukken en plannen te begrijpen.
Als iemand doorvraagt en de informatie is beschikbaar in de documenten, deel die begrijpelijk.
Beperk je tot de aangeleverde documenten (context) en vermeld het als iets niet in de bronnen staat.
`;

// --- Build prompt from retrieved chunks ---

export function buildPrompt(question: string, contexts: DocChunk[]) {
  const ctx = contexts
    .map((c, i) => `[#${i + 1}] Bron: ${c.title ?? c.source}\n${c.text}`)
    .join("\n\n");
  return `Context uit documenten:\n\n${ctx}\n\nVraag: ${question}\n\nAntwoord in het Nederlands volgens de instructie. Verwijs niet naar externe bronnen.`;
}
