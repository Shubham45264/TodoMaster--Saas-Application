const { Webhook } = require('svix');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Read .env.local to get WEBHOOK_SECRET
const envLocalPath = path.join(__dirname, '.env.local');
const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
const match = envLocalContent.match(/WEBHOOK_SECRET=([^\s]+)/);
if (!match) {
  console.error("WEBHOOK_SECRET not found in .env.local");
  process.exit(1);
}
const WEBHOOK_SECRET = match[1];

const payload = {
  data: {
    id: "user_test_" + Date.now(),
    email_addresses: [
      {
        id: "email_test_" + Date.now(),
        email_address: "testuser_" + Date.now() + "@example.com"
      }
    ],
    primary_email_address_id: "email_test_" + Date.now() // This will be set below
  },
  type: "user.created"
};

// Ensure primary_email_address_id matches the one in email_addresses
payload.data.primary_email_address_id = payload.data.email_addresses[0].id;

const body = JSON.stringify(payload);
const wh = new Webhook(WEBHOOK_SECRET);

// Generate svix headers
const now = new Date();
const timestampStr = Math.floor(now.getTime() / 1000).toString();
const svixId = "msg_test_" + Date.now();
const svixSignature = wh.sign(svixId, now, body);
console.log('Sending webhook with:', { svixId, timestampStr, svixSignature });

const postOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhook/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'svix-id': svixId,
    'svix-timestamp': timestampStr,
    'svix-signature': svixSignature,
  }
};

const req = http.request(postOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response Body:', data);
    if (res.statusCode === 200) {
      console.log('✅ Webhook test passed!');
    } else {
      console.log('❌ Webhook test failed.');
    }
  });
});

req.on('error', (error) => {
  console.error('Error sending request:', error);
});

req.write(body);
req.end();
