// List all phone numbers in Twilio account
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

const client = twilio(accountSid, authToken);

async function listPhoneNumbers() {
  try {
    console.log('Fetching phone numbers from your Twilio account...\n');

    const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({ limit: 20 });

    if (incomingPhoneNumbers.length === 0) {
      console.log('❌ No phone numbers found in your Twilio account.');
      console.log('\nYou need to:');
      console.log('1. Go to https://console.twilio.com/');
      console.log('2. Navigate to Phone Numbers > Manage > Buy a number');
      console.log('3. Purchase a phone number with SMS capabilities');
      return;
    }

    console.log(`✅ Found ${incomingPhoneNumbers.length} phone number(s):\n`);

    incomingPhoneNumbers.forEach((number, index) => {
      console.log(`${index + 1}. Phone Number: ${number.phoneNumber}`);
      console.log(`   Friendly Name: ${number.friendlyName || 'N/A'}`);
      console.log(`   SMS Enabled: ${number.capabilities.sms ? '✅ Yes' : '❌ No'}`);
      console.log(`   Voice Enabled: ${number.capabilities.voice ? '✅ Yes' : '❌ No'}`);
      console.log(`   MMS Enabled: ${number.capabilities.mms ? '✅ Yes' : '❌ No'}`);
      console.log(`   Status: ${number.status}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
  }
}

listPhoneNumbers();
