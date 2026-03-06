'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface TrackStep {
  stepId: number;
  step_type: string;
  step_order: number;
  address: string;
  contact_name: string;
  contact_phone: string;
  statusName: string;
  statusOrder: number;
}

interface TrackResult {
  type: 'order' | 'step';
  // order fields
  orderCode?: string;
  description?: string;
  statusName?: string;
  statusOrder?: number;
  created_at?: string;
  customerName?: string;
  customerLastname?: string;
  steps?: TrackStep[];
  // step fields
  stepCode?: string;
  step_type?: string;
  address?: string;
  contact_name?: string;
  contact_phone?: string;
  package_qty?: number;
  orderDescription?: string;
  orderStatusName?: string;
  orderStatusOrder?: number;
}

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  // Tracking state
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState<TrackResult | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

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

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!trackCode.trim()) return;

    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);

    try {
      const res = await fetch(`/api/track/${trackCode.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setTrackResult(data);
      } else {
        setTrackError('No se encontró ningún envío con ese código');
      }
    } catch {
      setTrackError('Error al buscar');
    }
    setTrackLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const success = await login(email, password);
    if (success) {
      router.push('/');
    } else {
      setLoginError('Credenciales inválidas');
    }
    setLoginLoading(false);
  }

  function getStatusColor(statusOrder: number) {
    if (statusOrder <= 1) return 'bg-yellow-100 text-yellow-800';
    if (statusOrder <= 2) return 'bg-sky-100 text-sky-800';
    if (statusOrder <= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
                placeholder="Código (ej: D000000010200)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono"
              />
              <button
                type="submit"
                disabled={trackLoading}
                className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md"
              >
                {trackLoading ? 'Buscando...' : 'Buscar envío'}
              </button>
            </form>

            {trackError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mt-4 text-sm">
                {trackError}
              </div>
            )}

            {/* Track result: order */}
            {trackResult?.type === 'order' && (
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xl font-bold text-sky-600">#{trackResult.orderCode}</span>
                    {trackResult.description && (
                      <p className="text-sm font-medium text-gray-700">{trackResult.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trackResult.statusOrder || 0)}`}>
                    {trackResult.statusName}
                  </span>
                </div>

                {trackResult.created_at && (
                  <p className="text-xs text-gray-400 mb-3">Creado: {formatDate(trackResult.created_at)}</p>
                )}

                {trackResult.steps && trackResult.steps.length > 0 && (
                  <div className="space-y-3">
                    {trackResult.steps.map((step, index) => (
                      <div key={step.stepId} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${step.statusOrder >= 4 ? 'bg-green-500' : step.statusOrder >= 2 ? 'bg-sky-500' : 'bg-gray-300'}`}></div>
                          {index < trackResult.steps!.length - 1 && (
                            <div className={`w-0.5 flex-1 min-h-[24px] ${step.statusOrder >= 4 ? 'bg-green-300' : 'bg-gray-200'}`}></div>
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              {step.step_type === 'origin' ? 'Origen' : 'Destino'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(step.statusOrder)}`}>
                              {step.statusName}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{step.address}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Track result: step */}
            {trackResult?.type === 'step' && (
              <div className="mt-4 border-t pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-lg font-bold text-sky-600">#{trackResult.stepCode}</span>
                    <p className="text-xs text-gray-400">
                      Orden: {trackResult.orderCode}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trackResult.statusOrder || 0)}`}>
                    {trackResult.statusName}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                  <p className="text-sm font-medium text-gray-700">
                    {trackResult.step_type === 'origin' ? 'Origen' : 'Destino'}
                  </p>
                  <p className="text-sm text-gray-600">{trackResult.address}</p>
                  {trackResult.contact_name && (
                    <p className="text-sm text-gray-500 mt-1">📞 {trackResult.contact_name} {trackResult.contact_phone ? `- ${trackResult.contact_phone}` : ''}</p>
                  )}
                  {trackResult.package_qty && trackResult.package_qty > 0 && (
                    <p className="text-xs text-sky-600 mt-1">📦 {trackResult.package_qty} paquete(s)</p>
                  )}
                </div>

                {trackResult.orderStatusName && (
                  <div className="mt-3 text-sm text-gray-500">
                    Estado general del pedido: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trackResult.orderStatusOrder || 0)}`}>{trackResult.orderStatusName}</span>
                  </div>
                )}
              </div>
            )}
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
