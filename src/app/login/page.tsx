'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  // Tracking state
  const [trackCode, setTrackCode] = useState('');

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // If already logged in, redirect
  if (user) {
    router.push('/');
    return null;
  }

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!trackCode.trim()) return;
    router.push(`/seguimiento?code=${trackCode.trim().toUpperCase()}`);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const success = await login(email, password);
    if (success) {
      router.push('/');
    } else {
      setLoginError('Credenciales invalidas');
    }
    setLoginLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-400 p-6 pb-10">
        <div className="text-center max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white">Lomando</h1>
          <p className="text-white/80 text-sm mt-1">Sistema de seguimiento de envíos</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Tracking section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Seguimiento de envío</h2>
            <p className="text-sm text-gray-500 mb-4">Ingresá el código de tu envío o paquete para ver su estado</p>

            <form onSubmit={handleTrack} className="space-y-3">
              <input
                type="text"
                value={trackCode}
                onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                placeholder="Codigo (ej: D000000010200)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono"
              />
              <button
                type="submit"
                disabled={!trackCode.trim()}
                className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md"
              >
                Buscar envio
              </button>
            </form>
          </div>

          {/* Login section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Acceso al sistema</h2>
            <p className="text-sm text-gray-500 mb-4">Ingresá con tu cuenta para gestionar envíos</p>

            <form onSubmit={handleLogin} className="space-y-3">
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 transition shadow-md"
              >
                {loginLoading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>
          </div>

        </div>

        <div className="text-center py-6">
          <p className="text-xs text-gray-400">Lomando — Sistema de seguimiento de envíos</p>
        </div>
      </div>
    </div>
  );
}
