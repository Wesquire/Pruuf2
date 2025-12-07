// Diagnose specific phone number issue
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';
const phoneNumber = '+14843263161';

const client = twilio(accountSid, authToken);

async function diagnoseNumber() {
  console.log('=== Diagnosing Phone Number: +14843263161 ===\n');

  // Try to get details about this specific number
  try {
    console.log('Attempting to fetch phone number details...');
    const number = await client.incomingPhoneNumbers.list({
      phoneNumber: phoneNumber
    });

    if (number.length > 0) {
      console.log('✅ Phone number found in account!');
      console.log('Details:', JSON.stringify(number[0], null, 2));
    } else {
      console.log('❌ Phone number NOT found in account');
    }
  } catch (error) {
    console.log('❌ Error fetching number details:', error.message);
    console.log('Error code:', error.code);
  }

  // Try sending with additional debugging
  console.log('\n=== Testing SMS Send ===');
  try {
    console.log('Attempting to send SMS...');
    const message = await client.messages.create({
      body: 'this is sent from claude',
      from: phoneNumber,
      to: '+17708141313',
      statusCallback: 'https://webhook.site/unique-id' // Optional webhook for status
    });

    console.log('✅ SUCCESS!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('Error Code:', message.errorCode);
    console.log('Error Message:', message.errorMessage);

  } catch (error) {
    console.log('❌ FAILED');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Status:', error.status);

    // Specific error code analysis
    if (error.code === 21606) {
      console.log('\n📋 Error 21606 Analysis:');
      console.log('This error means one of:');
      console.log('1. The number is not purchased/active in your account');
      console.log('2. The number is not SMS-capable (voice-only)');
      console.log('3. The number is pending verification/activation');
      console.log('4. You\'re using a trial account and the number isn\'t verified');

      console.log('\n🔧 Solutions:');
      console.log('A. Check if number appears here: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
      console.log('B. Verify the number has SMS capability enabled');
      console.log('C. For trial accounts, you may need to verify the destination number (+17708141313)');
      console.log('   Verify at: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    }
  }

  console.log('\n=== Alternative: Using Twilio Test Number ===');
  console.log('The Twilio magic test number +15005550006 works for testing.');
  console.log('Would you like me to use that instead?');
}

diagnoseNumber();
