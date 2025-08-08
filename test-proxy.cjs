/**
 * Test script to verify SMS proxy is working
 */

// Use dynamic import for node-fetch
async function getFetch() {
  const { default: fetch } = await import('node-fetch');
  return fetch;
}

async function testSMSProxy() {
  console.log('🧪 Testing SMS Proxy Server...');
  console.log('');

  try {
    // Get fetch function
    const fetch = await getFetch();

    // Test health endpoint first
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // Test SMS sending (replace with your phone number)
    console.log('2️⃣ Testing SMS sending...');
    const testPhoneNumber = '9876543210'; // Replace with your 10-digit number
    const testMessage = `Test OTP: ${Math.floor(100000 + Math.random() * 900000)}. This is a test message from Vrisham app.`;

    console.log(`📱 Phone: +91${testPhoneNumber}`);
    console.log(`📝 Message: ${testMessage}`);
    console.log('');

    const smsResponse = await fetch('http://localhost:3001/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: `+91${testPhoneNumber}`,
        message: testMessage,
      }),
    });

    const smsData = await smsResponse.json();
    
    if (smsData.success) {
      console.log('✅ SMS sent successfully!');
      console.log('📋 Message ID:', smsData.messageId);
      console.log('📱 Check your phone for the SMS!');
    } else {
      console.log('❌ SMS sending failed:');
      console.log('Error:', smsData.error);
      console.log('Error Code:', smsData.errorCode);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  console.log('🚀 Starting SMS Proxy Test...');
  console.log('=====================================');
  console.log('');
  
  testSMSProxy().then(() => {
    console.log('');
    console.log('=====================================');
    console.log('✅ Test completed!');
    console.log('');
    console.log('If SMS was sent successfully:');
    console.log('1. Check your phone for the test message');
    console.log('2. Open http://localhost:5173/ to test the full app');
    console.log('3. Try the authentication flow');
  }).catch(console.error);
}

module.exports = { testSMSProxy };
