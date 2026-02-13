import { NextResponse } from "next/server";

export async function POST() {
  const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const lineUserId = process.env.LINE_USER_ID;

  console.log("[TEST-LINE] LINE_CHANNEL_ACCESS_TOKEN:", lineAccessToken ? "✓ Set" : "✗ Missing");
  console.log("[TEST-LINE] LINE_USER_ID:", lineUserId ? `✓ Set (${lineUserId})` : "✗ Missing");

  if (!lineAccessToken) {
    return NextResponse.json(
      { error: "❌ LINE_CHANNEL_ACCESS_TOKEN is missing in environment variables" },
      { status: 400 }
    );
  }

  if (!lineUserId) {
    return NextResponse.json(
      { error: "❌ LINE_USER_ID is missing in environment variables" },
      { status: 400 }
    );
  }

  try {
    // Create simplified Flex Message
    const flexMessage = {
      type: "flex",
      altText: "✅ งานเสร็จสิ้น",
      contents: {
        type: "bubble",
        header: {
          type: "box",
          layout: "vertical",
          backgroundColor: "#00D084",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: "✅ งานเสร็จสิ้น",
              size: "lg",
              weight: "bold",
              color: "#FFFFFF",
            },
            {
              type: "text",
              text: "โรงพยาบาลบางพระยานี",
              size: "sm",
              color: "#FFFFFF",
            },
          ],
        },
        body: {
          type: "box",
          layout: "vertical",
          spacing: "lg",
          paddingAll: "md",
          contents: [
            {
              type: "box",
              layout: "vertical",
              spacing: "md",
              contents: [
                {
                  type: "text",
                  text: "👤 ผู้แจ้ง",
                  size: "xs",
                  color: "#666666",
                  weight: "bold",
                },
                {
                  type: "text",
                  text: "ทดสอบระบบ",
                  size: "sm",
                  weight: "bold",
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              spacing: "lg",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "🏥 แผนก",
                      size: "xs",
                      color: "#666666",
                      weight: "bold",
                    },
                    {
                      type: "text",
                      text: "ไอทีสนับสนุน",
                      size: "sm",
                      wrap: true,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "📍 สถานที่",
                      size: "xs",
                      color: "#666666",
                      weight: "bold",
                    },
                    {
                      type: "text",
                      text: "ชั้น 3",
                      size: "sm",
                    },
                  ],
                },
              ],
            },
            {
              type: "box",
              layout: "horizontal",
              spacing: "lg",
              contents: [
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "💻 อุปกรณ์",
                      size: "xs",
                      color: "#666666",
                      weight: "bold",
                    },
                    {
                      type: "text",
                      text: "คอมพิวเตอร์",
                      size: "sm",
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  flex: 1,
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "📞 เบอร์",
                      size: "xs",
                      color: "#666666",
                      weight: "bold",
                    },
                    {
                      type: "text",
                      text: "7671",
                      size: "sm",
                    },
                  ],
                },
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          backgroundColor: "#FFFACD",
          paddingAll: "md",
          contents: [
            {
              type: "text",
              text: "⚠️ ปัญหา",
              size: "xs",
              color: "#666666",
              weight: "bold",
            },
            {
              type: "text",
              text: "เบิดเครื่องไม่ติด",
              size: "sm",
              wrap: true,
              color: "#333333",
            },
          ],
        },
      },
    };

    console.log("[TEST-LINE] Sending Flex Message to:", lineUserId);

    const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lineAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [flexMessage],
      }),
    });

    const responseText = await lineRes.text();
    console.log("[TEST-LINE] Response status:", lineRes.status);
    console.log("[TEST-LINE] Response body:", responseText);

    if (lineRes.ok) {
      return NextResponse.json({
        ok: true,
        message: "Flex Message sent successfully to LINE!",
        userId: lineUserId,
        status: lineRes.status,
      });
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: `❌ Failed to send LINE message (${lineRes.status})`,
          details: responseText,
          userId: lineUserId,
        },
        { status: lineRes.status }
      );
    }
  } catch (err) {
    console.error("[TEST-LINE] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: `❌ Error sending LINE message: ${String(err)}`,
      },
      { status: 500 }
    );
  }
}
