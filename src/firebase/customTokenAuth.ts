/**
 * Custom Token Authentication Service
 * Uses Fast2SMS for OTP and Firebase Custom Tokens for authentication
 */

import { signInWithCustomToken, onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from './config';
import { query, where, getDocs, collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';
import { User as UserType } from './schema';

// Server URL for OTP operations
// Using hosted SMS proxy server on Render
const SERVER_URL = 'https://vrishamsmsproxy-1.onrender.com';

console.log('📡 Using SMS Proxy Server:', SERVER_URL);

export interface OTPResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  expiresAt?: number;
  phoneNumber?: string;
}

export interface AuthResult {
  success: boolean;
  user?: FirebaseUser;
  userExists?: boolean;
  isDeactivated?: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Send OTP via server
 */
export const sendOTP = async (phoneNumber: string): Promise<OTPResult> => {
  try {
    console.log(`📱 Sending OTP to ${phoneNumber} via server`);
    
    const response = await fetch(`${SERVER_URL}/api/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ OTP sent successfully');
      return {
        success: true,
        expiresAt: data.expiresAt,
        phoneNumber: data.phoneNumber,
      };
    } else {
      console.error('❌ Failed to send OTP:', data.error);
      return {
        success: false,
        error: data.error,
        errorCode: data.errorCode,
      };
    }
  } catch (error: any) {
    console.error('❌ Error sending OTP:', error);
    return {
      success: false,
      error: error.message || 'Failed to send OTP',
      errorCode: 'NETWORK_ERROR',
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
    console.log(`🔐 Verifying OTP for ${phoneNumber}`);
    
    // Step 1: Verify OTP with server and get Firebase token
    const response = await fetch(`${SERVER_URL}/api/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, otp }),
    });

    const data = await response.json();

    if (!data.success) {
      console.error('❌ OTP verification failed:', data.error);
      return {
        success: false,
        error: data.error,
        errorCode: data.errorCode,
      };
    }

    console.log('✅ OTP verified, received Firebase token');

    // Step 2: Check if this is an existing user from server response
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Step 2: Sign in with Firebase custom token (works for both existing and new users)
    const userCredential = await signInWithCustomToken(auth, data.firebaseToken);
    const firebaseUser = userCredential.user;

    console.log('✅ Signed in with Firebase:', firebaseUser.uid);

    // Step 3: Check if account is deactivated (for existing users)
    if (data.userExists) {
      console.log('✅ Existing user signed in successfully');

      // Check if user needs reactivation
      const userDoc = await getDoc(doc(db, 'Users', firebaseUser.uid));
      const isDeactivated = userDoc.exists() ? (userDoc.data().isDeactivated || false) : false;

      if (isDeactivated) {
        console.log('🔄 Reactivating deactivated account');
        await reactivateUserAccount(firebaseUser.uid);
      }

      return {
        success: true,
        user: firebaseUser,
        userExists: true,
        isDeactivated: isDeactivated
      };
    } else {
      console.log('🆕 New user signed in, will need profile creation');
      return {
        success: true,
        user: firebaseUser,
        userExists: false,
        isDeactivated: false
      };
    }

  } catch (error: any) {
    console.error('❌ Authentication error:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed',
      errorCode: 'AUTH_FAILED',
    };
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
    console.log(`👤 Checking if user exists with phone: ${phoneNumber}`);

    const usersRef = collection(db, 'Users');
    const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserType;
      console.log('✅ User found:', userData.uid);
      return {
        exists: true,
        userData,
      };
    }

    console.log('ℹ️  No user found with this phone number');
    return { exists: false };
  } catch (error) {
    console.error('❌ Error checking user existence:', error);
    return { exists: false };
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

    // Use Firebase setDoc function
    const userDocRef = doc(db, 'Users', uid);
    await setDoc(userDocRef, userData);
    console.log('✅ User profile created successfully');
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
};

/**
 * Reactivate user account
 */
const reactivateUserAccount = async (uid: string): Promise<void> => {
  try {
    const userDocRef = doc(db, 'Users', uid);
    await updateDoc(userDocRef, {
      isDeactivated: false,
      reactivatedAt: new Date(),
    });
    console.log('✅ User account reactivated');
  } catch (error) {
    console.error('❌ Error reactivating user account:', error);
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
      console.log('❌ No current user found in Firebase Auth');
      return null;
    }

    console.log('📋 Fetching user data for UID:', currentUser.uid);
    const userDocRef = doc(db, 'Users', currentUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      console.warn('⚠️  User document not found in Firestore for UID:', currentUser.uid);
      return null;
    }

    const userData = userDocSnap.data() as UserType;
    console.log('✅ User data fetched successfully');
    return userData;
  } catch (error) {
    console.error('❌ Error getting current user data:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (uid: string, data: Partial<UserType>): Promise<void> => {
  try {
    const userDocRef = doc(db, 'Users', uid);
    await updateDoc(userDocRef, data);
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
};

/**
 * Sign out user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
};

/**
 * Listen to authentication state changes
 */
export const onAuthChange = (callback: (user: FirebaseUser | null) => void): (() => void) => {
  return onAuthStateChanged(auth, (user) => {
    console.log('🔄 Firebase Auth state changed:', {
      isAuthenticated: !!user,
      uid: user?.uid,
      email: user?.email,
      phoneNumber: user?.phoneNumber
    });
    callback(user);
  });
};

// Export auth object for compatibility
export { auth };
