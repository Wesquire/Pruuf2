// Check verified caller IDs for trial account
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

const client = twilio(accountSid, authToken);

async function checkVerifiedNumbers() {
  console.log('=== Checking Verified Caller IDs ===\n');

  try {
    const validationRequests = await client.validationRequests.list({ limit: 20 });

    console.log('Verified Numbers:');
    if (validationRequests.length === 0) {
      console.log('❌ No verified numbers found!\n');
      console.log('For trial accounts, you must verify destination numbers.');
      console.log('Verify +17708141313 at:');
      console.log('https://console.twilio.com/us1/develop/phone-numbers/manage/verified\n');
    } else {
      validationRequests.forEach(req => {
        console.log(`  - ${req.phoneNumber} (${req.friendlyName || 'No name'})`);
      });
    }
  } catch (error) {
    console.log('Could not fetch verified numbers:', error.message);
    console.log('\nTrying alternative method...\n');
  }

  // Try listing outgoing caller IDs
  try {
    const outgoingCallerIds = await client.outgoingCallerIds.list({ limit: 20 });

    if (outgoingCallerIds.length > 0) {
      console.log('\nOutgoing Caller IDs (Verified):');
      outgoingCallerIds.forEach(id => {
        console.log(`  ✅ ${id.phoneNumber} - ${id.friendlyName}`);
      });
    }
  } catch (error) {
    console.log('Could not fetch outgoing caller IDs:', error.message);
  }

  console.log('\n=== Now Testing SMS Send ===\n');

  // Test with your actual number
  try {
    console.log('Attempting with your number: +14843263161');
    const message = await client.messages.create({
      body: 'this is a cursor teest of Pruuf2 - I hope this freaking works',
      from: '+14843263161',
      to: '+17708141313'
    });

    console.log('✅ SUCCESS!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('\n🎉 Your number +14843263161 is working!');

  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('Error Code:', error.code);

    if (error.code === 21606) {
      console.log('\n⚠️  This typically means:');
      console.log('   1. The number is pending activation (can take a few minutes)');
      console.log('   2. The number doesn\'t have SMS enabled');
      console.log('   3. There\'s a trial account restriction');
      console.log('\n📋 Next Steps:');
      console.log('   1. Wait 5-10 minutes for number activation');
      console.log('   2. Check: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
      console.log('   3. Click on (484) 326-3161 and verify SMS is enabled');
      console.log('   4. For trial accounts, verify +17708141313 at:');
      console.log('      https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    } else if (error.code === 21211) {
      console.log('\n⚠️  Destination number (+17708141313) needs to be verified.');
      console.log('   Verify at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }
  }
}

checkVerifiedNumbers();
