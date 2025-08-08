/**
 * Serverless function to send SMS via Fast2SMS
 * This bypasses CORS issues by making the API call from the server side
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      res.status(400).json({ 
        success: false, 
        error: 'Phone number and message are required' 
      });
      return;
    }

    // Fast2SMS API key (in production, use environment variables)
    const apiKey = process.env.FAST2SMS_API_KEY || 'ETyZs2Dvu7Ia4mi6P80bhSjgNxXJKWt1cYrAHwlBpo5zGfF3d9pYtn4Deg9ky3r67fHjldFibNEQWKSI';

    // Clean phone number (remove +91 prefix if present)
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.startsWith('91')) {
      cleanNumber = cleanNumber.substring(2);
    }

    // Validate 10-digit Indian number
    if (cleanNumber.length !== 10) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid Indian phone number format' 
      });
      return;
    }

    // Make request to Fast2SMS
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
        numbers: cleanNumber,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to send SMS via Fast2SMS',
        errorCode: error.code?.toString() || 'FAST2SMS_ERROR',
      });
      return;
    }

    const result = await response.json();

    if (result.return === true) {
      res.status(200).json({
        success: true,
        messageId: result.request_id,
        message: 'SMS sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.message || 'Fast2SMS request failed',
        errorCode: 'FAST2SMS_REQUEST_FAILED',
      });
    }
  } catch (error) {
    console.error('SMS API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      errorCode: 'SERVER_ERROR',
    });
  }
}
