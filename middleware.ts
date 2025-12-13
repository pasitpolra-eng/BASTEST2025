import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  const match = parts.find((p) => p.startsWith(name + "="));
  if (!match) return null;
  const value = match.substring(name.length + 1);
  return value && value.trim() ? value : null;
}

function base64DecodeToString(b64: string) {
  try {
    const raw = atob(b64);
    return decodeURIComponent(
      Array.prototype
        .map.call(raw, (c: string) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
  } catch {
    return "";
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    // allow login page and admin API routes
    if (pathname === "/admin/login" || pathname.startsWith("/api/admin")) {
      return NextResponse.next();
    }

    // Check for admin_auth cookie
    const cookieHeader = req.headers.get("cookie");
    const token = getCookieValue(cookieHeader, "admin_auth");
    const ADMIN_COOKIE_SECRET = process.env.ADMIN_COOKIE_SECRET;
    const ADMIN_USER = process.env.ADMIN_USER;

    if (!token || !ADMIN_COOKIE_SECRET || !ADMIN_USER) {
      console.log("[MIDDLEWARE] No token or missing env vars, redirecting to login");
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Token format: <payloadB64>.<sigHex>
    const parts = token.split(".");
    if (parts.length !== 2) {
      console.log("[MIDDLEWARE] Invalid token format");
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const [payloadB64, sigHex] = parts;
    const username = base64DecodeToString(payloadB64);

    if (!username || username !== ADMIN_USER) {
      console.log("[MIDDLEWARE] Username mismatch or empty");
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Verify HMAC signature
    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(String(ADMIN_COOKIE_SECRET));
      const msg = encoder.encode(String(username));
      const key = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"]
      );

      const hexToBytes = (hex: string) => {
        const len = hex.length / 2;
        const out = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          out[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return out;
      };

      const sigBytes = hexToBytes(sigHex);
      const valid = await crypto.subtle.verify("HMAC", key, sigBytes, msg);
      if (!valid) {
        console.log("[MIDDLEWARE] Signature invalid");
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }

      console.log("[MIDDLEWARE] Auth valid, allowing access");
      return NextResponse.next();
    } catch (e) {
      console.error("[MIDDLEWARE] Verify error:", e);
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"]
};
