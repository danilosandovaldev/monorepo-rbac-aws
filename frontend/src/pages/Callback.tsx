import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const Callback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          setStatus('error');
          setMessage(`Error de autenticación: ${error}`);
          return;
        }

        if (!code) {
          setStatus('error');
          setMessage('Código de autorización no encontrado');
          return;
        }

        // Procesar callback
        const response = await fetch(`${process.env.VITE_CALLBACK_API_URL}/callback?code=${code}&state=${state}&redirect_uri=${encodeURIComponent(window.location.origin + '/callback')}`);
        
        if (!response.ok) {
          throw new Error('Error al procesar callback');
        }

        const data = await response.json();
        
        // Guardar tokens
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('id_token', data.id_token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        setStatus('success');
        setMessage('Autenticación exitosa. Redirigiendo...');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Error al procesar callback');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
            <h2 className="text-2xl font-bold text-gray-900">Procesando autenticación...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900">¡Éxito!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-900">Error</h2>
            <p className="text-gray-600">{message}</p>
            <button
              onClick={() => navigate('/signin')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
            >
              Volver al inicio
            </button>
          </>
        )}
      </div>
    </div>
  );
};