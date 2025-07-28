'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Callback() {
  const { handleCallback } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code) {
      handleCallback(code, state || undefined)
        .then((tokens) => {
          localStorage.setItem('access_token', tokens.access_token);
          router.push('/dashboard');
        })
        .catch((error) => {
          console.error('Error en callback:', error);
          router.push('/signin');
        });
    } else {
      router.push('/signin');
    }
  }, [handleCallback, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-lg">Procesando autenticación...</p>
      </div>
    </div>
  );
}