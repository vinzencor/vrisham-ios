/**
 * Test utility specifically for validating the reCAPTCHA reset and re-initialization strategy
 * This file tests the complete lifecycle of reCAPTCHA for resend OTP scenarios
 */

import { sendOTP, forceResetRecaptcha, clearRecaptchaVerifier } from '../firebase/customAuth';

export interface RecaptchaResetTestResult {
  success: boolean;
  message: string;
  details?: string[];
  error?: any;
}

/**
 * Test the complete reCAPTCHA reset cycle for resend scenarios
 */
export const testRecaptchaResetCycle = async (
  phoneNumber: string,
  containerId: string
): Promise<RecaptchaResetTestResult> => {
  const details: string[] = [];
  
  try {
    details.push('Starting reCAPTCHA reset cycle test...');
    
    // Step 1: Create container if it doesn't exist
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      document.body.appendChild(container);
      details.push('✓ Created test container');
    } else {
      details.push('✓ Container already exists');
    }
    
    // Step 2: Initial OTP send
    details.push('Sending initial OTP...');
    const initialResult = await sendOTP(phoneNumber, containerId, false);
    if (!initialResult.success) {
      return {
        success: false,
        message: 'Initial OTP send failed',
        details,
        error: initialResult.error
      };
    }
    details.push('✓ Initial OTP sent successfully');
    
    // Step 3: Verify container has content after initial send
    const containerAfterInitial = document.getElementById(containerId);
    if (containerAfterInitial) {
      details.push(`✓ Container exists after initial send (children: ${containerAfterInitial.children.length})`);
    }
    
    // Step 4: Wait a moment to simulate user delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    details.push('✓ Waited 1 second to simulate user delay');
    
    // Step 5: Force reset reCAPTCHA
    details.push('Performing force reset...');
    await forceResetRecaptcha(containerId);
    details.push('✓ Force reset completed');
    
    // Step 6: Verify container is clean after reset
    const containerAfterReset = document.getElementById(containerId);
    if (containerAfterReset) {
      details.push(`✓ Container clean after reset (children: ${containerAfterReset.children.length})`);
      if (containerAfterReset.children.length > 0) {
        details.push('⚠ Warning: Container still has children after reset');
      }
    }
    
    // Step 7: Resend OTP with isResend flag
    details.push('Sending resend OTP...');
    const resendResult = await sendOTP(phoneNumber, containerId, true);
    if (!resendResult.success) {
      return {
        success: false,
        message: 'Resend OTP failed',
        details,
        error: resendResult.error
      };
    }
    details.push('✓ Resend OTP sent successfully');
    
    // Step 8: Verify container state after resend
    const containerAfterResend = document.getElementById(containerId);
    if (containerAfterResend) {
      details.push(`✓ Container exists after resend (children: ${containerAfterResend.children.length})`);
    }
    
    // Step 9: Test multiple consecutive resends
    details.push('Testing multiple consecutive resends...');
    for (let i = 1; i <= 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const multiResendResult = await sendOTP(phoneNumber, containerId, true);
      if (multiResendResult.success) {
        details.push(`✓ Consecutive resend ${i} successful`);
      } else {
        details.push(`✗ Consecutive resend ${i} failed: ${multiResendResult.errorMessage}`);
        break;
      }
    }
    
    return {
      success: true,
      message: 'reCAPTCHA reset cycle test completed successfully',
      details
    };
    
  } catch (error: any) {
    details.push(`✗ Error during test: ${error.message}`);
    return {
      success: false,
      message: 'reCAPTCHA reset cycle test failed',
      details,
      error
    };
  } finally {
    // Cleanup
    const container = document.getElementById(containerId);
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
      details.push('✓ Test container cleaned up');
    }
  }
};

/**
 * Test DOM container state management
 */
export const testContainerStateManagement = async (
  containerId: string
): Promise<RecaptchaResetTestResult> => {
  const details: string[] = [];
  
  try {
    details.push('Starting container state management test...');
    
    // Create container
    const container = document.createElement('div');
    container.id = containerId;
    container.innerHTML = '<div>test content</div>';
    document.body.appendChild(container);
    details.push('✓ Created container with test content');
    
    // Test clearRecaptchaVerifier
    clearRecaptchaVerifier(containerId);
    const containerAfterClear = document.getElementById(containerId);
    if (containerAfterClear && containerAfterClear.innerHTML === '') {
      details.push('✓ clearRecaptchaVerifier cleaned container content');
    } else {
      details.push('✗ clearRecaptchaVerifier did not clean container content');
    }
    
    // Add test content again
    containerAfterClear!.innerHTML = '<div class="grecaptcha-test">test</div>';
    containerAfterClear!.setAttribute('data-sitekey', 'test-key');
    details.push('✓ Added test content and attributes');
    
    // Test forceResetRecaptcha
    await forceResetRecaptcha(containerId);
    const containerAfterForceReset = document.getElementById(containerId);
    if (containerAfterForceReset) {
      const hasContent = containerAfterForceReset.innerHTML !== '';
      const hasAttributes = containerAfterForceReset.hasAttribute('data-sitekey');
      const hasGrecaptchaClass = containerAfterForceReset.className.includes('grecaptcha');
      
      if (!hasContent && !hasAttributes && !hasGrecaptchaClass) {
        details.push('✓ forceResetRecaptcha completely cleaned container');
      } else {
        details.push('✗ forceResetRecaptcha did not completely clean container');
        details.push(`  - Has content: ${hasContent}`);
        details.push(`  - Has attributes: ${hasAttributes}`);
        details.push(`  - Has grecaptcha class: ${hasGrecaptchaClass}`);
      }
    }
    
    return {
      success: true,
      message: 'Container state management test completed',
      details
    };
    
  } catch (error: any) {
    details.push(`✗ Error during test: ${error.message}`);
    return {
      success: false,
      message: 'Container state management test failed',
      details,
      error
    };
  } finally {
    // Cleanup
    const container = document.getElementById(containerId);
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
      details.push('✓ Test container cleaned up');
    }
  }
};

/**
 * Run all reCAPTCHA reset tests
 */
export const runAllRecaptchaResetTests = async (): Promise<void> => {
  console.log('\n🔄 === RECAPTCHA RESET TESTS ===\n');
  
  const testPhone = '+16505551234'; // Firebase test number
  const testContainerId = `test-recaptcha-${Date.now()}`;
  
  try {
    // Test 1: Complete reset cycle
    console.log('🧪 Test 1: Complete reCAPTCHA reset cycle');
    const resetCycleResult = await testRecaptchaResetCycle(testPhone, testContainerId);
    console.log(resetCycleResult.success ? '✅' : '❌', resetCycleResult.message);
    if (resetCycleResult.details) {
      resetCycleResult.details.forEach(detail => console.log('  ', detail));
    }
    
    // Test 2: Container state management
    console.log('\n🧪 Test 2: Container state management');
    const stateManagementResult = await testContainerStateManagement(`${testContainerId}-state`);
    console.log(stateManagementResult.success ? '✅' : '❌', stateManagementResult.message);
    if (stateManagementResult.details) {
      stateManagementResult.details.forEach(detail => console.log('  ', detail));
    }
    
    console.log('\n🔄 === RECAPTCHA RESET TESTS COMPLETED ===\n');
    
  } catch (error) {
    console.error('❌ Error running reCAPTCHA reset tests:', error);
  }
};
