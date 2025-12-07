// Send SMS after verifying destination number
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

const client = twilio(accountSid, authToken);

async function sendSMS() {
  console.log('=== Sending SMS with Trial Account ===\n');
  console.log('⚠️  IMPORTANT: Make sure +17708141313 is verified at:');
  console.log('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified\n');

  console.log('Attempting to send...');
  console.log('From: +14843263161 (your Twilio number)');
  console.log('To: +17708141313 (must be verified for trial accounts)');
  console.log('Message: "this is a cursor teest of Pruuf2 - I hope this freaking works"\n');

  try {
    const message = await client.messages.create({
      body: 'this is a cursor teest of Pruuf2 - I hope this freaking works',
      from: '+14843263161',
      to: '+17708141313'
    });

    console.log('🎉 SUCCESS! SMS sent successfully!');
    console.log('\nMessage Details:');
    console.log('  Message SID:', message.sid);
    console.log('  Status:', message.status);
    console.log('  From:', message.from);
    console.log('  To:', message.to);
    console.log('  Price:', message.price || 'Free (trial)', message.priceUnit || '');
    console.log('\n✅ Your Twilio configuration is working correctly!');
    console.log('   Account SID: ACfe25e9146c7b640920b99b66378e4115');
    console.log('   Auth Token: faa9c608b79b104b00ae559d4f7e42c7');
    console.log('   Phone Number: +14843263161');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);

    if (error.code === 21606) {
      console.error('\n🔴 STILL FAILING - Number configuration issue');
      console.error('   Possible causes:');
      console.error('   1. Number is VERY new (just purchased) - wait 10-15 minutes');
      console.error('   2. Number might be voice-only, not SMS-capable');
      console.error('   3. Trial account glitch');
      console.error('\n   Try contacting Twilio support if this persists.');
    } else if (error.code === 21211) {
      console.error('\n🔴 Destination number not verified!');
      console.error('   YOU MUST verify +17708141313 at:');
      console.error('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    } else if (error.code === 21608) {
      console.error('\n🔴 Destination number not verified for trial account!');
      console.error('   Verify +17708141313 at:');
      console.error('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }
  }
}

sendSMS();
