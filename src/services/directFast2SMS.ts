import { signInWithCustomToken } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

// Fast2SMS API configuration
const FAST2SMS_API_KEY = 'ETyZs2Dvu7Ia4mi6P80bhSjgNxXJKWt1cYrAHwlBpo5zGfF3d9';
const FAST2SMS_BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';

// In-memory OTP storage (for demo - in production use Firebase)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

interface OTPResult {
  success: boolean;
  error?: string;
  message?: string;
}

interface VerifyResult {
  success: boolean;
  error?: string;
  user?: any;
  userExists?: boolean;
  isDeactivated?: boolean;
}

/**
 * Generate a 6-digit OTP
 */
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP directly via Fast2SMS API
 */
export const sendOTPDirect = async (phoneNumber: string): Promise<OTPResult> => {
  try {
    console.log('📱 Sending OTP directly via Fast2SMS to:', phoneNumber);

    // Format phone number (remove +91 if present)
    const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    
    if (cleanNumber.length !== 10) {
      return {
        success: false,
        error: 'Invalid phone number format'
      };
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('🔐 Generated OTP:', otp);

    // Store OTP with 5-minute expiry
    const expiresAt = Date.now() + (5 * 60 * 1000);
    otpStore.set(phoneNumber, { otp, expiresAt });

    // Create SMS message
    const message = `Your Vrisham verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;

    // Fast2SMS API URL
    const apiUrl = `${FAST2SMS_BASE_URL}?authorization=${FAST2SMS_API_KEY}&variables_values=${otp}&route=otp&numbers=${cleanNumber}`;

    console.log('📡 Calling Fast2SMS API...');

    // Send SMS via Fast2SMS
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Fast2SMS Response Status:', response.status);

    if (response.ok) {
      const responseData = await response.text();
      console.log('📡 Fast2SMS Response:', responseData);
      
      console.log('✅ OTP sent successfully via Fast2SMS');
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    } else {
      const errorData = await response.text();
      console.error('❌ Fast2SMS API error:', response.status, errorData);
      
      return {
        success: false,
        error: 'Failed to send OTP via SMS service'
      };
    }

  } catch (error) {
    console.error('❌ Error sending OTP:', error);
    return {
      success: false,
      error: 'Failed to send OTP. Please try again.'
    };
  }
};

/**
 * Verify OTP and authenticate user
 */
export const verifyOTPDirect = async (phoneNumber: string, otp: string): Promise<VerifyResult> => {
  try {
    console.log('🔐 Verifying OTP for:', phoneNumber);

    // Check if OTP exists and is valid
    const storedOTP = otpStore.get(phoneNumber);
    
    if (!storedOTP) {
      return {
        success: false,
        error: 'No OTP found for this phone number. Please request a new OTP.'
      };
    }

    if (Date.now() > storedOTP.expiresAt) {
      otpStore.delete(phoneNumber);
      return {
        success: false,
        error: 'OTP has expired. Please request a new OTP.'
      };
    }

    if (storedOTP.otp !== otp) {
      return {
        success: false,
        error: 'Invalid OTP. Please try again.'
      };
    }

    // OTP is valid, remove from store
    otpStore.delete(phoneNumber);
    console.log('✅ OTP verified successfully');

    // Check if user exists in Firestore
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const usersRef = collection(db, 'Users');
    const userQuery = query(usersRef, where('phoneNumber', '==', formattedPhone));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      // Existing user found
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;

      console.log('✅ Existing user found:', userId);

      // Create a simple user object for Firebase Auth
      // Since we don't have Firebase Admin SDK on client, we'll use a different approach
      const mockUser = {
        uid: userId,
        phoneNumber: formattedPhone,
        email: userData.email || null,
        displayName: userData.displayName || userData.name || null
      };

      // Check if account is deactivated
      const isDeactivated = userData.isDeactivated || false;

      return {
        success: true,
        user: mockUser,
        userExists: true,
        isDeactivated
      };

    } else {
      // New user
      console.log('🆕 New user detected');
      
      // Create a temporary user ID for new users
      const tempUserId = `user_${formattedPhone.replace(/[^0-9]/g, '')}`;
      
      const mockUser = {
        uid: tempUserId,
        phoneNumber: formattedPhone,
        email: null,
        displayName: null
      };

      return {
        success: true,
        user: mockUser,
        userExists: false,
        isDeactivated: false
      };
    }

  } catch (error) {
    console.error('❌ Error verifying OTP:', error);
    return {
      success: false,
      error: 'Failed to verify OTP. Please try again.'
    };
  }
};

/**
 * Check if user exists by phone number
 */
export const checkUserExists = async (phoneNumber: string): Promise<boolean> => {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const usersRef = collection(db, 'Users');
    const userQuery = query(usersRef, where('phoneNumber', '==', formattedPhone));
    const userSnapshot = await getDocs(userQuery);
    
    return !userSnapshot.empty;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};
