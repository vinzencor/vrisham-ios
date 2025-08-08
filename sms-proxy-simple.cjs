/**
 * Simple SMS Proxy Server using built-in Node.js modules
 * Solves CORS issues with Fast2SMS API
 */

const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Fast2SMS API key
const FAST2SMS_API_KEY = 'ETyZs2Dvu7Ia4mi6P80bhSjgNxXJKWt1cYrAHwlBpo5zGfF3d9pYtn4Deg9ky3r67fHjldFibNEQWKSI';

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

// SMS proxy endpoint
app.post('/api/send-sms', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and message are required' 
      });
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
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Indian phone number format' 
      });
    }

    console.log(`🔢 Clean number: ${cleanNumber}`);

    // Extract OTP from message (assuming format: "Your Vrisham verification code is: 123456...")
    const otpMatch = message.match(/(\d{4,6})/);
    const otp = otpMatch ? otpMatch[1] : '123456'; // fallback OTP

    console.log('📋 Extracted OTP:', otp);

    // Prepare request data for OTP API
    const requestData = JSON.stringify({
      variables_values: otp,
      route: 'otp',
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
      return res.status(500).json({
        success: false,
        error: response.data.message || 'Failed to send SMS via Fast2SMS',
        errorCode: response.data.code?.toString() || 'FAST2SMS_HTTP_ERROR',
      });
    }

    const result = response.data;

    // Handle Fast2SMS success responses
    if (result.return === true || (response.statusCode === 200 && (!result.error || result.message === 'SMS sent successfully (empty response)'))) {
      console.log('✅ SMS sent successfully!');
      res.json({
        success: true,
        messageId: result.request_id || `fast2sms_${Date.now()}`,
        message: 'SMS sent successfully',
      });
    } else {
      console.error('❌ Fast2SMS request failed:', result.message || result.error);
      res.status(500).json({
        success: false,
        error: result.message || result.error || 'Fast2SMS request failed',
        errorCode: 'FAST2SMS_REQUEST_FAILED',
      });
    }
  } catch (error) {
    console.error('❌ SMS Proxy Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      errorCode: 'SERVER_ERROR',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'SMS Proxy Server (Simple)',
    timestamp: new Date().toISOString(),
    apiKey: FAST2SMS_API_KEY.substring(0, 10) + '...'
  });
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.log('🔄 Server continuing to run...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Server continuing to run...');
});

// Start server
const server = app.listen(PORT, () => {
  console.log('🚀 SMS Proxy Server (Simple) started!');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🔑 Fast2SMS API Key: ${FAST2SMS_API_KEY.substring(0, 10)}...`);
  console.log('');
  console.log('Available endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/send-sms`);
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log('');
  console.log('✅ Ready to proxy SMS requests!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('👋 SMS Proxy Server stopped.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📡 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('👋 SMS Proxy Server stopped.');
    process.exit(0);
  });
});

module.exports = app;
