import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';

interface AuthTriggerProps {
  children: React.ReactNode;
  redirectTo?: string;
  onAuthSuccess?: () => void;
  requireAuth?: boolean;
}

export function AuthTrigger({ 
  children, 
  redirectTo, 
  onAuthSuccess, 
  requireAuth = true 
}: AuthTriggerProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [isAuthenticated, isLoading, requireAuth]);

  const handleAuthSuccess = () => {
    setShowLogin(false);
    
    if (onAuthSuccess) {
      onAuthSuccess();
    } else if (redirectTo) {
      navigate(redirectTo, { replace: true });
    }
    // If no specific redirect, stay on current page
  };

  // Show login modal if authentication is required and user is not authenticated
  if (showLogin && requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Login />
      </div>
    );
  }

  // Show children if authenticated or if auth is not required
  return <>{children}</>;
}

// Hook for triggering authentication programmatically
export function useAuthTrigger() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const triggerAuth = (redirectTo?: string, onSuccess?: () => void) => {
    if (!isAuthenticated) {
      // Store the current location and redirect info for after login
      const state = {
        from: location,
        redirectTo,
        onSuccess: onSuccess?.toString() // Note: functions can't be serialized, so this is limited
      };
      
      navigate('/login', { state });
      return false; // Indicates auth was triggered
    }
    return true; // Indicates user is already authenticated
  };

  return { triggerAuth, isAuthenticated };
}
