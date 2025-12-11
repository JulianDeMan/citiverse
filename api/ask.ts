// api/ask.ts — POST /api/ask (zelfde als /api/chat)
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o-mini';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed', allow: 'POST' });
    return;
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY env var' });
      return;
    }

    const { messages = [], systemPrompt } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Body must contain { messages: [...] }' });
      return;
    }

    const fullMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages,
    ];

    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: fullMessages,
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => '');
      res.status(r.status).json({ error: `Upstream error ${r.status}`, detail: text });
      return;
    }

    const data = await r.json();
    const answer = data?.choices?.[0]?.message?.content ?? '';
    res.status(200).json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: 'Server error', detail: String(err?.message || err) });
  }
}
