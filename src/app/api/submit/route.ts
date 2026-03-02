import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(String(url), String(serviceKey), { auth: { persistSession: false } });

export async function POST(req: NextRequest) {
  try {
    const headerCandidates = [
      "x-internal-ip",        // ← อันนี้เราต้องให้ proxy/บริการกรอก
      "x-remote-ip",
      "x-real-ip",
      "x-forwarded-for",
      "x-cluster-client-ip",
      "cf-connecting-ip",
      "true-client-ip",
    ];

    let requesterIp = "unknown";
    for (const h of headerCandidates) {
      const v = req.headers.get(h);
      if (v) {
        requesterIp = v.split(",")[0].trim();
        break;
      }
    }

    // strip IPv6-mapped IPv4 prefix if present
    requesterIp = requesterIp.replace(/^::ffff:/i, "");
    console.log("[SUBMIT] Requester IP:", requesterIp, "(from headers checked:", headerCandidates.join(","), ")");

    // (submitter_ip column was removed; use request_ip)

    // typed interface for incoming JSON payload
    interface SubmitPayload {
      fullName?: string;
      deptName?: string;
      deptBuilding?: string;
      deptFloor?: string;
      device?: string;
      deviceId?: string;
      issue?: string;
      phone?: string;
      notes?: string;
      clientIp?: string;
    }

    const body = (await req.json()) as SubmitPayload;
    const {
      fullName = "",
      deptName = "",
      deptBuilding = "",
      deptFloor = "",
      device = "",
      deviceId = "",
      issue = "",
      phone = "",
      notes = "",
      clientIp,
    } = body;

    // if the client supplied an explicit IP, use that instead of headers
    if (clientIp && typeof clientIp === "string" && clientIp.trim()) {
      requesterIp = clientIp.trim().replace(/^::ffff:/i, "");
      console.log("[SUBMIT] Overriding requester IP with client-supplied value:", requesterIp);
    }

    // Validation
    if (!fullName || !fullName.trim()) {
      return Response.json(
        { ok: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (!device || !device.trim()) {
      return Response.json(
        { ok: false, error: "Device type is required" },
        { status: 400 }
      );
    }

    if (!deviceId || !deviceId.trim()) {
      return Response.json(
        { ok: false, error: "Device ID is required" },
        { status: 400 }
      );
    }

    if (!issue || !issue.trim()) {
      return Response.json(
        { ok: false, error: "Issue description is required" },
        { status: 400 }
      );
    }

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const lineUserId = process.env.LINE_USER_ID;
    const notifyToken = process.env.LINE_NOTIFY_TOKEN;

    if (!channelAccessToken || !lineUserId) {
      return Response.json({ ok: false, error: "Missing LINE env" }, { status: 500 });
    }

    const jobId = typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : `JOB-${Date.now()}`;

    const now = new Date().toISOString();

    console.log("Saving to Supabase:", { job_id: jobId, full_name: fullName, device_id: deviceId });
    
    const { data: savedData, error: dbError } = await supabaseAdmin
      .from("repair_requests")
      .insert([
        {
          job_id: jobId,
          full_name: fullName,
          dept_name: deptName,
          dept_building: deptBuilding,
          dept_floor: deptFloor,
          device: device,
          device_id: deviceId,
          issue: issue,
          phone: phone,
          notes: notes,
          // record the submitter's IP address for auditing/troubleshooting
          request_ip: requesterIp,
          status: "pending",
          created_at: now,
          updated_at: now,
        }
      ])
      .select();

    if (dbError) {
      console.error("Supabase insert ERROR:", {
        code: dbError.code,
        message: dbError.message,
        details: dbError.details,
        hint: dbError.hint
      });
      return Response.json({ 
        ok: false, 
        error: `Database error: ${dbError.code} - ${dbError.message}`,
        details: dbError.details
      }, { status: 500 });
    }

    console.log("Supabase save SUCCESS:", savedData);

    const flexBubble = {
      type: "bubble" as const,
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "none" as const,
        paddingAll: "0px",
        contents: [
          {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
            paddingAll: "16px",
            backgroundColor: "#7c3aed",
            contents: [
              { type: "text" as const, text: "🏥 โรงพยาบาลนพรัตน์ราชธานี", color: "#ffffff", weight: "bold" as const, size: "lg" as const },
              { type: "text" as const, text: "🔧 แจ้งซ่อมใหม่", color: "#f3e8ff", size: "sm" as const, margin: "sm" as const }
            ]
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            margin: "md" as const,
            paddingAll: "16px",
            spacing: "md" as const,
            contents: [
              {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "sm" as const,
                contents: [
                  {
                    type: "box" as const,
                    layout: "horizontal" as const,
                    spacing: "sm" as const,
                    contents: [
                      { type: "text" as const, text: "👤 ผู้แจ้ง", color: "#666666", size: "sm" as const, flex: 1 },
                      { type: "text" as const, text: fullName || "-", color: "#111111", size: "sm" as const, align: "end" as const, flex: 2, weight: "bold" as const }
                    ]
                  },
                  {
                    type: "box" as const,
                    layout: "horizontal" as const,
                    spacing: "sm" as const,
                    contents: [
                      { type: "text" as const, text: "🏢 แผนก", color: "#666666", size: "sm" as const, flex: 1 },
                      { type: "text" as const, text: deptName || "-", color: "#111111", size: "sm" as const, align: "end" as const, flex: 2 }
                    ]
                  },
                  {
                    type: "box" as const,
                    layout: "horizontal" as const,
                    spacing: "sm" as const,
                    contents: [
                      { type: "text" as const, text: "📍 สถานที่", color: "#666666", size: "sm" as const, flex: 1 },
                      { type: "text" as const, text: `${deptBuilding || "-"} ชั้น ${deptFloor || "-"}`, color: "#111111", size: "sm" as const, align: "end" as const, flex: 2 }
                    ]
                  },
                  {
                    type: "box" as const,
                    layout: "horizontal" as const,
                    spacing: "sm" as const,
                    contents: [
                      { type: "text" as const, text: "💻 อุปกรณ์", color: "#666666", size: "sm" as const, flex: 1 },
                      { type: "text" as const, text: device || "-", color: "#111111", size: "sm" as const, align: "end" as const, flex: 2 }
                    ]
                  },
                  {
                    type: "box" as const,
                    layout: "horizontal" as const,
                    spacing: "sm" as const,
                    contents: [
                      { type: "text" as const, text: "🔢 หมายเลข", color: "#666666", size: "sm" as const, flex: 1 },
                      { type: "text" as const, text: deviceId || "-", color: "#111111", size: "sm" as const, align: "end" as const, flex: 2 }
                    ]
                  },
                  {
                    type: "box" as const,
                    layout: "horizontal" as const,
                    spacing: "sm" as const,
                    contents: [
                      { type: "text" as const, text: "📞 เบอร์ติดต่อ", color: "#666666", size: "sm" as const, flex: 1 },
                      { type: "text" as const, text: phone || "-", color: "#111111", size: "sm" as const, align: "end" as const, flex: 2 }
                    ]
                  }
                ]
              },
              { type: "separator" as const, margin: "md" as const },
              {
                type: "box" as const,
                layout: "vertical" as const,
                backgroundColor: "#fef3c7",
                paddingAll: "12px",
                cornerRadius: "md" as const,
                spacing: "sm" as const,
                contents: [
                  { type: "text" as const, text: "❗ อาการ / รายละเอียด", color: "#b45309", weight: "bold" as const, size: "sm" as const },
                  { type: "text" as const, text: issue || "-", color: "#78350f", size: "sm" as const, wrap: true }
                ]
              },
              {
                type: "box" as const,
                layout: "vertical" as const,
                backgroundColor: "#dbeafe",
                paddingAll: "12px",
                cornerRadius: "md" as const,
                spacing: "sm" as const,
                contents: [
                  { type: "text" as const, text: "📌 หมายเหตุ", color: "#0c4a6e", weight: "bold" as const, size: "sm" as const },
                  { type: "text" as const, text: notes || "(ไม่มี)", color: "#164e63", size: "sm" as const, wrap: true }
                ]
              }
            ]
          }
        ]
      }
    };

    const payload = {
      to: lineUserId,
      messages: [
        { type: "flex" as const, altText: `แจ้งซ่อมใหม่ - ${fullName}`, contents: flexBubble }
      ]
    };

    let pushSent = false;
    let notifySent = false;

    try {
      const pushRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${channelAccessToken}` },
        body: JSON.stringify(payload),
      });

      if (pushRes.ok) {
        pushSent = true;
        console.log("[LINE] Flex message sent successfully");
      } else {
        console.error("[LINE] Push failed:", pushRes.status);
      }
    } catch (err) {
      console.error("[LINE] Push exception:", err);
    }

    if (!pushSent && notifyToken) {
      const summaryText =
        `🛠️ แจ้งซ่อมใหม่\n\n` +
        `👤 ผู้แจ้ง: ${fullName || "-"}\n` +
        `🏢 แผนก: ${deptName || "-"}\n` +
        `💻 อุปกรณ์: ${device || "-"}\n` +
        `📞 เบอร์: ${phone || "-"}\n` +
        `📝 อาการ: ${issue || "-"}`;

      try {
        const notifyRes = await fetch("https://notify-api.line.me/api/notify", {
          method: "POST",
          headers: { Authorization: `Bearer ${notifyToken}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ message: summaryText }),
        });
        if (notifyRes.ok) {
          notifySent = true;
          console.log("[LINE Notify] Notification sent successfully");
        }
      } catch (err) {
        console.error("[LINE Notify] Exception:", err);
      }
    }

    return Response.json({
      ok: true,
      jobId,
      dbSaved: !!savedData,
      pushSent,
      notifySent,
      requesterIp,
    });
  } catch (err) {
    console.error("POST error:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}