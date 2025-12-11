import type { VercelRequest, VercelResponse } from "@vercel/node";
export const config = { runtime: "nodejs" };

import handler from "./ask"; // hergebruik exact dezelfde handler

export default async function chat(req: VercelRequest, res: VercelResponse) {
  return handler(req, res);
}
