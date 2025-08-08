/**
 * Integrated Authentication Service
 * Combines Fast2SMS OTP verification with proper Firebase Auth integration
 * Ensures proper authentication tokens for Firebase Functions
 */

import {
  signInWithCustomToken,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from './config';
import { getDocument, setDocument, updateDocument } from './firestore';
import { query, where, getDocs, collection } from 'firebase/firestore';
import { db } from './config';
import { User as UserType } from './schema';
import { 
  sendOTP as sendSMSOTP, 
  verifyOTP as verifySMSOTP,
  getOTPRemainingTime,
  canResendOTP,
  getResendCooldownTime,
  clearOTPSession,
  getCurrentProvider
} from '../services/smsOtpService';

// Types for the integrated auth system
export interface AuthResult {
  success: boolean;
  user?: FirebaseUser;
  userExists?: boolean;
  isDeactivated?: boolean;
  error?: string;
  errorCode?: string;
}

export interface OTPResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  expiresAt?: number;
}

// Store pending OTP sessions
const pendingOTPSessions = new Map<string, {
  phoneNumber: string;
  timestamp: number;
  attempts: number;
}>();

/**
 * Send OTP via Fast2SMS
 */
export const sendOTP = async (
  phoneNumber: string, 
  isResend: boolean = false
): Promise<OTPResult> => {
  try {
    console.log(`Sending SMS OTP to ${phoneNumber} (isResend: ${isResend})`);
    
    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Send OTP via SMS service
    const result = await sendSMSOTP(formattedPhone, isResend);
    
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        errorCode: result.errorCode,
      };
    }

    // Store pending session
    pendingOTPSessions.set(formattedPhone, {
      phoneNumber: formattedPhone,
      timestamp: Date.now(),
      attempts: 0,
    });

    console.log(`SMS OTP sent successfully to ${formattedPhone}`);
    
    return {
      success: true,
      expiresAt: result.expiresAt,
    };
  } catch (error: any) {
    console.error('Error sending SMS OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP',
      errorCode: 'SMS_SEND_FAILED',
    };
  }
};

/**
 * Verify OTP and authenticate with Firebase
 */
export const verifyOTPAndAuthenticate = async (
  phoneNumber: string,
  otp: string
): Promise<AuthResult> => {
  try {
    console.log(`Verifying OTP for ${phoneNumber}`);
    
    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    // Verify OTP via SMS service
    const verifyResult = await verifySMSOTP(formattedPhone, otp);
    
    if (!verifyResult.success) {
      return {
        success: false,
        error: verifyResult.error || 'OTP verification failed',
        errorCode: verifyResult.errorCode || 'OTP_VERIFICATION_FAILED',
      };
    }

    console.log('OTP verified successfully, proceeding with Firebase authentication');

    // Check if user exists in Firestore by phone number
    const userExists = await checkUserExistsByPhone(formattedPhone);
    let firebaseUser: FirebaseUser;

    if (userExists.exists) {
      console.log('Existing user found, signing in with Firebase');
      // Sign in existing user
      firebaseUser = await signInExistingUser(userExists.userData!);
      
      // Check if account is deactivated
      const isDeactivated = userExists.userData!.isDeactivated || false;
      if (isDeactivated) {
        console.log('Reactivating deactivated account');
        await reactivateUserAccount(firebaseUser.uid);
      }

      return {
        success: true,
        user: firebaseUser,
        userExists: true,
        isDeactivated,
      };
    } else {
      console.log('New user, creating Firebase account');
      // Create new Firebase user
      firebaseUser = await createNewFirebaseUser(formattedPhone);
      
      return {
        success: true,
        user: firebaseUser,
        userExists: false,
        isDeactivated: false,
      };
    }
  } catch (error: any) {
    console.error('Error in OTP verification and authentication:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed',
      errorCode: 'AUTH_FAILED',
    };
  } finally {
    // Clean up pending session
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    pendingOTPSessions.delete(formattedPhone);
  }
};

/**
 * Check if user exists by phone number
 */
const checkUserExistsByPhone = async (phoneNumber: string): Promise<{
  exists: boolean;
  userData?: UserType;
}> => {
  try {
    console.log(`Checking if user exists with phone: ${phoneNumber}`);
    
    // Query users collection by phone number
    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserType;
      console.log('User found:', userData.uid);
      return {
        exists: true,
        userData,
      };
    }
    
    console.log('No user found with this phone number');
    return { exists: false };
  } catch (error) {
    console.error('Error checking user existence:', error);
    return { exists: false };
  }
};

/**
 * Sign in existing user with Firebase
 */
const signInExistingUser = async (userData: UserType): Promise<FirebaseUser> => {
  try {
    // For existing users, we'll use email/password authentication
    // The email will be derived from phone number for consistency
    const email = `${userData.phoneNumber.replace('+', '')}@vrisham.app`;
    const password = `vrisham_${userData.uid}_${userData.phoneNumber.replace('+', '')}`;
    
    try {
      // Try to sign in with existing credentials
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Signed in existing user successfully');
      return userCredential.user;
    } catch (signInError: any) {
      if (signInError.code === 'auth/user-not-found') {
        // User exists in Firestore but not in Firebase Auth, create Firebase Auth account
        console.log('Creating Firebase Auth account for existing Firestore user');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update Firebase Auth profile
        await updateProfile(userCredential.user, {
          displayName: userData.displayName,
        });
        
        return userCredential.user;
      }
      throw signInError;
    }
  } catch (error) {
    console.error('Error signing in existing user:', error);
    throw error;
  }
};

/**
 * Create new Firebase user
 */
const createNewFirebaseUser = async (phoneNumber: string): Promise<FirebaseUser> => {
  try {
    // Generate email and password for Firebase Auth
    const email = `${phoneNumber.replace('+', '')}@vrisham.app`;
    const password = `vrisham_${Date.now()}_${phoneNumber.replace('+', '')}`;
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Created new Firebase user:', userCredential.user.uid);
    
    return userCredential.user;
  } catch (error) {
    console.error('Error creating new Firebase user:', error);
    throw error;
  }
};

/**
 * Create user profile in Firestore
 */
export const createUserProfile = async (
  uid: string,
  displayName: string,
  phoneNumber: string,
  address?: Partial<UserType['listOfAddress'][0]>
): Promise<void> => {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Check if user already exists to prevent duplicates
    const existingUser = await checkUserExistsByPhone(formattedPhone);
    if (existingUser.exists) {
      throw new Error('User with this phone number already exists');
    }

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
    console.log('User profile created successfully');
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Reactivate user account
 */
const reactivateUserAccount = async (uid: string): Promise<void> => {
  try {
    await updateDocument('Users', uid, {
      isDeactivated: false,
      reactivatedAt: new Date(),
    });
    console.log('User account reactivated');
  } catch (error) {
    console.error('Error reactivating user account:', error);
    throw error;
  }
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

/**
 * Get current user data from Firestore
 */
export const getCurrentUserData = async (): Promise<UserType | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('No current user found in Firebase Auth');
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
    await firebaseSignOut(auth);
    // Clear any pending OTP sessions
    pendingOTPSessions.clear();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Listen to authentication state changes
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Export auth object for compatibility
export { auth };

// Export OTP utility functions
export {
  getOTPRemainingTime,
  canResendOTP,
  getResendCooldownTime,
  clearOTPSession,
  getCurrentProvider
};
