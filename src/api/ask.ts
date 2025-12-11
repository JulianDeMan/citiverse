import type { VercelRequest, VercelResponse } from "@vercel/node";
export const config = { runtime: "nodejs" };

import OpenAI from "openai";
import { z } from "zod";
import {
  loadIndex,
  embed,
  topK,
  SYSTEM_INSTRUCTION,
  buildPrompt
} from "../lib/rag";

const BodySchema = z.object({ question: z.string().min(1) });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { question } = BodySchema.parse(req.body ?? {});
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const index = await loadIndex();
    if (!index.length) {
      return res.status(200).json({
        answer:
          "Ik heb nog geen documenten om op te zoeken. Voeg eerst pdf’s of teksten toe via /api/ingest."
      });
    }

    const [qVec] = await embed(client, [question]);
    const ctx = topK(qVec, index, 6);
    const prompt = buildPrompt(question, ctx);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: prompt }
      ]
    });

    const answer = completion.choices[0]?.message?.content?.trim() || "Geen antwoord";
    res.json({ answer });
  } catch (e: any) {
    res.status(400).json({ error: e?.message ?? "Bad request" });
  }
}
