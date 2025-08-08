/**
 * Test Fast2SMS OTP API directly
 */

const https = require('https');

const FAST2SMS_API_KEY = 'ETyZs2Dvu7Ia4mi6P80bhSjgNxXJKWt1cYrAHwlBpo5zGfF3d9pYtn4Deg9ky3r67fHjldFibNEQWKSI';

function testFast2SMSOTP() {
  const phoneNumber = '7902467075'; // Your number without +91
  const otp = '123456'; // Test OTP

  console.log('🧪 Testing Fast2SMS OTP API...');
  console.log(`📱 Phone: +91${phoneNumber}`);
  console.log(`🔢 OTP: ${otp}`);
  console.log('');

  const requestData = JSON.stringify({
    variables_values: otp,
    route: 'otp',
    numbers: phoneNumber,
  });

  const options = {
    hostname: 'www.fast2sms.com',
    port: 443,
    path: '/dev/bulkV2',
    method: 'POST',
    headers: {
      'Authorization': FAST2SMS_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(requestData)
    }
  };

  console.log('📡 Making OTP request to Fast2SMS...');
  console.log('🔑 API Key:', FAST2SMS_API_KEY.substring(0, 10) + '...');
  console.log('📋 Request Data:', requestData);
  console.log('');

  const req = https.request(options, (res) => {
    console.log(`📡 Response Status: ${res.statusCode}`);
    console.log(`📋 Response Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
      console.log(`📥 Received chunk: "${chunk}"`);
    });
    
    res.on('end', () => {
      console.log('');
      console.log('📋 Complete Response Data:');
      console.log(`Raw: "${data}"`);
      console.log(`Length: ${data.length}`);
      console.log(`Is Empty: ${data.trim() === ''}`);
      
      if (data.trim() === '') {
        console.log('');
        console.log('✅ Empty response with 200 status usually means SUCCESS in Fast2SMS!');
        console.log('📱 Check your phone (+91' + phoneNumber + ') for the OTP SMS!');
      } else {
        try {
          const jsonData = JSON.parse(data);
          console.log('📋 Parsed JSON:', JSON.stringify(jsonData, null, 2));
          
          if (jsonData.return === true) {
            console.log('✅ OTP sent successfully!');
            console.log('📋 Request ID:', jsonData.request_id);
          } else {
            console.log('❌ OTP failed:', jsonData.message);
          }
        } catch (error) {
          console.log('❌ JSON Parse Error:', error.message);
          console.log('📋 Raw response:', data);
        }
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request Error:', error);
  });
  
  req.write(requestData);
  req.end();
}

// Run the test
testFast2SMSOTP();
