// api/health.ts  — GET /api/health
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed', allow: 'GET' });
    return;
  }
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}
