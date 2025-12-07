// Deep diagnosis of the phone number issue
const twilio = require('twilio');

const accountSid = 'ACfe25e9146c7b640920b99b66378e4115';
const authToken = 'faa9c608b79b104b00ae559d4f7e42c7';

const client = twilio(accountSid, authToken);

async function diagnose() {
  console.log('=== Deep Diagnosis of Twilio Number ===\n');

  // Try to lookup the specific phone number
  console.log('Method 1: Looking up phone number capabilities...');

  try {
    // Use lookup API to check number capabilities
    const lookup = await client.lookups.v1.phoneNumbers('+14843263161').fetch();
    console.log('✅ Number lookup successful:');
    console.log('   National Format:', lookup.nationalFormat);
    console.log('   Country Code:', lookup.countryCode);
    console.log('   Phone Number:', lookup.phoneNumber);
  } catch (error) {
    console.log('❌ Lookup failed:', error.message);
  }

  console.log('\nMethod 2: Checking available phone numbers in account...');

  // Try various API endpoints to get phone number info
  const apiEndpoints = [
    {
      name: 'Incoming Phone Numbers',
      fn: async () => {
        const numbers = await client.incomingPhoneNumbers.list({ limit: 20 });
        return numbers;
      }
    },
    {
      name: 'Local Phone Numbers',
      fn: async () => {
        const numbers = await client.incomingPhoneNumbers.local.list({ limit: 20 });
        return numbers;
      }
    }
  ];

  for (const endpoint of apiEndpoints) {
    try {
      console.log(`\nTrying: ${endpoint.name}...`);
      const results = await endpoint.fn();

      if (results && results.length > 0) {
        console.log(`✅ Found ${results.length} number(s):`);
        results.forEach(num => {
          console.log(`\n   Phone: ${num.phoneNumber}`);
          console.log(`   Friendly Name: ${num.friendlyName || 'N/A'}`);
          console.log(`   Capabilities:`);
          console.log(`     - Voice: ${num.capabilities?.voice ? '✅' : '❌'}`);
          console.log(`     - SMS: ${num.capabilities?.sms ? '✅' : '❌'}`);
          console.log(`     - MMS: ${num.capabilities?.mms ? '✅' : '❌'}`);
          console.log(`   Status: ${num.status}`);
          console.log(`   SID: ${num.sid}`);
        });
      } else {
        console.log('   No numbers found');
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n=== RECOMMENDATION ===');
  console.log('Since (+14843263161) keeps failing with error 21606,');
  console.log('this suggests the number might not have SMS capability.');
  console.log('\nOptions:');
  console.log('1. Check the number details in Twilio console manually');
  console.log('2. Release this number and get a new one with SMS capability');
  console.log('3. Contact Twilio support about this specific number');
  console.log('4. Use the test number (+15005550006) for now');
}

diagnose();
