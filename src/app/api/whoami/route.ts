import { NextRequest } from "next/server";

// return the IP address as detected from request headers (same logic used in submit)
export function GET(req: NextRequest) {
  const headerCandidates = [
    "x-internal-ip",
    "x-remote-ip",
    "x-real-ip",
    "x-forwarded-for",
    "x-cluster-client-ip",
    "cf-connecting-ip",
    "true-client-ip",
  ];

  let ip = "unknown";
  for (const h of headerCandidates) {
    const v = req.headers.get(h);
    if (v) {
      ip = v.split(",")[0].trim();
      break;
    }
  }
  ip = ip.replace(/^::ffff:/i, "");
  return new Response(JSON.stringify({ ip }), { headers: { "Content-Type": "application/json" } });
}
