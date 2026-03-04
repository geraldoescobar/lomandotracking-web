'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Step {
  stepId: number;
  step_type: string;
  step_order: number;
  address: string;
  contact_name: string;
  contact_phone: string;
  statusName: string;
  statusOrder: number;
}

interface Order {
  orderId: number;
  orderCode: string;
  description: string;
  statusName: string;
  statusOrder: number;
  created_at: string;
  customerName: string;
  customerLastname: string;
  steps: Step[];
}

export default function TrackPage() {
  const [code, setCode] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`/api/track/${code.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        setError('No se encontró ningún pedido con ese código');
      }
    } catch (err) {
      setError('Error al buscar el pedido');
    }

    setLoading(false);
  }

  function getStatusColor(statusOrder: number) {
    if (statusOrder <= 1) return 'bg-yellow-100 text-yellow-800';
    if (statusOrder <= 2) return 'bg-sky-100 text-sky-800';
    if (statusOrder <= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-sky-500 to-sky-300 p-6 pb-10">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-3 relative">
            <Image 
              src="/logo_3.png" 
              alt="Lomando" 
              fill
              className="object-contain"
            />
          </div>
          <h1 className="text-xl font-bold text-white">Rastrear Pedido</h1>
          <p className="text-white/80 text-sm mt-1">Ingresá el código o escaneá el QR</p>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-lg p-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Código (ej: D000000010000)"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mt-4">
            {error}
          </div>
        )}

        {order && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-2xl font-bold text-sky-600">#{order.orderCode}</span>
                  <p className="font-medium text-gray-800">{order.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.statusOrder)}`}>
                  {order.statusName}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Creado: {formatDate(order.created_at)}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
              <h3 className="font-bold text-gray-800 mb-4">Estado de entrega</h3>
              <div className="space-y-4">
                {order.steps.map((step, index) => (
                  <div key={step.stepId} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${step.statusOrder >= 4 ? 'bg-green-500' : step.statusOrder >= 2 ? 'bg-sky-500' : 'bg-gray-300'}`}></div>
                      {index < order.steps.length - 1 && (
                        <div className={`w-0.5 h-12 ${step.statusOrder >= 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize text-gray-800">{step.step_type}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(step.statusOrder)}`}>
                          {step.statusName}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{step.address}</p>
                      {step.contact_name && (
                        <p className="text-sm text-gray-500">📞 {step.contact_name} - {step.contact_phone}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="mt-6 text-center pb-6">
          <p className="text-sm text-gray-500">
            ¿Sos el remitente? <a href="/login" className="text-sky-600 font-medium">Ingresar</a>
          </p>
        </div>
      </div>
    </div>
  );
}
