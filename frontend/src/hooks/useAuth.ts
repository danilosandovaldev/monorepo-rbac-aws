'use client';

import { useState, useEffect } from 'react';
import { AuthState, AuthTokens } from '@/types/auth';

const CALLBACK_API_URL = process.env.NEXT_PUBLIC_CALLBACK_API_URL;

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const login = (state?: string) => {
    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const redirectUri = `${window.location.origin}/callback`;

    const params = new URLSearchParams({
      client_id: clientId!,
      response_type: 'code',
      scope: 'email openid profile',
      redirect_uri: redirectUri,
      ...(state && { state })
    });

    window.location.href = `${authUrl}/oauth2/authorize?${params}`;
  };

  const handleCallback = async (code: string, state?: string): Promise<AuthTokens> => {
    const redirectUri = `${window.location.origin}/callback`;
    const response = await fetch(
      `${CALLBACK_API_URL}/callback?code=${code}&redirect_uri=${redirectUri}&state=${state || ''}`
    );
    return response.json();
  };

  const verifyToken = async (token: string): Promise<{ valid: boolean; user: any }> => {
    const response = await fetch(`${CALLBACK_API_URL}/verify`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setAuthState({ user: null, isAuthenticated: false, isLoading: false });
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      verifyToken(token).then(({ valid, user }) => {
        setAuthState({
          user: valid ? user : null,
          isAuthenticated: valid,
          isLoading: false,
        });
      });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    handleCallback,
    verifyToken,
  };
}