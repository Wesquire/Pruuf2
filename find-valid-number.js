// Find valid phone numbers in Twilio account
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

const client = twilio(accountSid, authToken);

async function findValidNumbers() {
  console.log('=== Searching for Valid Twilio Phone Numbers ===\n');

  // Method 1: Try to get messaging services
  try {
    console.log('Method 1: Checking Messaging Services...');
    const services = await client.messaging.v1.services.list({ limit: 10 });

    if (services.length > 0) {
      console.log(`✅ Found ${services.length} messaging service(s):\n`);
      for (const service of services) {
        console.log(`Service: ${service.friendlyName}`);
        console.log(`SID: ${service.sid}`);

        // Get phone numbers for this service
        try {
          const phoneNumbers = await client.messaging.v1
            .services(service.sid)
            .phoneNumbers
            .list({ limit: 10 });

          if (phoneNumbers.length > 0) {
            phoneNumbers.forEach(num => {
              console.log(`  📱 Phone: ${num.phoneNumber}`);
            });
          }
        } catch (e) {
          console.log(`  (Could not fetch phone numbers for this service)`);
        }
        console.log('');
      }
    } else {
      console.log('No messaging services found.\n');
    }
  } catch (error) {
    console.log(`❌ Could not access messaging services: ${error.message}\n`);
  }

  // Method 2: Try sending a test message to see what error we get
  console.log('Method 2: Testing message send to identify valid phone numbers...');

  const testNumbers = [
    '+14843263161',  // From .env
    '+15005550006',  // Twilio magic test number (already worked)
  ];

  for (const fromNumber of testNumbers) {
    try {
      console.log(`\nTesting: ${fromNumber}`);
      const message = await client.messages.create({
        body: 'Test message from Pruuf',
        from: fromNumber,
        to: '+17708141313'
      });

      console.log(`✅ SUCCESS with ${fromNumber}`);
      console.log(`   Message SID: ${message.sid}`);
      console.log(`   Status: ${message.status}`);

    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      if (error.code === 21606) {
        console.log(`   → This phone number is NOT valid/active in your account`);
      }
    }
  }

  // Method 3: Direct instructions
  console.log('\n\n=== To Find Your Actual Phone Number ===');
  console.log('1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
  console.log('2. Look for "Active Numbers" section');
  console.log('3. Copy the phone number shown there');
  console.log('4. That is your valid TWILIO_PHONE_NUMBER');
  console.log('\n💡 If no numbers are listed:');
  console.log('   - Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/search');
  console.log('   - Get a free trial phone number (with SMS capability)');
}

findValidNumbers();
