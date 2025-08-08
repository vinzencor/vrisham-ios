import {
  signInWithPhoneNumber,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './config';
import { getDocument, addDocument, updateDocument, setDocument } from './firestore';
import { User as UserType } from './schema';

// Store RecaptchaVerifier instances by container ID to avoid conflicts
const recaptchaVerifiers: Map<string, RecaptchaVerifier> = new Map();

/**
 * Clear a specific RecaptchaVerifier instance with enhanced cleanup
 */
export const clearRecaptchaVerifier = (containerId: string): void => {
  const verifier = recaptchaVerifiers.get(containerId);
  if (verifier) {
    try {
      verifier.clear();
      console.log(`reCAPTCHA verifier cleared for container: ${containerId}`);
    } catch (e) {
      console.warn(`Failed to clear reCAPTCHA for container ${containerId}:`, e);
    }
    recaptchaVerifiers.delete(containerId);
  }

  // Additional cleanup: ensure DOM container is clean
  const container = document.getElementById(containerId);
  if (container) {
    try {
      // Clear any residual reCAPTCHA widgets
      container.innerHTML = '';
      // Remove any reCAPTCHA-related attributes
      container.removeAttribute('data-sitekey');
      container.removeAttribute('data-callback');
      container.removeAttribute('data-expired-callback');
      container.removeAttribute('data-error-callback');
      console.log(`DOM container cleaned for: ${containerId}`);
    } catch (e) {
      console.warn(`Failed to clean DOM container ${containerId}:`, e);
    }
  }
};

/**
 * Clear all RecaptchaVerifier instances with enhanced cleanup
 */
export const clearAllRecaptchaVerifiers = (): void => {
  recaptchaVerifiers.forEach((verifier, containerId) => {
    try {
      verifier.clear();
      console.log(`reCAPTCHA verifier cleared for container: ${containerId}`);
    } catch (e) {
      console.warn(`Failed to clear reCAPTCHA for container ${containerId}:`, e);
    }

    // Clean DOM container
    const container = document.getElementById(containerId);
    if (container) {
      try {
        container.innerHTML = '';
        container.removeAttribute('data-sitekey');
        container.removeAttribute('data-callback');
        container.removeAttribute('data-expired-callback');
        container.removeAttribute('data-error-callback');
      } catch (e) {
        console.warn(`Failed to clean DOM container ${containerId}:`, e);
      }
    }
  });
  recaptchaVerifiers.clear();
};

/**
 * Force complete reset of reCAPTCHA for a specific container
 * This is specifically designed for resend OTP scenarios
 */
export const forceResetRecaptcha = (containerId: string): Promise<void> => {
  return new Promise((resolve) => {
    console.log(`Force resetting reCAPTCHA for container: ${containerId}`);

    // Step 1: Clear existing verifier
    clearRecaptchaVerifier(containerId);

    // Step 2: Verify container exists and is accessible
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found during force reset`);
      resolve();
      return;
    }

    // Step 3: Ensure container is completely clean
    try {
      container.innerHTML = '';
      container.className = container.className.replace(/grecaptcha-\w+/g, '');

      // Remove any Google reCAPTCHA specific attributes
      const attributesToRemove = [
        'data-sitekey', 'data-callback', 'data-expired-callback',
        'data-error-callback', 'data-size', 'data-theme'
      ];
      attributesToRemove.forEach(attr => container.removeAttribute(attr));

      console.log(`Container ${containerId} forcefully cleaned`);
    } catch (e) {
      console.warn(`Error during container cleanup for ${containerId}:`, e);
    }

    // Step 4: Small delay to ensure cleanup is complete
    setTimeout(() => {
      console.log(`Force reset complete for container: ${containerId}`);
      resolve();
    }, 100);
  });
};

/**
 * Create a completely new reCAPTCHA container to bypass Google's widget registry
 * This is the key to solving the "already rendered" error
 */
export const createFreshRecaptchaContainer = (oldContainerId: string): string => {
  console.log(`Creating fresh reCAPTCHA container to replace: ${oldContainerId}`);

  // Generate a completely new unique container ID
  const newContainerId = `recaptcha-fresh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Remove the old container completely from DOM
  const oldContainer = document.getElementById(oldContainerId);
  if (oldContainer && oldContainer.parentNode) {
    console.log(`Removing old container: ${oldContainerId}`);
    oldContainer.parentNode.removeChild(oldContainer);
  }

  // Clear any verifier associated with the old container
  clearRecaptchaVerifier(oldContainerId);

  // Create a completely new container element
  const newContainer = document.createElement('div');
  newContainer.id = newContainerId;
  newContainer.className = 'hidden';
  newContainer.style.position = 'absolute';
  newContainer.style.top = '-9999px';
  newContainer.style.left = '-9999px';

  // Add to DOM
  document.body.appendChild(newContainer);

  console.log(`Created fresh container: ${newContainerId}`);
  return newContainerId;
};

/**
 * Initialize the RecaptchaVerifier with enhanced error handling and cleanup
 */
export const initRecaptcha = (containerId: string): RecaptchaVerifier => {
  // Validate container exists in DOM
  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`reCAPTCHA container with ID '${containerId}' not found in DOM`);
  }

  // Clear any existing verifier for this container with enhanced cleanup
  clearRecaptchaVerifier(containerId);

  // Ensure container is in a clean state
  try {
    container.innerHTML = '';
    container.className = container.className.replace(/grecaptcha-\w+/g, '');

    // Verify container is ready for new verifier
    if (container.children.length > 0) {
      console.warn(`Container ${containerId} still has children after cleanup, forcing clear`);
      container.innerHTML = '';
    }
  } catch (e) {
    console.warn(`Error preparing container ${containerId}:`, e);
  }

  try {
    // Create new RecaptchaVerifier with enhanced callbacks
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log(`reCAPTCHA verified successfully for container: ${containerId}`);
      },
      'expired-callback': () => {
        console.log(`reCAPTCHA expired for container: ${containerId}`);
        // Don't auto-clear on expiry to avoid conflicts during resend
        console.log(`reCAPTCHA expired but keeping verifier for potential resend`);
      },
      'error-callback': (error: any) => {
        console.error(`reCAPTCHA error for container ${containerId}:`, error);
        // Only clear if it's a critical error, not a temporary one
        if (error?.code !== 'network-request-failed') {
          clearRecaptchaVerifier(containerId);
        }
      }
    });

    // Store the verifier
    recaptchaVerifiers.set(containerId, verifier);

    console.log(`reCAPTCHA verifier initialized for container: ${containerId}`);
    return verifier;
  } catch (error) {
    console.error(`Failed to initialize reCAPTCHA for container ${containerId}:`, error);
    throw error;
  }
};

// Note: Development bypasses removed to ensure real OTP verification
// All phone numbers now require actual SMS verification

/**
 * Send OTP to the provided phone number with widget ID-based reset for resend scenarios
 */
export const sendOTP = async (phoneNumber: string, recaptchaContainerId: string, isResend: boolean = false): Promise<any> => {
  let verifier: RecaptchaVerifier | null = null;
  let actualContainerId = recaptchaContainerId;

  try {
    // Validate inputs
    if (!phoneNumber || !recaptchaContainerId) {
      throw new Error('Phone number and reCAPTCHA container ID are required');
    }

    // Make sure phone number is in E.164 format
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Validate phone number format
    if (!/^\+[1-9]\d{1,14}$/.test(formattedPhone)) {
      throw new Error('Invalid phone number format');
    }

    console.log(`Sending OTP to ${formattedPhone} using container ${recaptchaContainerId}`);

    // Note: All phone numbers now require real SMS verification
    // No development bypasses are allowed

    // If this is a resend operation, create a completely fresh container
    // This bypasses Google's internal widget registry entirely
    if (isResend) {
      console.log('Resend operation detected, creating fresh container to bypass widget registry...');
      actualContainerId = createFreshRecaptchaContainer(recaptchaContainerId);
      console.log(`Using fresh container ID: ${actualContainerId}`);
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 200));
    } else {
      // Wait a bit to ensure DOM is ready for initial send
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if container exists in DOM before proceeding
    const containerExists = document.getElementById(actualContainerId);
    if (!containerExists) {
      console.error(`reCAPTCHA container ${actualContainerId} not found in DOM`);
      throw new Error(`reCAPTCHA container with ID '${actualContainerId}' not found in DOM`);
    }

    // Initialize recaptcha with retry logic
    let initAttempts = 0;
    const maxInitAttempts = 3;

    while (initAttempts < maxInitAttempts) {
      try {
        verifier = initRecaptcha(actualContainerId);
        break;
      } catch (initError: any) {
        initAttempts++;
        console.warn(`reCAPTCHA init attempt ${initAttempts} failed:`, initError);

        if (initAttempts >= maxInitAttempts) {
          throw new Error(`Failed to initialize reCAPTCHA after ${maxInitAttempts} attempts: ${initError.message}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!verifier) {
      throw new Error('Failed to initialize reCAPTCHA verifier');
    }

    // Render the reCAPTCHA to ensure it's ready
    console.log('Rendering reCAPTCHA...');
    await verifier.render();
    console.log('reCAPTCHA rendered successfully');

    // Send verification code
    console.log('Sending verification code...');
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    console.log('OTP sent successfully');

    return { success: true, confirmationResult, actualContainerId };
  } catch (error: any) {
    console.error('Error sending OTP:', error);

    // Clear reCAPTCHA on error
    if (actualContainerId) {
      clearRecaptchaVerifier(actualContainerId);
    }

    // Note: Development fallbacks removed to ensure real OTP verification
    // All errors now require proper handling without bypasses

    // Handle specific error codes
    let errorMessage = error?.message || 'Unknown error occurred';
    let errorCode = error?.code || 'unknown';

    // Map Firebase error codes to user-friendly messages
    switch (errorCode) {
      case 'auth/argument-error':
        errorMessage = 'Invalid request parameters. Please try again.';
        console.error('Firebase argument error details:', error);
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many requests. Please try again later or use a different phone number.';
        break;
      case 'auth/invalid-phone-number':
        errorMessage = 'Invalid phone number format. Please check and try again.';
        break;
      case 'auth/invalid-app-credential':
        errorMessage = 'App verification failed. Please refresh the page and try again.';
        break;
      case 'auth/captcha-check-failed':
        errorMessage = 'Security verification failed. Please refresh the page and try again.';
        break;
      case 'auth/quota-exceeded':
        errorMessage = 'SMS quota exceeded. Please try again later.';
        break;
      default:
        if (errorMessage.includes('reCAPTCHA') || errorMessage.includes('container')) {
          errorMessage = 'Security verification failed. Please refresh the page and try again.';
        }
        break;
    }

    return {
      success: false,
      error,
      errorCode,
      errorMessage
    };
  }
};

/**
 * Verify OTP and sign in the user
 */
export const verifyOTP = async (confirmationResult: any, otp: string): Promise<any> => {
  try {
    // Check if this is a mock confirmation result (development mode)
    if (confirmationResult && typeof confirmationResult.confirm === 'function') {
      // Add timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OTP verification timeout')), 30000)
      );

      // Race between confirmation and timeout
      const userCredential = await Promise.race([
        confirmationResult.confirm(otp),
        timeoutPromise
      ]);

      const user = userCredential.user;

      // Check if user exists in Firestore after authentication
      try {
        console.log('=== FIREBASE AUTH: Checking if user exists in Firestore for UID ===', user.uid);
        const userDoc = await getDocument<UserType>('Users', user.uid);
        const userExists = !!userDoc;

        console.log(`=== FIREBASE AUTH: Real user check - ${userExists ? 'existing' : 'new'} user for UID ===`, user.uid);

        if (!userExists) {
          console.log('=== FIREBASE AUTH: New user detected - will need to show registration form ===');
          return {
            success: true,
            user: user,
            userExists: false,
            isDeactivated: false
          };
        } else {
          // Check if the user account is deactivated
          const isDeactivated = userDoc.isDeactivated || false;
          console.log(`=== FIREBASE AUTH: Existing user detected - deactivated: ${isDeactivated} ===`);

          if (isDeactivated) {
            console.log('=== FIREBASE AUTH: Deactivated user detected - will need reactivation ===');
            // Automatically reactivate the account
            await reactivateUserAccount(user.uid);
            console.log('=== FIREBASE AUTH: Account reactivated successfully ===');
          }

          return {
            success: true,
            user: user,
            userExists: true,
            isDeactivated: isDeactivated
          };
        }
      } catch (error) {
        console.error('=== FIREBASE AUTH: Error checking user existence ===', error);
        // If we can't check, assume new user to be safe
        return {
          success: true,
          user: user,
          userExists: false,
          isDeactivated: false
        };
      }
    } else {
      throw new Error('Invalid confirmation result');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error };
  }
};

/**
 * Check if a user exists in the database
 */
export const checkUserExists = async (phoneNumber: string): Promise<boolean> => {
  try {
    // Since we're in the authentication flow, we can't rely on Firestore security rules
    // that require authentication. Instead, we'll check if the user exists after they've
    // authenticated with phone number.

    // We'll use the phone auth credential to sign in, and then check if the user has a
    // document in Firestore. If not, we'll need to create one.

    // This function now just returns false, and we'll handle the user creation after
    // successful authentication
    return false;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    return false;
  }
};

/**
 * Create a new user in the database
 */
export const createUser = async (
  uid: string,
  displayName: string,
  phoneNumber: string,
  address?: Partial<UserType['listOfAddress'][0]>
): Promise<string> => {
  try {
    // Format phone number consistently
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

    // Create user data object with required fields
    const userData: Partial<UserType> = {
      uid,
      displayName,
      phone_number: formattedPhone, // Store phone number with underscore for compatibility
      phoneNumber: formattedPhone, // Store phone number in camelCase as well
      createdTime: new Date() as any, // Will be converted to Timestamp
      isDeactivated: false,
      isNewCustomer: true,
      keywords: generateKeywords(displayName),
      listOfAddress: address ? [address as any] : [],
      role: 'customer',
    };

    // If address is provided, add phone number to it as well
    if (address) {
      (userData.listOfAddress![0] as any).phoneNumber = formattedPhone;
    }

    console.log('Creating user with data:', userData);

    try {
      // Set document with UID as the document ID
      await setDocument('Users', uid, userData);
      console.log('User created with ID:', uid);
      return uid;
    } catch (error) {
      console.error('Error in setDocument:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Get the current user's data from Firestore
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
      console.log('User exists in Firebase Auth but not in Firestore - this indicates a new user');

      // Don't automatically create a user profile here
      // Let the AuthModal handle new user registration
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
 * Sign out the current user
 */
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
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
      updatedAt: new Date() as any // Will be converted to Timestamp
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
      updatedAt: new Date() as any // Will be converted to Timestamp
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
export const onAuthChange = (callback: (user: User | null) => void): () => void => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Generate keywords for search functionality
 */
const generateKeywords = (displayName: string): string[] => {
  const name = displayName.toLowerCase();
  const keywords: string[] = [];

  // Generate prefixes
  let currentKeyword = '';
  for (const char of name) {
    currentKeyword += char;
    if (currentKeyword.trim()) {
      keywords.push(currentKeyword);
    }
  }

  // Add full name
  if (!keywords.includes(name)) {
    keywords.push(name);
  }

  // Add name parts (for multi-word names)
  const nameParts = name.split(' ');
  for (const part of nameParts) {
    if (part.trim() && !keywords.includes(part)) {
      keywords.push(part);
    }
  }

  return [...new Set(keywords)]; // Remove duplicates
};
