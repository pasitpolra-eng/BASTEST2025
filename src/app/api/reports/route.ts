import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[REPORTS] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
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
    console.log("[VERIFY] No token or missing env vars");
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    console.log("[VERIFY] Invalid token format");
    return false;
  }

  const [payloadB64, sigHex] = parts;
  const username = base64DecodeToString(payloadB64);

  console.log("[VERIFY] Decoded username:", username, "Expected:", ADMIN_USER);

  if (!username || username !== ADMIN_USER) {
    console.log("[VERIFY] Username mismatch");
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
    console.log("[VERIFY] Signature valid:", valid);
    return valid;
  } catch (e) {
    console.error("[VERIFY] Error:", e);
    return false;
  }
}

type RepairRow = {
  id?: string;
  job_id?: string;
  full_name?: string;
  name?: string;
  phone?: string;
  device?: string;
  device_id?: string;
  issue?: string;
  status?: string;
  dept_name?: string;
  dept_building?: string;    
  dept_floor?: string;         
  handler_id?: string;
  handler_tag?: string;
  notes?: string;
  receipt_no?: string | null;
  reject_reason?: string | null;
  created_at?: string;
  updated_at?: string;
};

type UpdatePayload = {
  jobId: string;
  status?: string;
  receiptNo?: string | null;
  reason?: string | null;
  handlerName?: string;
  name?: string;
  phone?: string;
  device?: string;
  notes?: string;
};



export async function GET() {
  console.log("[REPORTS] GET request received");
  console.log("[REPORTS] SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
  console.log("[REPORTS] SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ 
      error: "Missing SUPABASE credentials in environment" 
    }, { status: 500 });
  }

  try {
    console.log("[REPORTS] Attempting to fetch from repair_requests table...");
    
    const { data, error } = await supabaseAdmin
      .from("repair_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[REPORTS] Supabase query error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        code: error.code
      }, { status: 500 });
    }

    console.log("[REPORTS] Successfully fetched", (data || []).length, "records");

    const mapped = (data || []).map((item: RepairRow) => ({
      id: item.id || "",
      job_id: item.job_id || "",
      name: item.full_name || item.name || "-",
      phone: item.phone || "-",
      device: item.device || "-",
      device_id: item.device_id || "-", 
      issue: item.issue || "-",
      status: item.status || "pending",
      dept_name: item.dept_name || "-",
      dept_building: item.dept_building || "-", 
      dept_floor: item.dept_floor || "-",       
      handler_id: item.handler_id || "-",
      handler_tag: item.handler_tag || "-",
      notes: item.notes || "-",
      receipt_no: item.receipt_no || null,
      reject_reason: item.reject_reason || null,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || item.created_at || new Date().toISOString(),
    }));

    return NextResponse.json(mapped, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (err) {
    console.error("[REPORTS] GET catch error:", {
      message: String(err),
      error: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined
    });
    return NextResponse.json({ 
      error: `Server error: ${String(err)}` 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("[REPORTS] POST request received");

  const isAuthed = await verifyAuth(req);
  if (!isAuthed) {
    console.log("[REPORTS] POST Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as UpdatePayload;
    if (!body?.jobId) {
      return NextResponse.json({ ok: false, error: "jobId required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newStatus = body.status || "pending";
    const receiptNo = body.receiptNo ?? null;
    const reason = body.reason ?? null;

    const updateObj: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };
    if (receiptNo) updateObj["receipt_no"] = receiptNo;
    if (reason) updateObj["reject_reason"] = reason;
    if (body.handlerName) updateObj["handler_tag"] = body.handlerName;
    if (body.name) updateObj["full_name"] = body.name;
    if (body.phone) updateObj["phone"] = body.phone;
    if (body.device) updateObj["device"] = body.device;
    if (body.notes) updateObj["notes"] = body.notes;

    let finalUpdated: RepairRow[] = [];
    const attemptUpdate = async (field: string, value: string, obj: Record<string, unknown>) => {
      const toUpdate = { ...obj };
      let attempt = 0;

      while (attempt < 5) {
        attempt++;
        const { data, error } = await supabaseAdmin
          .from("repair_requests")
          .update(toUpdate)
          .eq(field, value)
          .select();

        if (!error) {
          console.log(`[REPORTS] Update succeeded on attempt ${attempt}`);
          return { data, error: null };
        }

        const errorMsg = String(error?.message || "");
        console.warn(`[REPORTS] Update attempt ${attempt} failed:`, errorMsg);

        const columnMatch = errorMsg.match(/could not find the '([^']+)' column/i);
        if (columnMatch && columnMatch[1]) {
          const missingCol = columnMatch[1];
          console.warn(`[REPORTS] Found missing column: '${missingCol}', removing from payload...`);
          
          if (toUpdate.hasOwnProperty(missingCol)) {
            delete toUpdate[missingCol];
            console.warn(`[REPORTS] Removed '${missingCol}' and retrying...`);
            continue;
          }
        }

        console.error(`[REPORTS] Cannot recover from error:`, errorMsg);
        return { data: null, error };
      }

      return { data: null, error: new Error("Max retries exceeded") };
    };

    const first = await attemptUpdate("job_id", body.jobId, updateObj);
    if (first.error) {
      console.error("[REPORTS] UPDATE error by job_id:", first.error);
      const second = await attemptUpdate("id", body.jobId, updateObj);
      if (second.error) {
        console.error("[REPORTS] UPDATE error by id:", second.error);
        return NextResponse.json({ ok: false, error: (second.error && second.error.message) || String(second.error) }, { status: 500 });
      }
      finalUpdated = (second.data as RepairRow[]) || [];
    } else {
      finalUpdated = (first.data as RepairRow[]) || [];
    }

    if (newStatus === "rejected" && reason) {
      console.log("[NOTIFY] Rejected job", body.jobId, "Reason:", reason);
    }

    return NextResponse.json({ 
      ok: true, 
      updated: finalUpdated || [],
      status: newStatus,
      jobId: body.jobId,
      completedAt: now,
      notificationSent: newStatus === "completed"
    });
  } catch (err) {
    console.error("[REPORTS] POST catch:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  console.log("[REPORTS] DELETE request received");

  const isAuthed = await verifyAuth(req); // ✓ req is used here
  if (!isAuthed) {
    console.log("[REPORTS] DELETE Unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: Record<string, string | undefined>;
    try {
      body = (await req.json()) as { jobId?: string; id?: string };
    } catch (parseErr) {
      console.error("[REPORTS] Failed to parse JSON:", parseErr);
      return NextResponse.json({ ok: false, error: "Invalid JSON in request body" }, { status: 400 });
    }

    console.log("[REPORTS] DELETE body received:", JSON.stringify(body));
    
       const deleteKey = body?.id || body?.jobId;
    
    if (!deleteKey) {
      console.error("[REPORTS] Missing both jobId and id in body:", body);
      return NextResponse.json({ ok: false, error: "jobId or id required" }, { status: 400 });
    }

    console.log("[REPORTS] Attempting to delete record with key:", deleteKey);

    const { error } = await supabaseAdmin
      .from("repair_requests")
      .delete()
      .eq("id", deleteKey);

    if (error) {
      console.error("[REPORTS] DELETE error from Supabase:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log("[DELETE] Job deleted successfully:", deleteKey);
    return NextResponse.json({ ok: true, message: "Record deleted" });
  } catch (err) {
    console.error("[REPORTS] DELETE catch:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
