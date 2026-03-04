'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
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
    if (statusOrder <= 2) return 'bg-blue-100 text-blue-800';
    if (statusOrder <= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-600 mb-2">Rastrear Pedido</h1>
        <p className="text-gray-600 text-sm">Ingresá el código de tu pedido o escaneá el QR</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código del pedido (ej: D000000010000)"
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {order && (
        <>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-2xl font-bold text-indigo-600">#{order.orderCode}</span>
                <p className="font-medium">{order.description}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.statusOrder)}`}>
                {order.statusName}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Pedido creado: {formatDate(order.created_at)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-bold mb-3">Estado de entrega</h3>
            <div className="space-y-4">
              {order.steps.map((step, index) => (
                <div key={step.stepId} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full ${step.statusOrder >= 4 ? 'bg-green-500' : step.statusOrder >= 2 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    {index < order.steps.length - 1 && (
                      <div className={`w-0.5 h-full ${step.statusOrder >= 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between">
                      <span className="font-medium capitalize">{step.step_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(step.statusOrder)}`}>
                        {step.statusName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{step.address}</p>
                    {step.contact_name && (
                      <p className="text-sm text-gray-500">Contacto: {step.contact_name} {step.contact_phone}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          ¿Sos el remitente? <a href="/login" className="text-indigo-600">Ingresar</a>
        </p>
      </div>
    </div>
  );
}
