// Test SMS script using Twilio
const twilio = require('twilio');

// Twilio credentials from .env.example
const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';
const twilioPhoneNumber = '+14843263161';

// Initialize Twilio client
const client = twilio(accountSid, authToken);

async function sendTestSMS() {
  try {
    console.log('Sending SMS...');
    console.log('From:', twilioPhoneNumber);
    console.log('To: +17708141313');
    console.log('Message: this is sent from claude');

    const message = await client.messages.create({
      body: 'this is sent from claude',
      from: twilioPhoneNumber,
      to: '+17708141313'
    });

    console.log('\n✅ SMS sent successfully!');
    console.log('Message SID:', message.sid);
    console.log('Status:', message.status);
    console.log('Date created:', message.dateCreated);

  } catch (error) {
    console.error('\n❌ Error sending SMS:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('More info:', error.moreInfo);

    // Provide troubleshooting suggestions
    if (error.code === 20003) {
      console.error('\nTroubleshooting: Authentication failed. Please verify:');
      console.error('1. Account SID is correct');
      console.error('2. Auth Token is correct');
    } else if (error.code === 21211) {
      console.error('\nTroubleshooting: Invalid "To" phone number');
    } else if (error.code === 21606) {
      console.error('\nTroubleshooting: Invalid "From" phone number');
    }

    process.exit(1);
  }
}

// Run the function
sendTestSMS();
