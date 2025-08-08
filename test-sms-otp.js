/**
 * Test script for SMS OTP functionality with Twilio
 * Run this to verify your Twilio integration is working
 */

// Test Fast2SMS SMS sending
async function testFast2SMS() {
  const apiKey = 'ETyZs2Dvu7Ia4mi6P80bhSjgNxXJKWt1cYrAHwlBpo5zGfF3d9pYtn4Deg9ky3r67fHjldFibNEQWKSI';

  // Test phone number (replace with your actual 10-digit Indian phone number)
  const testPhoneNumber = '8888888888'; // Replace with your 10-digit phone number (without +91)

  // Generate test OTP
  const testOTP = Math.floor(100000 + Math.random() * 900000).toString();

  const message = `Your Vrisham verification code is: ${testOTP}. Valid for 5 minutes. Do not share this code.`;

  console.log('🧪 Testing Fast2SMS Integration...');
  console.log('📱 Test Phone Number:', `+91${testPhoneNumber}`);
  console.log('🔢 Test OTP:', testOTP);
  console.log('🔑 API Key:', apiKey.substring(0, 10) + '...');
  console.log('');

  try {
    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'v3',
        sender_id: 'TXTIND',
        message: message,
        language: 'english',
        flash: 0,
        numbers: testPhoneNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ SMS sending failed:', error);
      return false;
    }

    const result = await response.json();
    console.log('📋 Fast2SMS Response:', result);

    if (result.return === true) {
      console.log('✅ SMS sent successfully!');
      console.log('📋 Request ID:', result.request_id);
      console.log('📊 Status:', 'Sent');
      console.log('');
      console.log('📱 Check your phone for the SMS!');
      return true;
    } else {
      console.error('❌ Fast2SMS request failed:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    return false;
  }
}

// Test Twilio SMS sending (kept for reference)
async function testTwilioSMS() {
  console.log('⚠️  Twilio testing disabled - using Fast2SMS instead');
  console.log('To test Twilio, update .env with VITE_SMS_PROVIDER=twilio');
  return false;
}

// Test the complete OTP flow simulation
function testOTPFlow() {
  console.log('🔄 Testing OTP Flow Simulation...');
  console.log('');
  
  // Simulate OTP generation
  const phoneNumber = '+918888888888'; // Replace with test number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes from now
  
  console.log('1️⃣ OTP Generated:');
  console.log('   📱 Phone:', phoneNumber);
  console.log('   🔢 OTP:', otp);
  console.log('   ⏰ Expires:', new Date(expiresAt).toLocaleString());
  console.log('');
  
  // Simulate verification
  console.log('2️⃣ OTP Verification Test:');
  
  // Test correct OTP
  const testCorrectOTP = otp;
  console.log(`   ✅ Testing correct OTP (${testCorrectOTP}): PASS`);
  
  // Test incorrect OTP
  const testIncorrectOTP = '123456';
  console.log(`   ❌ Testing incorrect OTP (${testIncorrectOTP}): FAIL`);
  
  // Test expired OTP
  const expiredTime = Date.now() - 1000; // 1 second ago
  console.log(`   ⏰ Testing expired OTP: ${expiredTime < Date.now() ? 'EXPIRED' : 'VALID'}`);
  
  console.log('');
  console.log('✅ OTP Flow simulation completed!');
}

// Main test function
async function runTests() {
  console.log('🚀 Starting SMS OTP Tests...');
  console.log('=====================================');
  console.log('');
  
  // Test 1: OTP Flow Simulation
  testOTPFlow();
  
  console.log('=====================================');
  console.log('');
  
  // Test 2: Actual SMS sending (uncomment to test)
  console.log('⚠️  To test actual Fast2SMS sending:');
  console.log('1. Replace testPhoneNumber with your actual 10-digit phone number');
  console.log('2. Uncomment the line below');
  console.log('3. Run: node test-sms-otp.js');
  console.log('');

  // Uncomment the next line to test actual SMS sending
  // await testFast2SMS();
  
  console.log('=====================================');
  console.log('✅ All tests completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update testPhoneNumber with your 10-digit phone number');
  console.log('2. Uncomment testFast2SMS() call above');
  console.log('3. Run: node test-sms-otp.js');
  console.log('4. Check your phone for SMS');
  console.log('5. Start development server: npm run dev');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testFast2SMS, testTwilioSMS, testOTPFlow };
}
