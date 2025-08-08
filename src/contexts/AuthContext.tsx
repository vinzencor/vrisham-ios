import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  onAuthChange,
  signOut as firebaseSignOut,
  getCurrentUserData,
  createUserProfile,
  updateUserProfile
} from '../firebase/customTokenAuth';
import { User } from '../firebase/schema';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<User | null>;
  createUserProfile: (displayName: string, phoneNumber: string, address?: Partial<User['listOfAddress'][0]>) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  getUserPhoneNumber: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      console.log('🔄 AUTH CONTEXT: Firebase auth state changed', {
        hasUser: !!user,
        uid: user?.uid,
        email: user?.email,
        phoneNumber: user?.phoneNumber
      });
      setCurrentUser(user);
      setAuthInitialized(true);
      // Don't set isLoading to false here - let the user data fetch complete first
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      // Only proceed if auth has been initialized
      if (!authInitialized) {
        return;
      }

      if (currentUser) {
        try {
          console.log('=== AUTH CONTEXT: Initial fetch of user data for UID ===', currentUser.uid);
          // Keep loading state true during user data fetch

          const data = await getCurrentUserData();

          console.log('=== AUTH CONTEXT: getCurrentUserData result ===', {
            hasData: !!data,
            userUID: currentUser.uid,
            userPhone: currentUser.phoneNumber,
            userData: data ? {
              uid: data.uid,
              displayName: data.displayName,
              phoneNumber: data.phoneNumber,
              phone_number: (data as any).phone_number,
              addressCount: data.listOfAddress?.length || 0
            } : null
          });

          if (data) {
            console.log('=== AUTH CONTEXT: User data fetched successfully ===', data);
            setUserData(data);
          } else {
            console.log('=== AUTH CONTEXT: No user data found for UID ===', currentUser.uid);
            console.log('=== AUTH CONTEXT: This is a new user - they need to complete registration ===');
            setUserData(null);
            // DO NOT create any profile automatically - let AuthModal handle it
            console.log('=== AUTH CONTEXT: NOT creating any automatic profile - AuthModal will handle new user registration ===');
          }
        } catch (error) {
          console.error('=== AUTH CONTEXT: Error fetching user data ===', error);
          setUserData(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('=== AUTH CONTEXT: No current user, clearing user data ===');
        setUserData(null);
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser, authInitialized]);

  const refreshUserData = async () => {
    if (currentUser) {
      try {
        console.log('Refreshing user data for UID:', currentUser.uid);
        setIsLoading(true);

        const data = await getCurrentUserData();

        if (data) {
          console.log('User data refreshed successfully:', data);
          setUserData(data);
          return data;
        } else {
          console.log('No user data found - this indicates a new user');
          setUserData(null);
          return null;
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
        setUserData(null);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }

    return null;
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
      setUserData(null);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const createUserProfileContext = async (
    displayName: string,
    phoneNumber: string,
    address?: Partial<User['listOfAddress'][0]>
  ) => {
    if (!currentUser) return;

    try {
      await createUserProfile(currentUser.uid, displayName, phoneNumber, address);
      await refreshUserData();
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const updateUser = async (data: Partial<User>) => {
    if (!currentUser) return;

    try {
      await updateUserProfile(currentUser.uid, data);
      await refreshUserData();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const getUserPhoneNumber = (): string | null => {
    // First check if we have a current Firebase user with phone number
    if (currentUser?.phoneNumber) {
      return currentUser.phoneNumber;
    }

    // Then check userData from Firestore
    if (!userData) {
      return null;
    }

    // Check if phone number is stored directly on user (with underscore)
    if ((userData as any).phone_number) {
      return (userData as any).phone_number;
    }

    // Check if phone number is stored directly on user (camelCase)
    if ((userData as any).phoneNumber) {
      return (userData as any).phoneNumber;
    }

    // Fallback: check addresses
    if (userData.listOfAddress && userData.listOfAddress.length > 0) {
      for (const address of userData.listOfAddress) {
        if (address.phoneNumber) {
          return address.phoneNumber;
        }
      }
    }

    return null;
  };

  // Enhanced authentication check - allow authenticated users without userData (new users)
  const isAuthenticated = !!(currentUser && authInitialized);

  console.log('=== AUTH CONTEXT: Authentication state ===', {
    hasCurrentUser: !!currentUser,
    hasUserData: !!userData,
    isLoading,
    isAuthenticated,
    userUID: currentUser?.uid,
    userPhone: currentUser?.phoneNumber
  });

  const value = {
    currentUser,
    userData,
    isLoading,
    isAuthenticated,
    logout,
    refreshUserData,
    createUserProfile: createUserProfileContext,
    updateUser,
    getUserPhoneNumber
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
