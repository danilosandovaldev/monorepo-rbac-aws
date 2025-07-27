import { useState, useEffect } from 'react';
import { signIn, signUp, signOut, getCurrentUser, confirmSignUp, resetPassword } from '@aws-amplify/auth';
import { AuthState, SignInData, SignUpData, ResetPasswordData } from '../types/auth';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const user = await getCurrentUser();
      setAuthState({
        user: {
          id: user.userId,
          email: user.signInDetails?.loginId || '',
          givenName: user.signInDetails?.loginId || '',
          familyName: '',
        },
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const handleSignIn = async (data: SignInData) => {
    try {
      await signIn({ username: data.email, password: data.password });
      await checkAuthState();
    } catch (error) {
      throw error;
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    try {
      await signUp({
        username: data.email,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.givenName,
            family_name: data.familyName,
          },
        },
      });
    } catch (error) {
      throw error;
    }
  };

  const handleConfirmSignUp = async (email: string, code: string) => {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (error) {
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      throw error;
    }
  };

  const handleResetPassword = async (data: ResetPasswordData) => {
    try {
      await resetPassword({ username: data.email });
    } catch (error) {
      throw error;
    }
  };

  return {
    ...authState,
    signIn: handleSignIn,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
  };
};
