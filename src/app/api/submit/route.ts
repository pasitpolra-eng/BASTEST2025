import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(String(url), String(serviceKey), { auth: { persistSession: false } });

const createCompactInfo = (icon: string, label: string, value: string) => ({
  type: "box" as const,
  layout: "horizontal" as const,
  spacing: "sm" as const,
  contents: [
    {
      type: "box" as const,
      layout: "horizontal" as const,
      contents: [
        { type: "text" as const, text: icon, color: "#94a3b8", size: "sm" as const, flex: 0, align: "center" as const },
        { type: "text" as const, text: label, color: "#475569", size: "xs" as const, weight: "bold" as const, flex: 1, margin: "sm" as const, align: "start" as const }
      ],
      flex: 2
    },
    {
      type: "text" as const,
      text: value,
      color: "#1e293b",
      size: "sm" as const,
      wrap: true,
      flex: 3,
      align: "end" as const
    }
  ]
});

export async function POST(req: NextRequest) {
  try {
    const {
      fullName = "", deptName = "", deptBuilding = "", deptFloor = "",
      device = "", deviceId = "", issue = "", phone = "", notes = "",
    } = await req.json();

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
    const appUrl = process.env.APP_URL ?? "https://for-reporting-repairs-to-nopparat.onrender.com/";

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

    const summaryText =
      `🛠️ แจ้งซ่อมจากระบบออนไลน์\n\n` +
      `👤 ผู้แจ้ง: ${fullName || "-"}
       🏢 แผนก: ${deptName || "-"} (${deptBuilding || "-"} ชั้น ${deptFloor || "-"})
       💻 อุปกรณ์: ${device || "-"} (${deviceId || "-"})
       📞 ติดต่อ: ${phone || "-"}
       📝 อาการ: ${issue || "-"}
       📌 หมายเหตุ: ${notes || "-"}
       🆔 Job ID: ${jobId}`;

    const flexBubble = {
      type: "bubble" as const,
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        paddingAll: "0px",
        contents: [
          {
            type: "box" as const, layout: "horizontal" as const, backgroundColor: "#7c3aed", paddingAll: "14px",
            contents: [
              { type: "text" as const, text: "🏥", color: "#ffffff", size: "md" as const, flex: 0 },
              { type: "text" as const, text: "โรงพยาบาลนพรัตน์ราชธานี\n🛠️ แจ้งซ่อมใหม่", weight: "bold" as const, color: "#ffffff", size: "sm" as const, wrap: true, margin: "md" as const }
            ]
          },
          {
            type: "box" as const, layout: "vertical" as const, paddingAll: "14px", spacing: "sm" as const,
            contents: [
              { type: "text" as const, text: "🆔 Job ID", weight: "bold" as const, color: "#7c3aed", size: "sm" as const },
              { type: "text" as const, text: jobId, color: "#333333", size: "md" as const, wrap: true }
            ]
          },
          { type: "separator" as const, margin: "none" as const, color: "#f3f4f6" },
          {
            type: "box" as const, layout: "vertical" as const, paddingAll: "14px", spacing: "lg" as const,
            contents: [
              createCompactInfo("👤", "ผู้แจ้ง", fullName || "-"),
              { type: "separator" as const, margin: "md" as const, color: "#f3f4f6" },
              createCompactInfo("🏢", "แผนก", deptName || "-"),
              { type: "separator" as const, margin: "md" as const, color: "#f3f4f6" },
              createCompactInfo("📍", "สถานที่", `${deptBuilding || "-"} ชั้น ${deptFloor || "-"}`),
              { type: "separator" as const, margin: "md" as const, color: "#f3f4f6" },
              createCompactInfo("💻", "อุปกรณ์ที่เสีย", device || "-"),
              { type: "separator" as const, margin: "md" as const, color: "#f3f4f6" },
              createCompactInfo("🔢", "หมายเลขเครื่อง", deviceId || "-"),
              { type: "separator" as const, margin: "md" as const, color: "#f3f4f6" },
              createCompactInfo("📞", "เบอร์ติดต่อ", phone || "-"),
            ]
          },
          {
            type: "box" as const, layout: "vertical" as const, backgroundColor: "#fef3c7", paddingAll: "14px",
            contents: [
              { type: "text" as const, text: "❗ อาการ / รายละเอียด", weight: "bold" as const, color: "#b45309", size: "sm" as const },
              { type: "text" as const, text: issue ? (issue.length > 300 ? issue.slice(0, 297) + "..." : issue) : "-", color: "#78350f", size: "sm" as const, wrap: true, margin: "md" as const }
            ]
          },
          {
            type: "box" as const, layout: "vertical" as const, backgroundColor: "#dbeafe", paddingAll: "14px",
            contents: [
              { type: "text" as const, text: "📌 หมายเหตุ", weight: "bold" as const, color: "#0c4a6e", size: "sm" as const },
              { type: "text" as const, text: notes ? (notes.length > 300 ? notes.slice(0, 297) + "..." : notes) : "(ไม่มี)", color: "#164e63", size: "sm" as const, wrap: true, margin: "md" as const }
            ]
          }
        ]
      },
      footer: {
        type: "box" as const, layout: "vertical" as const, spacing: "sm" as const,
        contents: [
          { type: "button" as const, style: "primary" as const, color: "#16a34a", action: { type: "postback" as const, label: "✓ ยืนยันรับบริการ (Accept)", data: `approve_job:${jobId}` } },
          { type: "button" as const, style: "secondary" as const, color: "#dc2626", action: { type: "postback" as const, label: "✗ ไม่สามารถดำเนินการได้ (Reject)", data: `reject_job:${jobId}` } },
          { type: "button" as const, style: "link" as const, color: "#0369a1", action: { type: "uri" as const, label: "🌐 ตรวจสอบสถานะการบริการ", uri: `${appUrl.replace(/\/+$/, "")}/status?jobId=${encodeURIComponent(jobId)}` } }
        ],
        backgroundColor: "#f1f5f9", paddingAll: "12px"
      }
    };

    const payload = {
      to: lineUserId,
      messages: [
        { type: "flex" as const, altText: `แจ้งซ่อม Job ${jobId}`, contents: flexBubble }
      ]
    };

    let pushSent = false;
    let pushStatus: number | null = null;
    let pushError: string | null = null;

    try {
      const pushRes = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${channelAccessToken}` },
        body: JSON.stringify(payload),
      });

      pushStatus = pushRes.status;
      if (!pushRes.ok) {
        pushError = `LINE push failed: ${pushStatus}`;
        console.error(pushError);
      } else {
        pushSent = true;
      }
    } catch (err) {
      pushError = String(err);
      console.error("LINE push exception:", err);
    }

    let notifySent = false;

    if (!pushSent && notifyToken) {
      try {
        const notifyRes = await fetch("https://notify-api.line.me/api/notify", {
          method: "POST",
          headers: { Authorization: `Bearer ${notifyToken}`, "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ message: summaryText }),
        });
        if (notifyRes.ok) {
          notifySent = true;
        }
      } catch (err) {
        console.error("LINE Notify exception:", err);
      }
    }

    return Response.json({
      ok: true,
      jobId,
      dbSaved: !!savedData,
      pushSent,
      notifySent,
    });
  } catch (err) {
    console.error("POST error:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}