'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface OrderStep {
  OrderStepId: number;
  OrderStepType: string;
  OrderStepOrder: number;
  OrderStepAddress: string;
  OrderStepContactName: string;
  OrderStepContactPhone: string;
  OrderStepNotes: string;
  OrderStepCode: string;
  StepStatusName: string;
  DriverName: string;
}

interface Tracking {
  TrackingId: number;
  TrackingTimestamp: string;
  TrackingObservation: string;
  PreviousStatusName: string;
  NextStatusName: string;
}

interface Order {
  OrderId: number;
  OrderCode: string;
  OrderDescription: string;
  OrderCreatedAt: string;
  OrderNotes: string;
  OrderCurrentStatusId: number;
  OrderStatusName: string;
  CustomerName: string;
  CustomerLastname: string;
  CustomerPhone: string;
  CustomerEmail: string;
  steps: OrderStep[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState<Tracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
      fetchTracking();
    }
  }, [params.id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
    setLoading(false);
  }

  async function fetchTracking() {
    try {
      const res = await fetch(`/api/orders/${params.id}/tracking`);
      if (res.ok) {
        const data = await res.json();
        setTracking(data);
      }
    } catch (error) {
      console.error('Error fetching tracking:', error);
    }
  }

  async function updateStatus(newStatusId: number) {
    if (!confirm('¿Confirmar cambio de estado?')) return;
    
    setUpdating(true);
    try {
      await fetch(`/api/orders/${params.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusId: newStatusId }),
      });
      fetchOrder();
      fetchTracking();
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setUpdating(false);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Pedido no encontrado</p>
        <button onClick={() => router.back()} className="text-indigo-600 mt-2">Volver</button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button onClick={() => router.back()} className="text-indigo-600 mb-2">← Volver</button>
      
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-2xl font-bold text-indigo-600">#{order.OrderCode}</span>
            <p className="font-medium">{order.OrderDescription}</p>
          </div>
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
            {order.OrderStatusName}
          </span>
        </div>
        
        <div className="border-t pt-3 mt-3">
          <h3 className="font-medium mb-2">Cliente</h3>
          <p>{order.CustomerName} {order.CustomerLastname}</p>
          <p className="text-gray-600">{order.CustomerPhone}</p>
          {order.CustomerEmail && <p className="text-gray-600">{order.CustomerEmail}</p>}
        </div>

        {order.OrderNotes && (
          <div className="border-t pt-3 mt-3">
            <h3 className="font-medium mb-1">Notas</h3>
            <p className="text-gray-600">{order.OrderNotes}</p>
          </div>
        )}
      </div>

      {order.steps && order.steps.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <h3 className="font-bold mb-3">Pasos del pedido</h3>
          <div className="space-y-3">
            {order.steps.map((step, index) => (
              <div key={step.OrderStepId} className="border-l-2 border-indigo-300 pl-3">
                <div className="flex justify-between">
                  <span className="font-medium">{step.OrderStepType}</span>
                  <span className="text-sm text-gray-500">{step.StepStatusName}</span>
                </div>
                {step.OrderStepAddress && (
                  <p className="text-sm text-gray-600">{step.OrderStepAddress}</p>
                )}
                {step.OrderStepContactName && (
                  <p className="text-sm text-gray-600">{step.OrderStepContactName} - {step.OrderStepContactPhone}</p>
                )}
                {step.DriverName && (
                  <p className="text-sm text-indigo-600">Repartidor: {step.DriverName}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="font-bold mb-3">Historial</h3>
        {tracking.length === 0 ? (
          <p className="text-gray-500 text-sm">Sin historial</p>
        ) : (
          <div className="space-y-2">
            {tracking.map((t) => (
              <div key={t.TrackingId} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{t.NextStatusName}</span>
                  <span className="text-gray-500">{formatDate(t.TrackingTimestamp)}</span>
                </div>
                {t.TrackingObservation && (
                  <p className="text-gray-600">{t.TrackingObservation}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <h3 className="font-bold mb-3">Cambiar Estado</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateStatus(2)}
            disabled={updating || order.OrderCurrentStatusId === 2}
            className="bg-blue-500 text-white py-2 rounded-lg disabled:opacity-50"
          >
            Iniciar
          </button>
          <button
            onClick={() => updateStatus(3)}
            disabled={updating || order.OrderCurrentStatusId === 3}
            className="bg-orange-500 text-white py-2 rounded-lg disabled:opacity-50"
          >
            En Reparto
          </button>
          <button
            onClick={() => updateStatus(6)}
            disabled={updating || order.OrderCurrentStatusId === 6}
            className="bg-green-500 text-white py-2 rounded-lg disabled:opacity-50"
          >
            Entregado
          </button>
          <button
            onClick={() => updateStatus(7)}
            disabled={updating || order.OrderCurrentStatusId === 7}
            className="bg-red-500 text-white py-2 rounded-lg disabled:opacity-50"
          >
            Cancelado
          </button>
        </div>
      </div>
    </div>
  );
}
