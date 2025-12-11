import type { VercelRequest, VercelResponse } from "@vercel/node";
export const config = { runtime: "nodejs" };

import OpenAI from "openai";
import pdfParse from "pdf-parse";
import { z } from "zod";
import {
  chunkText,
  embed,
  loadIndex,
  saveIndex,
  type DocChunk
} from "../lib/rag";

const BodySchema = z.object({
  urls: z.array(z.string().url()).optional(),       // PDF of plain text urls
  texts: z.array(z.object({ title: z.string().optional(), text: z.string() })).optional()
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = BodySchema.parse(req.body ?? {});
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const index = await loadIndex();
    const newChunks: DocChunk[] = [];

    // 1) URLs
    if (body.urls?.length) {
      for (const url of body.urls) {
        const r = await fetch(url);
        const buf = Buffer.from(await r.arrayBuffer());
        let text = "";

        if (url.toLowerCase().endsWith(".pdf")) {
          const pdf = await pdfParse(buf);
          text = pdf.text || "";
        } else {
          text = await r.text();
        }

        const chunks = chunkText(text);
        const embeddings = await embed(client, chunks);
        chunks.forEach((t, i) => {
          newChunks.push({
            id: `u:${url}:c${i}`,
            docId: `u:${url}`,
            source: url,
            title: url.split("/").pop() || url,
            text: t,
            embedding: embeddings[i]
          });
        });
      }
    }

    // 2) Plain texts
    if (body.texts?.length) {
      for (const t of body.texts) {
        const chunks = chunkText(t.text);
        const embeddings = await embed(client, chunks);
        chunks.forEach((ct, i) => {
          newChunks.push({
            id: `t:${(t.title ?? "text").slice(0,50)}:c${i}`,
            docId: `t:${t.title ?? "text"}`,
            source: t.title ?? "tekst",
            title: t.title ?? undefined,
            text: ct,
            embedding: embeddings[i]
          });
        });
      }
    }

    const updated = [...index, ...newChunks];
    await saveIndex(updated);
    res.json({ ok: true, addedChunks: newChunks.length, totalChunks: updated.length });
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "Bad request" });
  }
}
