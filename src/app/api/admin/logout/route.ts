import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ ok: true }, {
    status: 200,
    headers: {
      "Set-Cookie": "admin_auth=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 UTC"
    }
  });
}
