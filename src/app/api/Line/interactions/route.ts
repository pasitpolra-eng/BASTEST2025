import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client with service role
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get("x-line-signature") || "";
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminId = process.env.LINE_USER_ID;
    const webhookSiteUrl = process.env.WEBHOOK_SITE_URL;

    console.log("🔵 Webhook received");
    console.log("✓ SUPABASE_URL:", process.env.SUPABASE_URL ? "✓ Set" : "✗ Missing");
    console.log("✓ SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing");
    console.log("✓ WEBHOOK_SITE_URL:", webhookSiteUrl ? "✓ Set" : "✗ Missing");

    if (!channelSecret || !channelAccessToken) {
      console.error("❌ Missing LINE env");
      return new Response("Missing LINE env", { status: 500 });
    }

    // --- Verify HMAC-SHA256 ---
    const hash = crypto
      .createHmac("sha256", channelSecret)
      .update(bodyText)
      .digest("base64");

    if (hash !== signature) {
      console.warn("❌ Invalid signature. Expected:", signature, "Got:", hash);
      return new Response("Invalid signature", { status: 401 });
    }

    console.log("✅ Signature verified");

    const body = JSON.parse(bodyText);
    const events = body.events ?? [];

    console.log(`📋 Processing ${events.length} events`);

    // 📡 Send to webhook.site for testing
    if (webhookSiteUrl) {
      try {
        console.log("📡 Forwarding to webhook.site...");
        const webhookRes = await fetch(webhookSiteUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            events: events,
            signature: signature,
          }),
        });
        console.log("✅ webhook.site received:", webhookRes.status);
      } catch (err) {
        console.error("⚠️ Failed to send to webhook.site:", err);
      }
    }

    for (const event of events) {
      if (event.type !== "postback") {
        console.log("⏭️ Skipping non-postback event:", event.type);
        continue;
      }

      const data = event.postback?.data ?? "";
      const userId = event.source?.userId ?? "";
      const replyToken = event.replyToken;

      console.log("📥 Postback received:", { data, userId, replyToken });

      // ---------------------------
      //  HANDLE APPROVE JOB
      // ---------------------------
      if (data.startsWith("approve_job:")) {
        const jobId = data.split("approve_job:")[1]?.trim();
        const now = new Date().toISOString();

        console.log("Approving job:", jobId);

        // Check record exist
        const { data: job, error: findErr } = await supabaseAdmin
          .from("repair_requests")
          .select("*")
          .eq("job_id", jobId)
          .maybeSingle();

        if (findErr) {
          console.error("❌ Find error:", findErr);
        }

        if (!job) {
          console.error("❌ Job not found:", jobId);
          await lineReply(replyToken, `ไม่พบงานหมายเลข ${jobId}`);
          continue;
        }

        console.log("✅ Job found. Current status:", job.status);
        console.log("📝 Updating to in-progress...");

        // Update
        const { data: updated, error } = await supabaseAdmin
          .from("repair_requests")
          .update({
            status: "in-progress",
            handler_id: userId,
            handler_tag: userId,
            updated_at: now,
          })
          .eq("job_id", jobId)
          .select()
          .single();

        if (error) {
          console.error("❌ Supabase update FAIL:", error.message, error.code);
          await lineReply(replyToken, `อัปเดตสถานะไม่สำเร็จ ❌ (${error.message})`);
          continue;
        }

        console.log("✅ Job approved! New status:", updated?.status);
        await lineReply(replyToken, `รับงานหมายเลข ${jobId} เรียบร้อยแล้ว ✔`);

        if (adminId) {
          await linePush(adminId, `✅ งาน ${jobId} รับโดย ${userId}`);
        }
      }

      if (data.startsWith("reject_job:")) {
        const jobId = data.split("reject_job:")[1]?.trim();
        const now = new Date().toISOString();

        console.log("🔍 Rejecting job:", jobId);

        const { data: job, error: findErr } = await supabaseAdmin
          .from("repair_requests")
          .select("*")
          .eq("job_id", jobId)
          .maybeSingle();

        if (findErr) {
          console.error("❌ Find error:", findErr);
        }

        if (!job) {
          console.error("❌ Job not found:", jobId);
          await lineReply(replyToken, `ไม่พบงานหมายเลข ${jobId}`);
          continue;
        }

        console.log("✅ Job found. Current status:", job.status);
        console.log("📝 Updating to rejected...");

        // Update
        const { data: updated, error } = await supabaseAdmin
          .from("repair_requests")
          .update({
            status: "rejected",
            handler_id: userId,
            handler_tag: userId,
            updated_at: now,
          })
          .eq("job_id", jobId)
          .select()
          .single();

        if (error) {
          console.error("❌ Supabase update FAIL:", error.message, error.code);
          await lineReply(replyToken, `ปฏิเสธงานไม่สำเร็จ ❌ (${error.message})`);
          continue;
        }

        console.log("✅ Job rejected! New status:", updated?.status);
        await lineReply(replyToken, `ปฏิเสธงานหมายเลข ${jobId} เรียบร้อยแล้ว`);

        if (adminId) {
          await linePush(adminId, `❌ งาน ${jobId} ปฏิเสธโดย ${userId}`);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response("Internal error", { status: 500 });
  }
}

// LINE Reply API
async function lineReply(replyToken: string, message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("⚠️ No LINE token for reply");
    return;
  }

  try {
    console.log("📤 Sending LINE reply:", message);
    const res = await fetch("https://api.line.messaging.com/v2/bot/message/reply", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text: message }],
      }),
    });

    console.log("📬 LINE reply status:", res.status);
    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ LINE reply failed:", res.status, errText);
    } else {
      console.log("✅ LINE reply sent successfully");
    }
  } catch (err) {
    console.error("❌ LINE reply error:", err);
  }
}

// LINE Push API
async function linePush(userId: string, message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn("⚠️ No LINE token for push");
    return;
  }

  try {
    console.log("📤 Sending LINE push to", userId, ":", message);
    const res = await fetch("https://api.line.messaging.com/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: "text", text: message }],
      }),
    });

    console.log("📬 LINE push status:", res.status);
    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ LINE push failed:", res.status, errText);
    } else {
      console.log("✅ LINE push sent successfully");
    }
  } catch (err) {
    console.error("❌ LINE push error:", err);
  }
}
