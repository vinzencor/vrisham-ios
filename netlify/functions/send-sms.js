/**
 * Netlify Function for SMS OTP via Fast2SMS
 * This replaces the SMS proxy server for production deployment
 */

const https = require('https');

// Fast2SMS API key - in production, use environment variables
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'ETyZs2Dvu7Ia4mi6P80bhSjgNxXJKWt1cYrAHwlBpo5zGfF3d9pYtn4Deg9ky3r67fHjldFibNEQWKSI';

// Helper function to make HTTPS requests
function makeHttpsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Handle empty response (often means success for Fast2SMS)
          if (!data || data.trim() === '') {
            resolve({
              statusCode: res.statusCode,
              data: { 
                return: true, 
                message: 'SMS sent successfully (empty response)',
                request_id: `fast2sms_${Date.now()}`
              }
            });
            return;
          }
          
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          // If JSON parsing fails but status is 200, assume success
          if (res.statusCode === 200) {
            resolve({
              statusCode: res.statusCode,
              data: { 
                return: true, 
                message: 'SMS sent successfully (non-JSON response)',
                request_id: `fast2sms_${Date.now()}`,
                raw: data
              }
            });
          } else {
            resolve({
              statusCode: res.statusCode,
              data: { error: 'Invalid JSON response', raw: data }
            });
          }
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Netlify Function Handler
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      })
    };
  }

  try {
    const { phoneNumber, message } = JSON.parse(event.body);

    if (!phoneNumber || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Phone number and message are required' 
        })
      };
    }

    console.log(`📱 Sending SMS to: ${phoneNumber}`);
    console.log(`📝 Message: ${message}`);

    // Clean phone number (remove +91 prefix if present)
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('91')) {
      cleanNumber = cleanNumber.substring(2);
    }

    // Validate 10-digit Indian number
    if (cleanNumber.length !== 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid Indian phone number format' 
        })
      };
    }

    console.log(`🔢 Clean number: ${cleanNumber}`);

    // Prepare request data
    const requestData = JSON.stringify({
      route: 'v3',
      sender_id: 'TXTIND',
      message: message,
      language: 'english',
      flash: 0,
      numbers: cleanNumber,
    });

    // HTTPS request options
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

    console.log('📡 Making request to Fast2SMS...');

    // Make request to Fast2SMS
    const response = await makeHttpsRequest(options, requestData);
    
    console.log(`📡 Fast2SMS Response Status: ${response.statusCode}`);
    console.log('📋 Fast2SMS Result:', response.data);

    if (response.statusCode !== 200) {
      console.error('❌ Fast2SMS HTTP Error:', response.statusCode);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: response.data.message || 'Failed to send SMS via Fast2SMS',
          errorCode: response.data.code?.toString() || 'FAST2SMS_HTTP_ERROR',
        })
      };
    }

    const result = response.data;

    // Handle Fast2SMS success responses
    if (result.return === true || (response.statusCode === 200 && (!result.error || result.message === 'SMS sent successfully (empty response)'))) {
      console.log('✅ SMS sent successfully!');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          messageId: result.request_id || `fast2sms_${Date.now()}`,
          message: 'SMS sent successfully',
        })
      };
    } else {
      console.error('❌ Fast2SMS request failed:', result.message || result.error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: result.message || result.error || 'Fast2SMS request failed',
          errorCode: 'FAST2SMS_REQUEST_FAILED',
        })
      };
    }
  } catch (error) {
    console.error('❌ SMS Function Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
        errorCode: 'SERVER_ERROR',
      })
    };
  }
};
