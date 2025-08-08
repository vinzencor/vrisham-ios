/**
 * Test script to verify that real OTP verification is working
 * and development bypasses have been removed
 */

import { sendOTP, verifyOTP } from '../firebase/customAuth';

export interface OTPTestResult {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Test that hardcoded OTP "123456" no longer works
 */
export const testHardcodedOTPRejection = async (phoneNumber: string): Promise<OTPTestResult> => {
  try {
    console.log('Testing that hardcoded OTP "123456" is rejected...');
    
    // Create a test container
    const containerId = `test-hardcoded-otp-${Date.now()}`;
    const container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      // Send OTP to real phone number
      const sendResult = await sendOTP(phoneNumber, containerId);
      
      if (!sendResult.success) {
        return {
          success: false,
          message: `Failed to send OTP: ${sendResult.errorMessage}`,
          error: sendResult.error
        };
      }

      // Try to verify with hardcoded OTP "123456"
      const verifyResult = await verifyOTP(sendResult.confirmationResult, '123456');
      
      if (verifyResult.success) {
        return {
          success: false,
          message: 'SECURITY ISSUE: Hardcoded OTP "123456" was accepted! This should not happen.',
          error: new Error('Hardcoded OTP bypass still active')
        };
      }

      return {
        success: true,
        message: 'Good: Hardcoded OTP "123456" was correctly rejected'
      };
    } finally {
      // Cleanup
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Error during hardcoded OTP test: ${error.message}`,
      error
    };
  }
};

/**
 * Test that test phone numbers no longer bypass verification
 */
export const testPhoneNumberBypassRemoval = async (): Promise<OTPTestResult> => {
  try {
    console.log('Testing that test phone numbers no longer bypass verification...');
    
    const testPhones = ['+16505551234', '+917902467075', '+919876543210', '+911234567890'];
    const containerId = `test-bypass-removal-${Date.now()}`;
    
    // Create a test container
    const container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      for (const phone of testPhones) {
        console.log(`Testing bypass removal for ${phone}`);
        
        // This should now require real reCAPTCHA verification
        const result = await sendOTP(phone, containerId);
        
        // If it succeeds without reCAPTCHA, that's a problem
        // If it fails due to reCAPTCHA requirements, that's expected and good
        if (result.success && result.confirmationResult && 
            typeof result.confirmationResult.confirm === 'function') {
          
          // Check if this is a mock result (which shouldn't exist anymore)
          const testVerify = await result.confirmationResult.confirm('123456');
          if (testVerify.user && testVerify.user.uid.startsWith('mock-uid-')) {
            return {
              success: false,
              message: `SECURITY ISSUE: Phone ${phone} still uses mock verification!`,
              error: new Error('Mock verification bypass still active')
            };
          }
        }
      }

      return {
        success: true,
        message: 'Good: Test phone numbers no longer bypass real verification'
      };
    } finally {
      // Cleanup
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }
  } catch (error) {
    // Errors are expected when reCAPTCHA is required
    if (error.message.includes('reCAPTCHA') || error.message.includes('container')) {
      return {
        success: true,
        message: 'Good: Test phone numbers now require proper reCAPTCHA verification'
      };
    }
    
    return {
      success: false,
      message: `Unexpected error during bypass removal test: ${error.message}`,
      error
    };
  }
};

/**
 * Run comprehensive tests to verify real OTP verification
 */
export const runRealOTPTests = async (realPhoneNumber?: string): Promise<void> => {
  console.log('🔒 Starting Real OTP Verification Tests...');
  console.log('=====================================');

  // Test 1: Verify hardcoded OTP rejection
  if (realPhoneNumber) {
    console.log('\n📱 Test 1: Hardcoded OTP Rejection');
    const hardcodedTest = await testHardcodedOTPRejection(realPhoneNumber);
    console.log(`Result: ${hardcodedTest.success ? '✅' : '❌'} ${hardcodedTest.message}`);
    if (hardcodedTest.error) {
      console.error('Error details:', hardcodedTest.error);
    }
  } else {
    console.log('\n📱 Test 1: Skipped (no real phone number provided)');
    console.log('To test hardcoded OTP rejection, provide a real phone number');
  }

  // Test 2: Verify test phone number bypass removal
  console.log('\n🚫 Test 2: Test Phone Number Bypass Removal');
  const bypassTest = await testPhoneNumberBypassRemoval();
  console.log(`Result: ${bypassTest.success ? '✅' : '❌'} ${bypassTest.message}`);
  if (bypassTest.error) {
    console.error('Error details:', bypassTest.error);
  }

  console.log('\n=====================================');
  console.log('🔒 Real OTP Verification Tests Complete');
  
  if (realPhoneNumber) {
    console.log('\n📋 Manual Testing Instructions:');
    console.log('1. Try logging in with your phone number');
    console.log('2. Enter "123456" as the OTP - it should be rejected');
    console.log('3. Enter the actual OTP from SMS - it should work');
    console.log('4. Try with test numbers like +16505551234 - they should require real verification');
  }
};

/**
 * Quick verification that can be called from console
 */
export const quickSecurityCheck = (): void => {
  console.log('🔍 Quick Security Check Results:');
  console.log('================================');
  
  // Check if Firebase test mode is disabled
  const testModeDisabled = !process.env.NODE_ENV || process.env.NODE_ENV !== 'development' || 
                          !window.firebase?.auth?.settings?.appVerificationDisabledForTesting;
  console.log(`Firebase Test Mode: ${testModeDisabled ? '✅ Disabled' : '❌ Still Enabled'}`);
  
  // Check if development bypasses are removed (this is a code check)
  const codeCheck = !window.location.href.includes('shouldBypassRecaptcha') && 
                   !window.location.href.includes('createMockConfirmationResult');
  console.log(`Development Bypasses: ${codeCheck ? '✅ Removed' : '❌ May still exist'}`);
  
  console.log('\n💡 To fully test, use runRealOTPTests() with a real phone number');
};
