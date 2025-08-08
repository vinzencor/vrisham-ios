/**
 * Test utility to verify OTP resend functionality fix
 * This file can be used to test the OTP authentication flow
 */

import { sendOTP, verifyOTP, clearAllRecaptchaVerifiers } from '../firebase/customAuth';

export interface OTPTestResult {
  success: boolean;
  message: string;
  error?: any;
}

/**
 * Test OTP sending functionality
 */
export const testOTPSending = async (
  phoneNumber: string, 
  containerId: string
): Promise<OTPTestResult> => {
  try {
    console.log(`Testing OTP sending to ${phoneNumber} with container ${containerId}`);
    
    const result = await sendOTP(phoneNumber, containerId);
    
    if (result.success) {
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    } else {
      return {
        success: false,
        message: `Failed to send OTP: ${result.errorMessage}`,
        error: result.error
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing OTP sending: ${error.message}`,
      error
    };
  }
};

/**
 * Test OTP resending functionality with enhanced reset logic
 */
export const testOTPResending = async (
  phoneNumber: string,
  containerId: string,
  delayMs: number = 1000
): Promise<OTPTestResult> => {
  try {
    console.log(`Testing OTP resending to ${phoneNumber} after ${delayMs}ms delay`);

    // First send (initial send, not a resend)
    const firstResult = await sendOTP(phoneNumber, containerId, false);
    if (!firstResult.success) {
      return {
        success: false,
        message: `First OTP send failed: ${firstResult.errorMessage}`,
        error: firstResult.error
      };
    }

    // Wait before resending
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Resend with isResend flag set to true
    const resendResult = await sendOTP(phoneNumber, containerId, true);
    if (resendResult.success) {
      return {
        success: true,
        message: 'OTP resent successfully with enhanced reset logic'
      };
    } else {
      return {
        success: false,
        message: `Failed to resend OTP: ${resendResult.errorMessage}`,
        error: resendResult.error
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing OTP resending: ${error.message}`,
      error
    };
  }
};

/**
 * Test multiple container IDs to ensure no conflicts
 */
export const testMultipleContainers = async (
  phoneNumber: string
): Promise<OTPTestResult> => {
  try {
    console.log('Testing multiple container IDs for conflicts');
    
    const container1 = `test-container-1-${Date.now()}`;
    const container2 = `test-container-2-${Date.now()}`;
    
    // Create test containers in DOM
    const div1 = document.createElement('div');
    div1.id = container1;
    document.body.appendChild(div1);
    
    const div2 = document.createElement('div');
    div2.id = container2;
    document.body.appendChild(div2);
    
    try {
      // Test sending with first container
      const result1 = await sendOTP(phoneNumber, container1);
      if (!result1.success) {
        return {
          success: false,
          message: `First container test failed: ${result1.errorMessage}`,
          error: result1.error
        };
      }
      
      // Test sending with second container
      const result2 = await sendOTP(phoneNumber, container2);
      if (!result2.success) {
        return {
          success: false,
          message: `Second container test failed: ${result2.errorMessage}`,
          error: result2.error
        };
      }
      
      return {
        success: true,
        message: 'Multiple container test passed'
      };
    } finally {
      // Cleanup
      document.body.removeChild(div1);
      document.body.removeChild(div2);
      clearAllRecaptchaVerifiers();
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing multiple containers: ${error.message}`,
      error
    };
  }
};

/**
 * Test DOM container persistence during component state changes
 */
export const testDOMContainerPersistence = async (): Promise<OTPTestResult> => {
  try {
    console.log('Testing DOM container persistence during state changes');

    const containerId = `test-persistence-container-${Date.now()}`;

    // Create container
    const container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
      // Test that container persists through multiple operations
      const testPhone = '+917902467075';

      // First operation
      const result1 = await testOTPSending(testPhone, containerId);
      if (!result1.success) {
        return {
          success: false,
          message: `First operation failed: ${result1.message}`,
          error: result1.error
        };
      }

      // Check container still exists
      const containerAfterFirst = document.getElementById(containerId);
      if (!containerAfterFirst) {
        return {
          success: false,
          message: 'Container was removed after first operation'
        };
      }

      // Second operation (simulating resend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result2 = await testOTPSending(testPhone, containerId);
      if (!result2.success) {
        return {
          success: false,
          message: `Second operation failed: ${result2.message}`,
          error: result2.error
        };
      }

      // Check container still exists
      const containerAfterSecond = document.getElementById(containerId);
      if (!containerAfterSecond) {
        return {
          success: false,
          message: 'Container was removed after second operation'
        };
      }

      return {
        success: true,
        message: 'DOM container persistence test passed'
      };
    } finally {
      // Cleanup
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      clearAllRecaptchaVerifiers();
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing DOM persistence: ${error.message}`,
      error
    };
  }
};

/**
 * Test development mode bypass functionality
 */
export const testDevelopmentBypass = async (): Promise<OTPTestResult> => {
  try {
    console.log('Testing development mode bypass functionality');

    const testPhones = ['+917902467075', '+16505551234', '+919876543210'];
    const containerId = `test-bypass-container-${Date.now()}`;

    // Create container
    const container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    try {
      for (const phone of testPhones) {
        console.log(`Testing bypass for ${phone}`);
        const result = await testOTPSending(phone, containerId);

        if (!result.success) {
          return {
            success: false,
            message: `Bypass test failed for ${phone}: ${result.message}`,
            error: result.error
          };
        }
      }

      return {
        success: true,
        message: 'Development bypass test passed for all test numbers'
      };
    } finally {
      // Cleanup
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
      clearAllRecaptchaVerifiers();
    }
  } catch (error) {
    return {
      success: false,
      message: `Error testing development bypass: ${error.message}`,
      error
    };
  }
};

/**
 * Run all OTP tests including new DOM persistence tests
 */
export const runOTPTests = async (): Promise<void> => {
  console.log('🧪 Starting comprehensive OTP functionality tests...');

  // Use test phone number for development
  const testPhone = process.env.NODE_ENV === 'development'
    ? '+917902467075'
    : '+919876543210'; // Replace with actual test number

  const testContainerId = `test-otp-container-${Date.now()}`;

  // Create test container
  const testDiv = document.createElement('div');
  testDiv.id = testContainerId;
  testDiv.style.position = 'absolute';
  testDiv.style.top = '-9999px';
  testDiv.style.left = '-9999px';
  document.body.appendChild(testDiv);

  try {
    // Test 1: Basic OTP sending
    console.log('\n📱 Test 1: Basic OTP sending');
    const sendResult = await testOTPSending(testPhone, testContainerId);
    console.log(sendResult.success ? '✅' : '❌', sendResult.message);

    // Test 2: OTP resending
    console.log('\n🔄 Test 2: OTP resending');
    const resendResult = await testOTPResending(testPhone, testContainerId);
    console.log(resendResult.success ? '✅' : '❌', resendResult.message);

    // Test 3: Multiple containers
    console.log('\n🔀 Test 3: Multiple containers');
    const multiResult = await testMultipleContainers(testPhone);
    console.log(multiResult.success ? '✅' : '❌', multiResult.message);

    // Test 4: DOM container persistence
    console.log('\n🏠 Test 4: DOM container persistence');
    const persistenceResult = await testDOMContainerPersistence();
    console.log(persistenceResult.success ? '✅' : '❌', persistenceResult.message);

    // Test 5: Development mode bypass
    console.log('\n🚀 Test 5: Development mode bypass');
    const bypassResult = await testDevelopmentBypass();
    console.log(bypassResult.success ? '✅' : '❌', bypassResult.message);

    console.log('\n🎉 All OTP tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    // Cleanup
    if (document.body.contains(testDiv)) {
      document.body.removeChild(testDiv);
    }
    clearAllRecaptchaVerifiers();
  }
};

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testOTP = {
    runOTPTests,
    testOTPSending,
    testOTPResending,
    testMultipleContainers
  };
}
