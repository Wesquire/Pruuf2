// Interactive SMS sending script
const readline = require('readline');
const twilio = require('twilio');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('=== Twilio SMS Test ===\n');

  // Get credentials from user
  const accountSid = await question('Enter Twilio Account SID (or press Enter to use: ACfe25e9146c7b640920b99b66378e4115): ');
  const finalAccountSid = accountSid.trim() || 'ACfe25e9146c7b640920b99b66378e4115';

  const authToken = await question('Enter Twilio Auth Token (current one from Twilio console): ');
  const finalAuthToken = authToken.trim();

  if (!finalAuthToken) {
    console.error('\n❌ Auth Token is required!');
    rl.close();
    process.exit(1);
  }

  const fromPhone = await question('Enter "From" phone number (or press Enter to use: +14843263161): ');
  const finalFromPhone = fromPhone.trim() || '+14843263161';

  console.log('\n--- Attempting to send SMS ---');
  console.log('From:', finalFromPhone);
  console.log('To: +17708141313');
  console.log('Message: this is sent from claude\n');

  try {
    const client = twilio(finalAccountSid, finalAuthToken);

    const message = await client.messages.create({
      body: 'this is sent from claude',
      from: finalFromPhone,
      to: '+17708141313'
    });

    console.log('✅ SMS sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('To:', message.to);
    console.log('From:', message.from);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Code:', error.code);
    console.error('More info:', error.moreInfo || 'N/A');
  }

  rl.close();
}

main();
