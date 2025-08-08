/**
 * Quick test script to validate the reCAPTCHA reset implementation
 * Run this in the browser console to test the functionality
 */

import { runAllRecaptchaResetTests } from './utils/recaptcha-reset-test';
import { sendOTP, createFreshRecaptchaContainer } from './firebase/auth';

// Global test function for browser console
(window as any).testRecaptchaReset = async () => {
  console.log('🚀 Starting reCAPTCHA Reset Implementation Test...\n');
  
  try {
    // Run comprehensive tests
    await runAllRecaptchaResetTests();
    
    console.log('\n✅ All tests completed! Check the logs above for detailed results.');
    console.log('\n📋 Manual Testing Steps:');
    console.log('1. Go to Login page');
    console.log('2. Enter a phone number and request OTP');
    console.log('3. Wait for the resend timer to expire');
    console.log('4. Click "Resend OTP" multiple times');
    console.log('5. Verify no reCAPTCHA errors occur');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
};

// Quick manual test function
(window as any).quickRecaptchaTest = async () => {
  const testContainerId = `quick-test-${Date.now()}`;
  const testPhone = '+16505551234';
  
  console.log('🧪 Quick reCAPTCHA Reset Test');
  
  try {
    // Create test container
    const container = document.createElement('div');
    container.id = testContainerId;
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    document.body.appendChild(container);
    
    console.log('✓ Created test container');
    
    // Test initial send
    console.log('📤 Testing initial OTP send...');
    const initialResult = await sendOTP(testPhone, testContainerId, false);
    console.log(initialResult.success ? '✅ Initial send successful' : '❌ Initial send failed');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test fresh container creation
    console.log('🔄 Testing fresh container creation...');
    const newContainerId = createFreshRecaptchaContainer(testContainerId);
    console.log(`✅ Fresh container created: ${newContainerId}`);
    
    // Test resend with fresh container
    console.log('📤 Testing resend OTP with fresh container...');
    const resendResult = await sendOTP(testPhone, newContainerId, true);
    console.log(resendResult.success ? '✅ Resend successful' : '❌ Resend failed');
    if (resendResult.actualContainerId) {
      console.log(`📋 New container ID returned: ${resendResult.actualContainerId}`);
    }
    
    // Test multiple resends with widget ID strategy
    console.log('📤 Testing multiple consecutive resends with fresh containers...');
    let currentContainerId = resendResult.actualContainerId || newContainerId;

    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const multiResult = await sendOTP(testPhone, currentContainerId, true);
      console.log(multiResult.success ? `✅ Resend ${i} successful` : `❌ Resend ${i} failed`);

      if (multiResult.actualContainerId) {
        console.log(`📋 Container ${i}: ${currentContainerId} → ${multiResult.actualContainerId}`);
        currentContainerId = multiResult.actualContainerId;
      }
    }
    
    console.log('🎉 Quick test completed successfully!');
    
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  } finally {
    // Cleanup
    const container = document.getElementById(testContainerId);
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
      console.log('🧹 Test container cleaned up');
    }
  }
};

// Export for use in components if needed
export { runAllRecaptchaResetTests };

console.log('🔧 Widget ID-Based reCAPTCHA Reset Test Functions Loaded!');
console.log('📝 Available functions:');
console.log('  - testRecaptchaReset() - Run comprehensive widget ID tests');
console.log('  - quickRecaptchaTest() - Run quick fresh container validation');
console.log('\n💡 Usage: Open browser console and call testRecaptchaReset()');
console.log('🎯 This tests the new strategy that bypasses Google\'s widget registry');
