// src/app/api/webhook-logs/route.ts
interface WebhookRequest {
  uuid: string;
  created_at: string;
  method: string;
  url: string;
  body?: string;
  headers?: Record<string, string | string[]>;
  status_code: number;
  query?: Record<string, string | string[]>;
}

export async function GET() {
  try {
    const webhookUrl = process.env.WEBHOOK_SITE_URL;
    
    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: "WEBHOOK_SITE_URL not configured" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ดึง UUID จาก URL
    const webhookId = webhookUrl.split('/').pop();
    
    if (!webhookId) {
      return new Response(
        JSON.stringify({ error: "Invalid WEBHOOK_SITE_URL format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`📡 Fetching webhook logs from webhook.site/${webhookId}`);

    // ลอง API endpoint ใหม่
    const apiUrl = `https://webhook.site/token/${webhookId}/requests?sorting=-created_at`;
    console.log(`🔗 API URL: ${apiUrl}`);

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });

    console.log(`📊 Response status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ webhook.site error: ${res.status} ${res.statusText}`);
      console.error(`❌ Response: ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to fetch webhook logs (${res.status})`,
          details: errorText,
        }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const responseText = await res.text();
    console.log(`📥 Raw response: ${responseText.substring(0, 200)}...`);

    let data: WebhookRequest[] | WebhookRequest;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("❌ Failed to parse JSON:", e);
      return new Response(
        JSON.stringify({ 
          error: "Invalid JSON response from webhook.site",
          rawResponse: responseText.substring(0, 500),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ Retrieved ${Array.isArray(data) ? data.length : 1} webhook request(s)`);

    // แปลงข้อมูลให้อ่านง่ายขึ้น
    const requests = Array.isArray(data) ? data : [data];
    const formatted = requests.map((request: WebhookRequest) => ({
      id: request.uuid,
      timestamp: request.created_at,
      method: request.method,
      url: request.url,
      body: request.body ? 
        (typeof request.body === 'string' ? JSON.parse(request.body) : request.body) 
        : null,
      headers: request.headers,
      statusCode: request.status_code,
      query: request.query,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        count: formatted.length,
        webhookId: webhookId,
        requests: formatted,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Error fetching webhook logs:", err);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}