// Smart SMS sender - tries multiple "from" numbers
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

const client = twilio(accountSid, authToken);

async function smartSendSMS() {
  console.log('=== Smart SMS Sender ===\n');

  const message = 'this is a cursor teest of Pruuf2 - I hope this freaking works';
  const toNumber = '+17708141313';

  // Try different from numbers in order of preference
  const fromNumbers = [
    { number: '+14843263161', description: 'Your Twilio number (preferred)' },
    { number: '+15005550006', description: 'Twilio test/magic number (fallback)' }
  ];

  for (const { number, description } of fromNumbers) {
    console.log(`\nAttempt: ${number}`);
    console.log(`Description: ${description}`);
    console.log(`To: ${toNumber}`);
    console.log(`Message: "${message}"`);
    console.log('Sending...');

    try {
      const result = await client.messages.create({
        body: message,
        from: number,
        to: toNumber
      });

      console.log('\n🎉 SUCCESS!');
      console.log('═══════════════════════════════════════');
      console.log('Message SID:', result.sid);
      console.log('Status:', result.status);
      console.log('From:', result.from);
      console.log('To:', result.to);
      console.log('Date Created:', result.dateCreated);
      console.log('═══════════════════════════════════════');

      if (number === '+14843263161') {
        console.log('\n✅ Your actual Twilio number is working!');
        console.log('   Update .env.example to use: +14843263161');
      } else {
        console.log('\n⚠️  Using fallback test number');
        console.log('   Your number (+14843263161) may need configuration');
        console.log('   Check SMS capability at:');
        console.log('   https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
      }

      return; // Exit after first success

    } catch (error) {
      console.log('❌ Failed');
      console.log('   Error:', error.message);
      console.log('   Code:', error.code);
    }
  }

  console.log('\n\n❌ ALL ATTEMPTS FAILED');
  console.log('Please check:');
  console.log('1. Destination number (+17708141313) is verified');
  console.log('2. Your Twilio number has SMS capability enabled');
  console.log('3. Trial account has not expired');
}

smartSendSMS();
