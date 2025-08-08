/**
 * Custom Authentication Functions
 * Replaces Firebase phone authentication with SMS OTP
 * Maintains compatibility with existing auth flow
 */

import { 
  sendOTP as sendSMSOTP, 
  verifyOTP as verifySMSOTP,
  getOTPRemainingTime,
  canResendOTP,
  getResendCooldownTime,
  clearOTPSession,
  getCurrentProvider
} from '../services/smsOtpService';

import {
  signInWithPhone,
  signOut as customSignOut,
  onAuthStateChanged as customOnAuthStateChanged,
  getCurrentUser as getCustomCurrentUser,
  CustomUser
} from '../services/customAuthService';

import { getDocument, setDocument, updateDocument } from './firestore';
import { User as UserType } from './schema';

// Mock confirmation result to maintain compatibility with existing code
interface MockConfirmationResult {
  confirm: (otp: string) => Promise<{ user: MockUser }>;
  phoneNumber: string;
}

// Mock user to maintain compatibility
interface MockUser {
  uid: string;
  phoneNumber: string;
  displayName?: string;
}

// Store pending OTP sessions
const pendingOTPSessions = new Map<string, {
  phoneNumber: string;
  timestamp: number;
}>();

/**
 * Clear all recaptcha verifiers (compatibility function - no-op for SMS)
 */
export const clearAllRecaptchaVerifiers = (): void => {
  console.log('clearAllRecaptchaVerifiers called (no-op for SMS OTP)');
};

/**
 * Clear specific recaptcha verifier (compatibility function - no-op for SMS)
 */
export const clearRecaptchaVerifier = (containerId: string): void => {
  console.log(`clearRecaptchaVerifier called for ${containerId} (no-op for SMS OTP)`);
};

/**
 * Force reset recaptcha (compatibility function - no-op for SMS)
 */
export const forceResetRecaptcha = (containerId: string): Promise<void> => {
  console.log(`forceResetRecaptcha called for ${containerId} (no-op for SMS OTP)`);
  return Promise.resolve();
};

/**
 * Create fresh recaptcha container (compatibility function - returns same ID for SMS)
 */
export const createFreshRecaptchaContainer = (oldContainerId: string): string => {
  console.log(`createFreshRecaptchaContainer called for ${oldContainerId} (returning same ID for SMS OTP)`);
  return oldContainerId;
};

/**
 * Initialize recaptcha (compatibility function - no-op for SMS)
 */
export const initRecaptcha = (containerId: string): any => {
  console.log(`initRecaptcha called for ${containerId} (no-op for SMS OTP)`);
  return null;
};

/**
 * Send OTP to phone number using SMS service
 */
export const sendOTP = async (
  phoneNumber: string, 
  recaptchaContainerId: string, 
  isResend: boolean = false
): Promise<{
  success: boolean;
  confirmationResult?: MockConfirmationResult;
  actualContainerId?: string;
  error?: any;
  errorCode?: string;
  errorMessage?: string;
}> => {
  try {
    console.log(`Sending SMS OTP to ${phoneNumber} (isResend: ${isResend})`);
    
    // Send OTP via SMS service
    const result = await sendSMSOTP(phoneNumber, isResend);
    
    if (!result.success) {
      return {
        success: false,
        error: { message: result.error, code: result.errorCode },
        errorCode: result.errorCode,
        errorMessage: result.error,
      };
    }

    // Store pending session
    const sessionId = `${phoneNumber}_${Date.now()}`;
    pendingOTPSessions.set(sessionId, {
      phoneNumber,
      timestamp: Date.now(),
    });

    // Create mock confirmation result for compatibility
    const confirmationResult: MockConfirmationResult = {
      phoneNumber,
      confirm: async (otp: string) => {
        const verifyResult = await verifySMSOTP(phoneNumber, otp);
        
        if (!verifyResult.success) {
          throw new Error(verifyResult.error || 'OTP verification failed');
        }

        // Sign in user with custom auth service
        const signInResult = await signInWithPhone(phoneNumber);
        
        if (!signInResult.success) {
          throw new Error(signInResult.error || 'Failed to sign in user');
        }

        // Create mock user object
        const mockUser: MockUser = {
          uid: signInResult.user!.uid,
          phoneNumber: signInResult.user!.phoneNumber,
          displayName: signInResult.user!.displayName,
        };

        // Clean up pending session
        pendingOTPSessions.delete(sessionId);

        return { user: mockUser };
      },
    };

    console.log(`SMS OTP sent successfully to ${phoneNumber} via ${getCurrentProvider()}`);

    return {
      success: true,
      confirmationResult,
      actualContainerId: recaptchaContainerId, // Return same container ID for compatibility
    };
  } catch (error: any) {
    console.error('Error sending SMS OTP:', error);
    return {
      success: false,
      error: error,
      errorCode: 'SMS_OTP_ERROR',
      errorMessage: error.message || 'Failed to send SMS OTP',
    };
  }
};

/**
 * Verify OTP (compatibility wrapper)
 */
export const verifyOTP = async (confirmationResult: MockConfirmationResult, otp: string): Promise<{
  success: boolean;
  user?: MockUser;
  userExists?: boolean;
  isDeactivated?: boolean;
  error?: any;
}> => {
  try {
    console.log('Verifying SMS OTP...');
    
    if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
      throw new Error('Invalid confirmation result');
    }

    // Use the confirmation result's confirm method
    const result = await confirmationResult.confirm(otp);

    // Check if user exists in Firestore by phone number (not by UID)
    // Import the phone number lookup function
    const { queryDocuments, where } = await import('./firestore');
    const formattedPhone = result.user.phoneNumber.startsWith('+') ? result.user.phoneNumber : `+${result.user.phoneNumber}`;

    console.log('🔍 Checking if user exists by phone number:', formattedPhone);

    let userDoc: UserType | null = null;
    let userExists = false;

    try {
      // Try phoneNumber field first (camelCase)
      let users = await queryDocuments<UserType>(
        'Users',
        where('phoneNumber', '==', formattedPhone)
      );

      if (users.length > 0) {
        userDoc = users[0];
        userExists = true;
        console.log('✅ Found existing user by phoneNumber field:', userDoc.uid);
      } else {
        // Try phone_number field (underscore format) as fallback
        users = await queryDocuments<UserType>(
          'Users',
          where('phone_number', '==', formattedPhone)
        );

        if (users.length > 0) {
          userDoc = users[0];
          userExists = true;
          console.log('✅ Found existing user by phone_number field:', userDoc.uid);
        } else {
          console.log('❌ No existing user found with phone number:', formattedPhone);
        }
      }
    } catch (error) {
      console.error('Error looking up user by phone number:', error);
      userExists = false;
    }

    const isDeactivated = userDoc?.isDeactivated || false;

    console.log(`SMS OTP verified successfully for ${result.user.phoneNumber} (${userExists ? 'existing' : 'new'} user)`);

    // Handle deactivated user reactivation
    if (userExists && isDeactivated && userDoc) {
      await reactivateUserAccount(userDoc.uid);
      console.log('Deactivated user account reactivated');
    }

    // If user exists, update the result user object with the existing UID
    if (userExists && userDoc) {
      result.user.uid = userDoc.uid;
      result.user.displayName = userDoc.displayName;
      console.log('🔄 Updated user object with existing UID:', userDoc.uid);
    }

    return {
      success: true,
      user: result.user,
      userExists,
      isDeactivated,
    };
  } catch (error: any) {
    console.error('Error verifying SMS OTP:', error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Check if user exists (compatibility function)
 */
export const checkUserExists = async (phoneNumber: string): Promise<boolean> => {
  // For SMS OTP, we'll check this after authentication
  // This maintains compatibility with existing flow
  return false;
};

/**
 * Create user in Firestore
 */
export const createUser = async (
  uid: string,
  displayName: string,
  phoneNumber: string,
  address?: Partial<UserType['listOfAddress'][0]>
): Promise<string> => {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    const userData: Partial<UserType> = {
      uid,
      displayName,
      phone_number: formattedPhone,
      phoneNumber: formattedPhone,
      createdTime: new Date() as any,
      isDeactivated: false,
      isNewCustomer: true,
      keywords: generateKeywords(displayName),
      listOfAddress: address ? [address as any] : [],
      role: 'customer',
    };

    if (address) {
      (userData.listOfAddress![0] as any).phoneNumber = formattedPhone;
    }

    await setDocument('Users', uid, userData);
    console.log('User created with ID:', uid);
    return uid;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Get current user data from Firestore
 */
export const getCurrentUserData = async (): Promise<UserType | null> => {
  try {
    const currentUser = getCustomCurrentUser();
    if (!currentUser) {
      console.log('No current user found in custom auth');
      return null;
    }

    console.log('Fetching user data for UID:', currentUser.uid);
    const userData = await getDocument<UserType>('Users', currentUser.uid);

    if (!userData) {
      console.warn('User document not found in Firestore for UID:', currentUser.uid);
      return null;
    }

    console.log('User data fetched successfully:', userData);
    return userData;
  } catch (error) {
    console.error('Error getting current user data:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid: string, data: Partial<UserType>): Promise<void> => {
  try {
    await updateDocument<UserType>('Users', uid, data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Sign out user
 */
export const signOut = async (): Promise<void> => {
  try {
    await customSignOut();
    // Clear any pending OTP sessions
    pendingOTPSessions.clear();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Deactivate user account
 */
export const deactivateUserAccount = async (uid: string): Promise<void> => {
  try {
    await updateDocument<UserType>('Users', uid, {
      isDeactivated: true,
      updatedAt: new Date() as any,
    });
    console.log('User account deactivated successfully:', uid);
  } catch (error) {
    console.error('Error deactivating user account:', error);
    throw error;
  }
};

/**
 * Reactivate user account
 */
export const reactivateUserAccount = async (uid: string): Promise<void> => {
  try {
    await updateDocument<UserType>('Users', uid, {
      isDeactivated: false,
      updatedAt: new Date() as any,
    });
    console.log('User account reactivated successfully:', uid);
  } catch (error) {
    console.error('Error reactivating user account:', error);
    throw error;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback: (user: any) => void): (() => void) => {
  return customOnAuthStateChanged((customUser) => {
    // Convert custom user to Firebase-like user for compatibility
    const firebaseUser = customUser ? {
      uid: customUser.uid,
      phoneNumber: customUser.phoneNumber,
      displayName: customUser.displayName,
    } : null;
    
    callback(firebaseUser);
  });
};

/**
 * Generate keywords for search functionality
 */
const generateKeywords = (displayName: string): string[] => {
  const name = displayName.toLowerCase();
  const keywords: string[] = [];

  let currentKeyword = '';
  for (const char of name) {
    currentKeyword += char;
    if (currentKeyword.trim()) {
      keywords.push(currentKeyword);
    }
  }

  if (!keywords.includes(name)) {
    keywords.push(name);
  }

  const nameParts = name.split(' ');
  for (const part of nameParts) {
    if (part.trim() && !keywords.includes(part)) {
      keywords.push(part);
    }
  }

  return [...new Set(keywords)];
};

// Export auth object for compatibility
export const auth = {
  currentUser: getCustomCurrentUser(),
};
