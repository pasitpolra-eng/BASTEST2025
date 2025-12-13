import crypto from 'crypto';

async function testAcceptWorkflow() {
  const SECRET = process.env.LINE_CHANNEL_SECRET;
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
  
  if (!SECRET) {
    console.error('❌ LINE_CHANNEL_SECRET not set');
    process.exit(1);
  }

  // Generate a test job ID
  const testJobId = 'test-' + Date.now();
  console.log(`\n🔄 Testing Accept Workflow`);
  console.log(`   Job ID: ${testJobId}`);
  console.log(`   Webhook URL: ${BASE_URL}/api/Line/interactions`);

  // Create postback event payload
  const payload = {
    events: [
      {
        type: 'postback',
        message: { type: 'text', text: 'Accept' },
        replyToken: 'test-reply-token',
        source: { type: 'user', userId: 'U2183392e75123ee4e011ccec536e2334' },
        timestamp: Date.now(),
        postback: {
          data: `approve_job:${testJobId}`,
        },
      },
    ],
  };

  const bodyString = JSON.stringify(payload);
  
  // Generate HMAC signature
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(bodyString)
    .digest('base64');

  console.log(`\n📝 Payload:`);
  console.log(JSON.stringify(payload, null, 2));
  console.log(`\n🔐 Signature: ${signature}`);

  try {
    console.log(`\n📤 Sending to ${BASE_URL}/api/Line/interactions`);
    
    const response = await fetch(`${BASE_URL}/api/Line/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-line-signature': signature,
      },
      body: bodyString,
    });

    const responseText = await response.text();
    
    console.log(`\n✅ Response Status: ${response.status}`);
    console.log(`📥 Response Body: ${responseText}`);

    if (response.ok) {
      console.log(`\n✨ SUCCESS! Job ${testJobId} should now be marked as 'in-progress'`);
      console.log(`\n📌 Next steps:`);
      console.log(`   1. Open http://localhost:3000/status`);
      console.log(`   2. Search for job ID: ${testJobId}`);
      console.log(`   3. Status should show: "🔧 ยืนยันรับงานแล้ว"`);
    } else {
      console.error(`\n❌ FAILED! Status: ${response.status}`);
    }
  } catch (err) {
    console.error(`\n❌ Error:`, err);
  }
}

testAcceptWorkflow();