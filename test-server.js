const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Test server is running'
  });
});

// Test OTP endpoint
app.post('/api/send-otp', (req, res) => {
  console.log('OTP request received:', req.body);
  res.json({
    success: true,
    message: 'Test OTP sent',
    phoneNumber: req.body.phoneNumber
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🧪 Test Server started!');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`📱 Android access: http://192.168.1.10:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  POST http://192.168.1.10:${PORT}/api/send-otp`);
  console.log(`  GET  http://192.168.1.10:${PORT}/api/health`);
  console.log('✅ Ready for testing!');
});

// Keep server alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Test server stopped');
    process.exit(0);
  });
});

// Error handling
server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

console.log('🚀 Test server script loaded');
