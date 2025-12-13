import { createClient } from "@supabase/supabase-js";

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

interface WebhookEvent {
  uuid: string;
  created_at: string;
  body?: string;
  content?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export async function GET() {
  try {
    const webhookUrl = process.env.WEBHOOK_SITE_URL;

    if (!webhookUrl) {
      console.warn("⚠️ WEBHOOK_SITE_URL not configured");
      return new Response(
        JSON.stringify({ error: "WEBHOOK_SITE_URL not configured" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const webhookId = webhookUrl.split("/").pop();

    if (!webhookId) {
      return new Response(
        JSON.stringify({ error: "Invalid WEBHOOK_SITE_URL format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("🔄 Syncing webhook events from webhook.site...");

    const apiUrl = `https://webhook.site/token/${webhookId}/requests?sorting=-created_at`;
    console.log(`🔗 Fetching from: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) {
      console.error(`❌ webhook.site error: ${res.status}`);
      return new Response(
        JSON.stringify({ error: "Failed to fetch webhook events" }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const webhookEventsData = await res.json();
    console.log(`📥 Raw response type: ${typeof webhookEventsData}`);

    let webhookEvents: WebhookEvent[] = [];
    
    if (Array.isArray(webhookEventsData)) {
      webhookEvents = webhookEventsData;
    } else if (webhookEventsData.data && Array.isArray(webhookEventsData.data)) {
      webhookEvents = webhookEventsData.data;
    } else if (webhookEventsData.requests && Array.isArray(webhookEventsData.requests)) {
      webhookEvents = webhookEventsData.requests;
    }

    console.log(`📥 Retrieved ${webhookEvents.length} webhook events`);

    if (webhookEvents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: "No webhook events to process",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    let processed = 0;
    const updates: Array<{ jobId: string; action: string; status: string }> = [];
    const skipped: Array<{ jobId: string; reason: string }> = [];

    // ประมวลผล webhook events
    for (const event of webhookEvents) {
      const eventId = event.uuid || event.id;
      if (!eventId) {
        console.warn("⚠️ Event without ID, skipping");
        continue;
      }

      const bodyText = event.body || event.content || event.raw_body || "";

      if (!bodyText) {
        console.warn(`⚠️ Event ${eventId} has no body, skipping`);
        continue;
      }

      try {
        console.log(`\n🔍 Processing event ${eventId}`);

        let bodyData;
        if (typeof bodyText === "string") {
          bodyData = JSON.parse(bodyText);
        } else {
          bodyData = bodyText;
        }

        const lineEvents = bodyData.events || [];
        console.log(`   Found ${lineEvents.length} LINE events`);

        for (const lineEvent of lineEvents) {
          if (lineEvent.type !== "postback") continue;

          const postbackData = lineEvent.postback?.data || "";
          const userId = lineEvent.source?.userId || "";

          console.log(`   Postback: ${postbackData}`);

          // ตรวจสอบ approve_job
          if (postbackData.startsWith("approve_job:")) {
            const jobId = postbackData.split("approve_job:")[1]?.trim();

            if (jobId) {
              console.log(`   🔍 Approving job: ${jobId}`);

              // ตรวจสอบว่า job มีอยู่จริง
              const { data: job, error: findErr } = await supabaseAdmin
                .from("repair_requests")
                .select("*")
                .eq("job_id", jobId)
                .maybeSingle();

              if (findErr) {
                console.error(`   ❌ Find error: ${findErr.message}`);
                continue;
              }

              if (!job) {
                console.warn(`   ⚠️ Job ${jobId} not found`);
                skipped.push({ jobId, reason: "Job not found" });
                continue;
              }

              // ✅ ตรวจสอบสถานะ - ถ้าไม่ใช่ pending ให้ skip
              if (job.status !== "pending") {
                console.log(`   ⏭️ Job ${jobId} already has status: ${job.status} (skipping)`);
                skipped.push({ jobId, reason: `Already ${job.status}` });
                continue;
              }

              console.log(`   📝 Updating from ${job.status} to in-progress`);

              const { error: updateErr } = await supabaseAdmin
                .from("repair_requests")
                .update({
                  status: "in-progress",
                  handler_id: userId,
                  handler_tag: userId,
                  updated_at: new Date().toISOString(),
                })
                .eq("job_id", jobId);

              if (updateErr) {
                console.error(`   ❌ Update failed: ${updateErr.message}`);
              } else {
                console.log(`   ✅ Job ${jobId} updated to in-progress`);
                updates.push({ jobId, action: "approve", status: "in-progress" });
                processed++;
              }
            }
          }

          // ตรวจสอบ reject_job
          if (postbackData.startsWith("reject_job:")) {
            const jobId = postbackData.split("reject_job:")[1]?.trim();

            if (jobId) {
              console.log(`   🔍 Rejecting job: ${jobId}`);

              const { data: job, error: findErr } = await supabaseAdmin
                .from("repair_requests")
                .select("*")
                .eq("job_id", jobId)
                .maybeSingle();

              if (findErr) {
                console.error(`   ❌ Find error: ${findErr.message}`);
                continue;
              }

              if (!job) {
                console.warn(`   ⚠️ Job ${jobId} not found`);
                skipped.push({ jobId, reason: "Job not found" });
                continue;
              }

              // ✅ ตรวจสอบสถานะ - ถ้าไม่ใช่ pending ให้ skip
              if (job.status !== "pending") {
                console.log(`   ⏭️ Job ${jobId} already has status: ${job.status} (skipping)`);
                skipped.push({ jobId, reason: `Already ${job.status}` });
                continue;
              }

              console.log(`   📝 Updating from ${job.status} to rejected`);

              const { error: updateErr } = await supabaseAdmin
                .from("repair_requests")
                .update({
                  status: "rejected",
                  handler_id: userId,
                  handler_tag: userId,
                  updated_at: new Date().toISOString(),
                })
                .eq("job_id", jobId);

              if (updateErr) {
                console.error(`   ❌ Update failed: ${updateErr.message}`);
              } else {
                console.log(`   ✅ Job ${jobId} updated to rejected`);
                updates.push({ jobId, action: "reject", status: "rejected" });
                processed++;
              }
            }
          }
        }
      } catch (err) {
        console.error(`❌ Error parsing event ${eventId}:`, err);
      }
    }

    console.log(`\n✅ Sync complete: ${processed} updated, ${skipped.length} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        skipped,
        updates,
        message: `Processed ${processed} webhook events, skipped ${skipped.length}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Error syncing webhook events:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}