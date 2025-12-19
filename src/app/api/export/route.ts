import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { RepairRequest } from "@/types";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[EXPORT] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabaseAdmin = createClient(String(SUPABASE_URL), String(SUPABASE_SERVICE_ROLE_KEY), {
  auth: { persistSession: false },
});

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
    const raw = Buffer.from(b64, "base64").toString("binary");
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

async function verifyAuth(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie");
  const token = getCookieValue(cookieHeader, "admin_auth");
  const ADMIN_COOKIE_SECRET = process.env.ADMIN_COOKIE_SECRET;
  const ADMIN_USER = process.env.ADMIN_USER;

  if (!token || !ADMIN_COOKIE_SECRET || !ADMIN_USER) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadB64, sigHex] = parts;
  const username = base64DecodeToString(payloadB64);

  if (!username || username !== ADMIN_USER) {
    return false;
  }

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
    return valid;
  } catch (e) {
    console.error("[EXPORT] Verify error:", e);
    return false;
  }
}

export async function GET(req: NextRequest) {
  console.log("[EXPORT] GET request received");

  const isAuthed = await verifyAuth(req);
  if (!isAuthed) {
    console.log("[EXPORT] Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status");

    const { data, error } = await supabaseAdmin
      .from("repair_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[EXPORT] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let filtered: RepairRequest[] = (data as RepairRequest[]) || [];
    if (status && status !== "all") {
      filtered = filtered.filter((r: RepairRequest) => r.status === status);
    }

    if (format === "json") {
      return NextResponse.json(filtered);
    }

    // CSV Format
    if (format === "csv") {
      const headers = [
        "Job ID",
        "ID",
        "ชื่อ",
        "เบอร์โทรศัพท์",
        "แผนก",
        "อาคาร",
        "ชั้น",
        "ชนิดอุปกรณ์",
        "หมายเลขเครื่อง (ร.พ.น.)",
        "ปัญหา / อาการ",
        "หมายเหตุ",
        "สถานะ",
        "เลขเครื่องที่เสร็จ",
        "เหตุผลการปฏิเสธ",
        "วันที่สร้าง",
        "วันที่อัปเดต",
        "ผู้ดำเนินการ",
      ];

      const rows = filtered.map((r: RepairRequest) => [
        r.job_id || "",
        r.id || "",
        r.full_name || "",
        r.phone || "",
        r.dept_name || "",
        r.dept_building || "",
        r.dept_floor || "",
        r.device || "",
        r.device_id || "",
        `"${(r.issue || "").replace(/"/g, '""')}"`, // Escape quotes in CSV
        `"${(r.notes || "").replace(/"/g, '""')}"`,
        r.status || "pending",
        r.receipt_no || "",
        r.reject_reason || "",
        r.created_at ? new Date(r.created_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "",
        r.updated_at ? new Date(r.updated_at).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" }) : "",
        r.handler_tag || r.handler_id || "",
      ]);

      const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
      
      // Add UTF-8 BOM for Excel to properly recognize Thai characters
      const bom = "\uFEFF";
      const csvWithBom = bom + csv;

      return new NextResponse(csvWithBom, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="repair_reports_${new Date().getTime()}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (err) {
    console.error("[EXPORT] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
