/**
 * Custom Authentication Service
 * Manages user authentication state without Firebase Auth
 * Compatible with existing Firestore user management
 */

import { getDocument, setDocument, updateDocument } from '../firebase/firestore';
import { User as UserType } from '../firebase/schema';

// Custom user interface for authentication
export interface CustomUser {
  uid: string;
  phoneNumber: string;
  displayName?: string;
  isAuthenticated: boolean;
  createdAt: number;
}

// Authentication state management
class CustomAuthManager {
  private currentUser: CustomUser | null = null;
  private authStateListeners: ((user: CustomUser | null) => void)[] = [];
  private readonly AUTH_STORAGE_KEY = 'vrisham_auth_user';

  constructor() {
    // Initialize from localStorage on startup
    this.initializeFromStorage();
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeFromStorage(): void {
    try {
      const storedUser = localStorage.getItem(this.AUTH_STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser) as CustomUser;
        // Validate stored user data
        if (user.uid && user.phoneNumber && user.isAuthenticated) {
          this.currentUser = user;
          console.log('Restored authentication state from storage:', user.uid);
        } else {
          // Invalid stored data, clear it
          localStorage.removeItem(this.AUTH_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error initializing auth from storage:', error);
      localStorage.removeItem(this.AUTH_STORAGE_KEY);
    }
  }

  /**
   * Save authentication state to localStorage
   */
  private saveToStorage(): void {
    try {
      if (this.currentUser) {
        localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(this.AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving auth state to storage:', error);
    }
  }

  /**
   * Set current user and notify listeners
   */
  private setCurrentUser(user: CustomUser | null): void {
    this.currentUser = user;
    this.saveToStorage();
    
    // Notify all listeners
    this.authStateListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  /**
   * Sign in user with phone number
   */
  async signInWithPhone(phoneNumber: string): Promise<{
    success: boolean;
    user?: CustomUser;
    userExists?: boolean;
    error?: string;
  }> {
    try {
      // Check if user exists in Firestore first
      let userDoc: UserType | null = null;
      let userExists = false;
      let uid: string;

      try {
        // Try to find existing user by phone number
        userDoc = await this.findUserByPhoneNumber(phoneNumber);
        userExists = !!userDoc;

        if (userExists) {
          // Use existing user's UID
          uid = userDoc!.uid;
          console.log('🔄 Existing user found, using UID:', uid);
        } else {
          // Generate new UID for new user
          uid = `phone_${phoneNumber.replace(/\D/g, '')}_${Date.now()}`;
          console.log('🆕 New user, generated UID:', uid);
        }
      } catch (error) {
        console.log('User lookup failed, treating as new user:', error);
        uid = `phone_${phoneNumber.replace(/\D/g, '')}_${Date.now()}`;
        userExists = false;
      }

      // Format phone number consistently
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      // Create custom user object
      const customUser: CustomUser = {
        uid,
        phoneNumber: formattedPhone,
        displayName: userDoc?.displayName,
        isAuthenticated: true,
        createdAt: Date.now(),
      };

      // Set as current user
      this.setCurrentUser(customUser);

      console.log(`User signed in successfully: ${formattedPhone} (${userExists ? 'existing' : 'new'} user) with UID: ${uid}`);

      return {
        success: true,
        user: customUser,
        userExists,
      };
    } catch (error: any) {
      console.error('Error signing in user:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in user',
      };
    }
  }

  /**
   * Find user by phone number in Firestore
   */
  private async findUserByPhoneNumber(phoneNumber: string): Promise<UserType | null> {
    try {
      // Format phone number consistently for lookup
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

      console.log('🔍 Looking up user by phone number:', formattedPhone);

      // Query users by phone number (both formats for compatibility)
      const { queryDocuments, where } = await import('../firebase/firestore');

      // Try phoneNumber field first (camelCase)
      let users = await queryDocuments<UserType>(
        'Users',
        where('phoneNumber', '==', formattedPhone)
      );

      if (users.length > 0) {
        console.log('✅ Found user by phoneNumber field:', users[0].uid);
        return users[0];
      }

      // Try phone_number field (underscore format) as fallback
      users = await queryDocuments<UserType>(
        'Users',
        where('phone_number', '==', formattedPhone)
      );

      if (users.length > 0) {
        console.log('✅ Found user by phone_number field:', users[0].uid);
        return users[0];
      }

      console.log('❌ No user found with phone number:', formattedPhone);
      return null;
    } catch (error) {
      console.error('Error looking up user by phone number:', error);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      console.log('Signing out user:', this.currentUser?.uid);
      this.setCurrentUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): CustomUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUser?.isAuthenticated;
  }

  /**
   * Listen to authentication state changes
   */
  onAuthStateChanged(callback: (user: CustomUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<Pick<CustomUser, 'displayName'>>): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Update local user object
      const updatedUser = { ...this.currentUser, ...updates };
      this.setCurrentUser(updatedUser);

      console.log('User profile updated:', updates);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Refresh user data from Firestore
   */
  async refreshUserData(): Promise<UserType | null> {
    if (!this.currentUser) {
      return null;
    }

    try {
      const userData = await getDocument<UserType>('Users', this.currentUser.uid);
      
      if (userData && userData.displayName !== this.currentUser.displayName) {
        // Update local user with fresh data
        await this.updateProfile({ displayName: userData.displayName });
      }

      return userData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return null;
    }
  }
}

// Create singleton instance
const authManager = new CustomAuthManager();

// Export functions that match the Firebase Auth interface
export const getCurrentUser = () => authManager.getCurrentUser();
export const isAuthenticated = () => authManager.isAuthenticated();
export const signInWithPhone = (phoneNumber: string) => authManager.signInWithPhone(phoneNumber);
export const signOut = () => authManager.signOut();
export const onAuthStateChanged = (callback: (user: CustomUser | null) => void) => 
  authManager.onAuthStateChanged(callback);
export const updateProfile = (updates: Partial<Pick<CustomUser, 'displayName'>>) => 
  authManager.updateProfile(updates);
export const refreshUserData = () => authManager.refreshUserData();

// Helper functions for compatibility with existing code
export const getUserPhoneNumber = (): string | null => {
  const user = getCurrentUser();
  return user?.phoneNumber || null;
};

export const getUserUID = (): string | null => {
  const user = getCurrentUser();
  return user?.uid || null;
};

// Export the auth manager for advanced usage
export { authManager };
