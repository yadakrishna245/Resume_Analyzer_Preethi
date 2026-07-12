import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signIn,
  signUp,
  signOut,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  fetchUserAttributes,
  resetPassword,
  confirmResetPassword,
  setUpTOTP,
  verifyTOTPSetup,
  updateMFAPreference,
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

/**
 * Auth Provider - Wraps the app with Cognito authentication state
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check current auth state on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setUser({ ...currentUser, attributes });
      setIsAuthenticated(true);
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign in with email and password
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const result = await signIn({
        username: email,
        password,
      });

      if (result.isSignedIn) {
        await checkAuthState();
        return { success: true };
      }

      // Handle MFA challenge
      if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        return { success: false, nextStep: 'MFA_TOTP', challengeResponse: result };
      }

      return { success: false, nextStep: result.nextStep?.signInStep };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Sign up with email, password, and name
   */
  const signup = useCallback(async (email, password, name) => {
    setError(null);
    try {
      const result = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name: name || '',
          },
        },
      });

      if (result.isSignUpComplete) {
        return { success: true, complete: true };
      }

      return {
        success: true,
        complete: false,
        nextStep: result.nextStep?.signUpStep,
        codeDeliveryDetails: result.nextStep?.codeDeliveryDetails,
      };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Confirm signup with verification code
   */
  const confirmSignupCode = useCallback(async (email, code) => {
    setError(null);
    try {
      const result = await confirmSignUp({
        username: email,
        confirmationCode: code,
      });
      return { success: result.isSignUpComplete };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Sign out the current user
   */
  const logout = useCallback(async () => {
    try {
      await signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  /**
   * Get the current session token for API calls
   */
  const getAccessToken = useCallback(async () => {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString() || null;
    } catch {
      return null;
    }
  }, []);

  /**
   * Initiate forgot password flow
   */
  const forgotPassword = useCallback(async (email) => {
    setError(null);
    try {
      const result = await resetPassword({ username: email });
      return { success: true, nextStep: result.nextStep };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Confirm new password with code
   */
  const confirmForgotPassword = useCallback(async (email, code, newPassword) => {
    setError(null);
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      return { success: true };
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  /**
   * Setup TOTP MFA
   */
  const setupMFA = useCallback(async () => {
    try {
      const totpSetup = await setUpTOTP();
      const setupUri = totpSetup.getSetupUri('ResumeAnalyzer');
      return { success: true, uri: setupUri.toString(), secret: totpSetup.sharedSecret };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Verify and enable TOTP MFA
   */
  const verifyMFA = useCallback(async (code) => {
    try {
      await verifyTOTPSetup({ code });
      await updateMFAPreference({ totp: 'PREFERRED' });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    confirmSignup: confirmSignupCode,
    logout,
    getAccessToken,
    forgotPassword,
    confirmForgotPassword,
    setupMFA,
    verifyMFA,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Map Cognito errors to user-friendly messages
 */
function getErrorMessage(err) {
  switch (err.name) {
    case 'UserNotFoundException':
    case 'NotAuthorizedException':
      return 'Invalid email or password.';
    case 'UserNotConfirmedException':
      return 'Please verify your email before signing in.';
    case 'UsernameExistsException':
      return 'An account with this email already exists.';
    case 'InvalidPasswordException':
      return 'Password must be at least 8 characters with uppercase, lowercase, and numbers.';
    case 'CodeMismatchException':
      return 'Invalid verification code. Please try again.';
    case 'ExpiredCodeException':
      return 'Verification code has expired. Please request a new one.';
    case 'LimitExceededException':
      return 'Too many attempts. Please try again later.';
    case 'NetworkError':
      return 'Network error. Please check your connection.';
    default:
      return err.message || 'An unexpected error occurred.';
  }
}

export default AuthProvider;
