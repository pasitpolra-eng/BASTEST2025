(async () => {
  // dynamic imports to avoid `require()` and support Node <18 gracefully
  const cryptoMod = await import('crypto').then(m => m.default || m);
  let fetchFn = global.fetch;
  if (!fetchFn) {
    try {
      const mod = await import('node-fetch');
      fetchFn = (mod && (mod.default || mod));
    } catch {
      console.error("Install node-fetch or use Node18+");
      process.exit(1);
    }
  }

  const url = process.argv[2] || "http://localhost:3000/api/Line/interactions";
  const action = (process.argv[3] || "approve").toLowerCase();
  const jobId = process.argv[4] || "TEST-JOB-123";
  const channelSecret = process.env.LINE_CHANNEL_SECRET || "<YOUR_SECRET>";
  const postbackData = (action === "reject") ? `reject_job:${jobId}` : `approve_job:${jobId}`;
  const body = {
    destination: "U_TEST_DEST",
    events: [{
      type: "postback",
      postback: { data: postbackData },
      webhookEventId: "TEST_EVENT_ID",
      deliveryContext: { isRedelivery: false },
      timestamp: Date.now(),
      source: { type: "user", userId: "U_TEST_USER" },
      replyToken: "TEST_REPLY_TOKEN",
      mode: "active"
    }]
  };

  const bodyText = JSON.stringify(body);
  const signature = cryptoMod.createHmac("sha256", channelSecret).update(bodyText).digest("base64");
  console.log("Posting to:", url);
  console.log("x-line-signature:", signature);
  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-line-signature": signature },
      body: bodyText
    });
    console.log("status:", res.status);
    console.log("body:", await res.text());
  } catch (err) {
    console.error("Request failed:", err);
  }
})();
