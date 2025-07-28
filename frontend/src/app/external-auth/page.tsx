'use client';

import { useState } from 'react';

export default function ExternalAuth() {
  const [appUrl, setAppUrl] = useState('');

  const handleAuth = () => {
    if (!appUrl) return;

    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL;
    const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
    const state = Math.random().toString(36).substring(7);

    const params = new URLSearchParams({
      client_id: clientId!,
      response_type: 'code',
      scope: 'email openid profile',
      redirect_uri: appUrl,
      state
    });

    window.location.href = `${authUrl}/oauth2/authorize?${params}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Autenticación Externa
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Integra autenticación RBAC en tu aplicación
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <label htmlFor="app-url" className="block text-sm font-medium text-gray-700">
              URL de Callback de tu Aplicación
            </label>
            <input
              id="app-url"
              type="url"
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              placeholder="https://tu-app.com/callback"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleAuth}
            disabled={!appUrl}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
          >
            Iniciar Autenticación
          </button>
        </div>
      </div>
    </div>
  );
}