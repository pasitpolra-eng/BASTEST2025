import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "").trim();

    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS;
    const ADMIN_COOKIE_SECRET = process.env.ADMIN_COOKIE_SECRET;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Received username:", JSON.stringify(username));
    console.log("Received password:", JSON.stringify(password));
    console.log("Expected ADMIN_USER:", JSON.stringify(ADMIN_USER));
    console.log("Expected ADMIN_PASS:", JSON.stringify(ADMIN_PASS));
    console.log("Username match:", username === ADMIN_USER);
    console.log("Password match:", password === ADMIN_PASS);
    console.log("====================");

    if (!ADMIN_USER || !ADMIN_PASS || !ADMIN_COOKIE_SECRET) {
      console.error("[LOGIN] Server not configured");
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    if (username !== ADMIN_USER) {
      console.error("[LOGIN] Username mismatch");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (password !== ADMIN_PASS) {
      console.error("[LOGIN] Password mismatch");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log("[LOGIN] Credentials match! Creating cookie...");

    const sig = crypto
      .createHmac("sha256", String(ADMIN_COOKIE_SECRET))
      .update(String(username))
      .digest("hex");
    const payloadB64 = Buffer.from(String(username), "utf8").toString("base64");
    const cookieValue = `${payloadB64}.${sig}`;

    const maxAge = 60 * 60 * 24;
    const isProd = process.env.NODE_ENV === "production";
    const secureFlag = isProd ? "Secure; " : "";
    const cookie = `admin_auth=${cookieValue}; Path=/; ${secureFlag}HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;

    console.log("[LOGIN] Success! Cookie created");

    return NextResponse.json({ ok: true }, {
      status: 200,
      headers: {
        "Set-Cookie": cookie
      }
    });
  } catch (err) {
    console.error("[LOGIN] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
