// Verify Twilio credentials
const twilio = require('twilio');

// Try the credentials from .env.example
const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

console.log('Testing Twilio credentials...');
console.log('Account SID:', accountSid);
console.log('Auth Token:', authToken.substring(0, 8) + '...');

const client = twilio(accountSid, authToken);

async function verifyCredentials() {
  try {
    // Try to fetch account details to verify credentials
    const account = await client.api.accounts(accountSid).fetch();
    console.log('\n✅ Credentials are valid!');
    console.log('Account Status:', account.status);
    console.log('Account Type:', account.type);
    return true;
  } catch (error) {
    console.error('\n❌ Authentication failed!');
    console.error('Error:', error.message);
    console.error('\nThe auth token appears to be incorrect or expired.');
    console.error('Please check your Twilio console at: https://console.twilio.com/');
    console.error('Navigate to: Account > API keys & tokens > Auth Tokens');
    return false;
  }
}

verifyCredentials();
