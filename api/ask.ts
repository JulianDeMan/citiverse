export const config = { runtime: "edge" };

function json(resBody: unknown, status = 200) {
  return new Response(JSON.stringify(resBody), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

    const body = await req.json().catch(() => ({}));
    const question: string = typeof body?.question === "string" ? body.question : "";

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY ontbreekt");
      return json({ error: "Server is niet geconfigureerd (OPENAI_API_KEY)" }, 500);
    }
    if (!question) {
      return json({ error: "question ontbreekt" }, 400);
    }

    // Simpele call naar OpenAI; pas model evt. aan
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: "Je bent een behulpzame assistent." },
          { role: "user", content: question },
        ],
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("OpenAI error:", r.status, txt);
      return json({ error: `Upstream ${r.status}`, details: txt }, 502);
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    return json({ answer });
  } catch (err: any) {
    console.error("ask error:", err?.stack || err);
    return json({ error: "Internal Server Error" }, 500);
  }
}
