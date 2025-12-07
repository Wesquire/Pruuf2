// Final test SMS with verified number
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';
const fromNumber = '+14843263161';
const toNumber = '+17708141313';
const message = 'this is a cursor teest of Pruuf2 - I hope this freaking works';

const client = twilio(accountSid, authToken);

async function sendTestSMS() {
  console.log('=== Twilio SMS Test ===\n');
  console.log('From:', fromNumber);
  console.log('To:', toNumber);
  console.log('Message:', message);
  console.log('\nSending...\n');

  try {
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber
    });

    console.log('✅ SUCCESS! SMS sent!');
    console.log('\nMessage Details:');
    console.log('  SID:', result.sid);
    console.log('  Status:', result.status);
    console.log('  From:', result.from);
    console.log('  To:', result.to);
    console.log('  Date Created:', result.dateCreated);
    console.log('  Price:', result.price || 'N/A', result.priceUnit || '');

    if (result.status === 'queued' || result.status === 'sent') {
      console.log('\n🎉 Message is being delivered!');
    }

  } catch (error) {
    console.error('\n❌ ERROR sending SMS:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Status:', error.status);

    if (error.code === 21606) {
      console.error('\n💡 The "From" number (+14843263161) is not valid in your account.');
      console.error('   Trying with Twilio test number instead...\n');

      // Retry with test number
      try {
        const testResult = await client.messages.create({
          body: message,
          from: '+15005550006',
          to: toNumber
        });

        console.log('✅ SUCCESS with test number!');
        console.log('  SID:', testResult.sid);
        console.log('  Status:', testResult.status);
        console.log('\n⚠️  Note: Used Twilio test number (+15005550006) instead of your number.');
        console.log('   Your number (+14843263161) may need to be purchased/activated.');

      } catch (retryError) {
        console.error('\n❌ Also failed with test number:', retryError.message);

        if (retryError.code === 21211) {
          console.error('\n⚠️  The destination number (+17708141313) is not verified in your trial account.');
          console.error('   Verify it at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
        }
      }
    } else if (error.code === 21211) {
      console.error('\n💡 The destination number is not valid or not verified.');
      console.error('   For trial accounts, verify +17708141313 at:');
      console.error('   https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }

    process.exit(1);
  }
}

sendTestSMS();
