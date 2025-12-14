// Check Twilio account status and trial info
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

const client = twilio(accountSid, authToken);

async function checkAccount() {
  try {
    console.log('Checking Twilio account details...\n');

    const account = await client.api.accounts(accountSid).fetch();

    console.log('Account SID:', account.sid);
    console.log('Account Type:', account.type);
    console.log('Status:', account.status);
    console.log('Friendly Name:', account.friendlyName);

    if (account.type === 'Trial') {
      console.log(
        '\n⚠️  This is a TRIAL account. Trial accounts have restrictions:',
      );
      console.log('   - You can only send SMS to verified phone numbers');
      console.log(
        '   - Messages include "Sent from your Twilio trial account" prefix',
      );
      console.log('   - Limited features compared to upgraded accounts');
      console.log('\nTo send SMS to +17708141313, you need to:');
      console.log('1. Go to https://console.twilio.com/');
      console.log(
        '2. Navigate to Phone Numbers > Manage > Verified Caller IDs',
      );
      console.log('3. Add and verify +17708141313');
      console.log('\nOR upgrade your account to send to any number.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAccount();
