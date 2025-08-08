// Quick debug script to test WhatsApp API
// Run this in browser console after restarting the app

console.log('🔍 WhatsApp Debug Script');

// Test 1: Check if the endpoint is correct
const config = {
  apiKey: 'V2VrZ3BrVGc4S2Q0ekRoeWpyeU1QS1R2MXU2Nl9GZEliQXdTWFdBWnNvRTo=',
  endpoint: 'https://api.interakt.ai/v1/public/message/',
  template: {
    name: 'order_confirmation',
    languageCode: 'en'
  }
};

console.log('✅ Configuration:', config);

// Test 2: Phone number formatting
function formatPhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
    return cleanPhone.substring(2);
  }
  
  if (cleanPhone.length === 10) {
    return cleanPhone;
  }
  
  if (cleanPhone.length === 13 && cleanPhone.startsWith('91')) {
    return cleanPhone.substring(2);
  }
  
  throw new Error(`Invalid phone number format: ${phone}`);
}

// Test with the actual phone number from logs
const testPhone = '+917902467075';
try {
  const formatted = formatPhoneNumber(testPhone);
  console.log('✅ Phone formatting:', testPhone, '->', formatted);
} catch (error) {
  console.error('❌ Phone formatting error:', error.message);
}

// Test 3: API call structure
const testPayload = {
  countryCode: '+91',
  phoneNumber: '7902467075',
  type: 'Template',
  callbackData: 'order_1749617796372',
  template: {
    name: 'order_confirmation',
    languageCode: 'en',
    bodyValues: [
      'Donin C James',
      '1749617796372',
      'Test Product x 1',
      'Cash on Delivery',
      '100'
    ]
  }
};

console.log('✅ Test payload:', testPayload);

// Test 4: Make actual API call
async function testAPI() {
  console.log('🚀 Testing API call...');
  
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${config.apiKey}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log('📡 Response status:', response.status, response.statusText);
    console.log('📡 Response URL:', response.url);
    
    const responseText = await response.text();
    console.log('📡 Response body (raw):', responseText);

    try {
      const responseJson = JSON.parse(responseText);
      console.log('📡 Response body (parsed):', responseJson);
    } catch (parseError) {
      console.log('⚠️ Response is not valid JSON');
    }

    if (response.ok) {
      console.log('✅ API call successful!');
    } else {
      console.log('❌ API call failed');
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Instructions
console.log(`
🔧 INSTRUCTIONS:
1. First, restart your development server:
   - Stop with Ctrl+C
   - Run: npm run dev (or yarn dev)
   - Hard refresh browser (Ctrl+Shift+R)

2. Then run this test:
   testAPI()

3. Check if the endpoint in network tab shows:
   ✅ POST https://api.interakt.ai/v1/public/message/
   ❌ NOT: POST https://api.interakt.ai/v1/public/message/template

4. If still showing old endpoint, clear cache:
   - Delete node_modules/.vite folder
   - Restart dev server
`);

// Export test function
window.testAPI = testAPI;
