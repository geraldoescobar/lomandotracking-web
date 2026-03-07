'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import QRCode from '@/components/QRCode';
import { printLabels, printRoute } from '@/lib/print';

interface Driver {
  id: number;
  name: string;
  phone: string;
}

interface Step {
  stepId: number;
  step_type: string;
  step_order: number;
  address: string;
  contact_name: string;
  contact_phone: string;
  notes: string;
  package_qty: number;
  stepCode: string;
  statusId: number;
  statusName: string;
  statusOrder: number;
  driverId: number;
  driverName: string;
}

interface Tracking {
  id: number;
  observation: string;
  receiver_name: string;
  receiver_document: string;
  created_at: string;
  fromStatus: string;
  toStatus: string;
}

interface Order {
  orderId: number;
  orderCode: string;
  description: string;
  notes: string;
  type: string;
  statusId: number;
  statusName: string;
  statusOrder: number;
  created_at: string;
  customerId: string;
  customerName: string;
  customerLastname: string;
  customerPhone: string;
  customerEmail: string;
  steps: Step[];
  tracking: Tracking[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showOrderQR, setShowOrderQR] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  useEffect(() => {
    if (params.id && user) {
      fetchOrder();
      if (user.role === 'manager') fetchDrivers();
    }
  }, [params.id, user]);

  async function fetchDrivers() {
    try {
      const res = await authFetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.filter((d: any) => d.isActive));
      }
    } catch {}
  }

  async function assignDriver(stepId: number, driverId: number | null) {
    setUpdating(true);
    try {
      const res = await authFetch(`/api/steps/${stepId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ driverId }),
      });
      if (res.ok) {
        await fetchOrder();
      }
    } catch {}
    setUpdating(false);
  }

  async function fetchOrder() {
    try {
      const res = await authFetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
    setLoading(false);
  }

  async function updateOrderStatus(newStatusId: number, observation?: string) {
    if (!confirm('¿Confirmar cambio de estado de la orden?')) return;

    setUpdating(true);
    try {
      await authFetch(`/api/orders/${params.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ statusId: newStatusId, observation }),
      });
      fetchOrder();
    } catch (error) {
      console.error('Error updating status:', error);
    }
    setUpdating(false);
  }

  async function startDelivery() {
    if (!confirm('¿Iniciar entrega del pedido? Esto cambiará el estado a "En Curso".')) return;

    setUpdating(true);
    try {
      await authFetch(`/api/orders/${params.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ statusId: 3, observation: 'Iniciado desde detalle de orden' }),
      });
      fetchOrder();
    } catch (error) {
      console.error('Error starting delivery:', error);
    }
    setUpdating(false);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function getStatusColor(statusOrder: number) {
    if (statusOrder <= 1) return 'bg-yellow-100 text-yellow-800';
    if (statusOrder <= 2) return 'bg-sky-100 text-sky-800';
    if (statusOrder <= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }

  function canStartDelivery() {
    if (!order) return false;
    return order.statusId === 1 || order.statusId === 2;
  }

  function getStatusButtonText() {
    if (!order) return '';
    if (order.statusId === 1) return 'Iniciar Pedido';
    if (order.statusId === 2) return 'Iniciar Entrega';
    return '';
  }

  async function handlePrintLabels() {
    if (!order) return;
    await printLabels(order);
  }

  async function handlePrintRoute() {
    if (!order) return;
    await printRoute(order);
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Pedido no encontrado</p>
        <button onClick={() => router.back()} className="text-sky-600 mt-2">Volver</button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex justify-between items-center mb-3">
        <button onClick={() => router.back()} className="text-sky-600">← Volver</button>
        <div className="flex gap-2">
          <button
            onClick={handlePrintLabels}
            className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200"
            title="Imprimir etiquetas"
          >
            🏷️ Etiquetas
          </button>
          <button
            onClick={handlePrintRoute}
            className="text-sm bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200"
            title="Imprimir hoja de ruta"
          >
            🗺️ Ruta
          </button>
        </div>
      </div>

      {/* Order header + QR */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span data-testid="order-code" className="text-2xl font-bold text-sky-600">#{order.orderCode}</span>
            <p className="font-medium text-gray-800">{order.description}</p>
          </div>
          <span data-testid="order-status" className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.statusOrder)}`}>
            {order.statusName}
          </span>
        </div>

        {/* Toggle order QR */}
        <button
          onClick={() => setShowOrderQR(!showOrderQR)}
          className="text-sm text-sky-600 font-medium mb-3"
        >
          {showOrderQR ? '▲ Ocultar QR' : '▼ Ver QR de la orden'}
        </button>
        {showOrderQR && (
          <div className="flex justify-center py-3 border-t border-b border-gray-100">
            <div className="text-center">
              <QRCode value={order.orderCode} size={180} />
              <p className="text-xs font-mono text-gray-500 mt-1">{order.orderCode}</p>
            </div>
          </div>
        )}

        {canStartDelivery() && (
          <button
            onClick={startDelivery}
            disabled={updating}
            className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md mt-3"
          >
            {updating ? 'Actualizando...' : `🚀 ${getStatusButtonText()}`}
          </button>
        )}

        {!canStartDelivery() && order.statusId === 3 && (
          <div className="w-full bg-orange-50 text-orange-700 py-3 rounded-xl font-medium text-center mt-3 border border-orange-200">
            🚚 Orden en curso
          </div>
        )}

        {user.role !== 'driver' && (
          <div className="border-t pt-3 mt-3">
            <h3 className="font-medium mb-2 text-gray-700">Cliente</h3>
            <p className="text-gray-800">{order.customerName} {order.customerLastname}</p>
            <p className="text-gray-600">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-gray-600">{order.customerEmail}</p>}
          </div>
        )}

        {order.notes && (
          <div className="border-t pt-3 mt-3">
            <h3 className="font-medium mb-1 text-gray-700">Notas</h3>
            <p className="text-gray-600">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Steps with QR */}
      {order.steps && order.steps.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-bold mb-3 text-gray-800">
            {user.role === 'driver' ? 'Mis Destinos' : 'Pasos del pedido'}
          </h3>
          <div className="space-y-3">
            {order.steps.map((step) => (
              <StepCard
                key={step.stepId}
                step={step}
                userRole={user.role}
                getStatusColor={getStatusColor}
                drivers={drivers}
                onAssignDriver={assignDriver}
                updating={updating}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tracking history */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h3 className="font-bold mb-3 text-gray-800">Historial</h3>
        {(!order.tracking || order.tracking.length === 0) ? (
          <p className="text-gray-500 text-sm">Sin historial</p>
        ) : (
          <div className="space-y-2">
            {order.tracking.map((t) => (
              <div key={t.id} className="text-sm border-l-2 border-gray-200 pl-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">{t.toStatus}</span>
                  <span className="text-gray-400 text-xs">{formatDate(t.created_at)}</span>
                </div>
                {t.observation && <p className="text-gray-500">{t.observation}</p>}
                {t.receiver_name && (
                  <p className="text-gray-400 text-xs">Receptor: {t.receiver_name} ({t.receiver_document})</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manager status controls */}
      {user.role === 'manager' && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-bold mb-3 text-gray-800">Cambiar Estado</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => updateOrderStatus(1)} disabled={updating || order.statusId === 1}
              className="bg-yellow-500 text-white py-2 rounded-lg disabled:opacity-50">Pendiente</button>
            <button onClick={() => updateOrderStatus(2)} disabled={updating || order.statusId === 2}
              className="bg-sky-500 text-white py-2 rounded-lg disabled:opacity-50">Asignado</button>
            <button onClick={() => updateOrderStatus(3)} disabled={updating || order.statusId === 3}
              className="bg-orange-500 text-white py-2 rounded-lg disabled:opacity-50">En Curso</button>
            <button onClick={() => updateOrderStatus(4)} disabled={updating || order.statusId === 4}
              className="bg-green-500 text-white py-2 rounded-lg disabled:opacity-50">Completado</button>
            <button onClick={() => updateOrderStatus(5)} disabled={updating || order.statusId === 5}
              className="bg-red-500 text-white py-2 rounded-lg disabled:opacity-50 col-span-2">Cancelar Orden</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ step, userRole, getStatusColor, drivers, onAssignDriver, updating }: {
  step: Step;
  userRole: string;
  getStatusColor: (n: number) => string;
  drivers: Driver[];
  onAssignDriver: (stepId: number, driverId: number | null) => void;
  updating: boolean;
}) {
  const [showQR, setShowQR] = useState(false);
  const isOrigin = step.step_type === 'origin';

  return (
    <div className="border-l-2 border-sky-300 pl-3">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="font-medium capitalize text-gray-800">
            {isOrigin ? 'Origen' : 'Destino'}
          </span>
          {step.stepCode && (
            <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded font-mono">{step.stepCode}</span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(step.statusOrder)}`}>
          {step.statusName}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{step.address}</p>
      {step.contact_name && (
        <p className="text-sm text-gray-500">{step.contact_name} - {step.contact_phone}</p>
      )}
      {step.notes && (
        <p className="text-sm text-gray-400 italic">{step.notes}</p>
      )}
      {step.package_qty > 0 && (
        <p className="text-xs text-sky-600 mt-1">{step.package_qty} paquete(s)</p>
      )}

      {/* Driver assignment (manager only, destination steps only) */}
      {!isOrigin && userRole === 'manager' && (
        <div className="mt-2">
          <select
            value={step.driverId || ''}
            onChange={(e) => onAssignDriver(step.stepId, e.target.value ? Number(e.target.value) : null)}
            disabled={updating}
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 disabled:opacity-50"
          >
            <option value="">Sin cadete asignado</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}{d.phone ? ` (${d.phone})` : ''}</option>
            ))}
          </select>
        </div>
      )}

      {/* Show assigned driver for non-manager roles */}
      {!isOrigin && userRole !== 'manager' && step.driverName && (
        <p className="text-sm text-sky-600 mt-1">Cadete: {step.driverName}</p>
      )}

      {/* QR toggle for non-origin steps */}
      {!isOrigin && step.stepCode && (
        <>
          <button
            onClick={() => setShowQR(!showQR)}
            className="text-xs text-sky-500 mt-1"
          >
            {showQR ? 'Ocultar QR' : 'Ver QR'}
          </button>
          {showQR && (
            <div className="flex justify-center py-2">
              <div className="text-center">
                <QRCode value={step.stepCode} size={130} />
                <p className="text-xs font-mono text-gray-400 mt-1">{step.stepCode}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
