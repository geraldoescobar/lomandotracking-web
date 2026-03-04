'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    
    if (success) {
      router.push('/');
    } else {
      setError('Credenciales inválidas');
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-b from-sky-500 to-sky-300 p-8 pb-16">
        <div className="text-center">
          <div className="w-28 h-28 mx-auto mb-4 relative">
            <Image 
              src="/logo_3.png" 
              alt="Lomando" 
              fill
              className="object-contain"
            />
          </div>
          <p className="text-white/80 text-sm mt-1">Tracking de pedidos</p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:border-transparent focus:bg-white transition"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:border-transparent focus:bg-white transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 transition shadow-md"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <div className="mt-6 p-4 bg-sky-50 rounded-xl">
          <p className="text-sm text-sky-700 font-medium mb-2">Cuentas de prueba:</p>
          <div className="text-xs text-sky-600 space-y-1">
            <p><span className="font-semibold">Manager:</span> admin@lomando.com</p>
            <p><span className="font-semibold">Driver:</span> jorge@driver.com</p>
            <p><span className="font-semibold">Cliente:</span> geraldo@client.com</p>
            <p className="text-sky-500 mt-2">Contraseña: 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
}
