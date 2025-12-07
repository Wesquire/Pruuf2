// Send SMS using Twilio Trial Account
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

const client = twilio(accountSid, authToken);

async function sendSMS() {
  console.log('=== Twilio Trial Account SMS Test ===\n');

  // Try different "from" numbers
  const fromNumbers = [
    '+14843263161',  // Original from .env
    '+15005550006',  // Twilio magic number for testing
  ];

  for (const fromNumber of fromNumbers) {
    try {
      console.log(`Attempting with FROM: ${fromNumber}`);
      console.log('TO: +17708141313');
      console.log('Message: "this is sent from claude"\n');

      const message = await client.messages.create({
        body: 'this is sent from claude',
        from: fromNumber,
        to: '+17708141313'
      });

      console.log('✅ SUCCESS! SMS sent!');
      console.log('Message SID:', message.sid);
      console.log('Status:', message.status);
      console.log('From:', message.from);
      console.log('To:', message.to);
      console.log('Price:', message.price, message.priceUnit);
      process.exit(0);

    } catch (error) {
      console.log('❌ Failed with this number');
      console.log('Error:', error.message);
      console.log('Code:', error.code);
      console.log('');
    }
  }

  console.log('\n=== All attempts failed ===');
  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
  console.log('2. Check if you have any active phone numbers');
  console.log('3. If yes, copy the phone number and update TWILIO_PHONE_NUMBER');
  console.log('4. If no, you need to get a phone number:');
  console.log('   - Trial accounts get a free phone number');
  console.log('   - Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search');
  console.log('   - Get a phone number with SMS capabilities');
  console.log('\n5. IMPORTANT for Trial Accounts:');
  console.log('   - You can only send to VERIFIED numbers');
  console.log('   - Verify +17708141313 at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
}

sendSMS();
