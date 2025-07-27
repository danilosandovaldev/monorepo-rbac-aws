import React, { useState } from 'react';

export const ExternalAuth: React.FC = () => {
  const [appUrl, setAppUrl] = useState('');
  const [state, setState] = useState('');

  const handleExternalAuth = () => {
    const authUrl = new URL(`${process.env.VITE_AUTH_URL}/oauth2/authorize`);
    authUrl.searchParams.set('client_id', process.env.VITE_USER_POOL_CLIENT_ID || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'email openid profile');
    authUrl.searchParams.set('redirect_uri', appUrl || `${window.location.origin}/callback`);
    if (state) authUrl.searchParams.set('state', state);

    window.location.href = authUrl.toString();
  };

  const generateAuthLink = () => {
    const authUrl = new URL(`${process.env.VITE_AUTH_URL}/oauth2/authorize`);
    authUrl.searchParams.set('client_id', process.env.VITE_USER_POOL_CLIENT_ID || '');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'email openid profile');
    authUrl.searchParams.set('redirect_uri', appUrl || `${window.location.origin}/callback`);
    if (state) authUrl.searchParams.set('state', state);

    return authUrl.toString();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Servicio de Autenticación RBAC
          </h1>
          <p className="text-xl text-gray-600">
            Integra autenticación segura en tu aplicación externa
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuración */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Configuración</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Callback de tu aplicación
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://tu-app.com/auth/callback"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State (opcional)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="estado-personalizado"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <button
                onClick={handleExternalAuth}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md font-medium"
              >
                Probar Autenticación
              </button>
            </div>
          </div>

          {/* Documentación */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Integración</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">1. URL de Autorización</h3>
                <div className="bg-gray-100 p-3 rounded-md text-sm font-mono break-all">
                  {generateAuthLink()}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2. Endpoints</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Callback:</strong> <code className="bg-gray-100 px-2 py-1 rounded">GET {process.env.VITE_CALLBACK_API_URL}/callback</code>
                  </div>
                  <div>
                    <strong>Verificar Token:</strong> <code className="bg-gray-100 px-2 py-1 rounded">POST {process.env.VITE_CALLBACK_API_URL}/verify</code>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3. Ejemplo de Uso</h3>
                <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-x-auto">
{`// Redirigir a autenticación
window.location.href = '${generateAuthLink()}';

// Verificar token
fetch('${process.env.VITE_CALLBACK_API_URL}/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  }
})`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Flujo de Autenticación</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">1</div>
              <p>Usuario hace clic en "Iniciar Sesión"</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">2</div>
              <p>Redirige a nuestro servicio de auth</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">3</div>
              <p>Usuario se autentica</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">4</div>
              <p>Callback con tokens a tu app</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};