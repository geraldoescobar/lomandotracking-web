'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

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

  useEffect(() => {
    if (params.id && user) {
      fetchOrder();
    }
  }, [params.id, user]);

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
        body: JSON.stringify({
          statusId: newStatusId,
          observation
        }),
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
        body: JSON.stringify({
          statusId: 3,
          observation: 'Iniciado al escanear código de orden'
        }),
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
    if (order.statusId === 3) return 'En Curso';
    if (order.statusId === 4) return 'Completado';
    return '';
  }

  function handlePrint() {
    if (!order) return;
    
    const printContent = `
=======================================
         HOJA DE RUTA - LOMANDO
=======================================

ORDEN: ${order.orderCode}
Fecha: ${new Date().toLocaleDateString('es-UY')}
=======================================

CLIENTE:
${order.customerName} ${order.customerLastname}
Tel: ${order.customerPhone}
${order.customerEmail || ''}

${order.notes ? `NOTAS: ${order.notes}` : ''}

=======================================
           DESTINOS
=======================================

${order.steps?.map((step, i) => `
${i + 1}. ${step.step_type.toUpperCase()} - Código: ${step.stepCode || 'N/A'}
   Dirección: ${step.address}
   Contacto: ${step.contact_name || 'N/A'} - ${step.contact_phone || 'N/A'}
   Paquetes: ${step.package_qty || 0}
   Estado: ${step.statusName}
   ${step.notes ? `Notas: ${step.notes}` : ''}
`).join('')}

=======================================
Firma Receptor: _______________________
DNI Receptor: ________________________
Hora Entrega: __________________________

=======================================
      Lomando - Tracking de Pedidos
=======================================
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Hoja de Ruta - ${order.orderCode}</title>
            <style>
              body { font-family: monospace; white-space: pre-wrap; padding: 20px; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
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
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <button onClick={() => router.back()} className="text-sky-600">← Volver</button>
        <button 
          onClick={handlePrint}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          title="Imprimir"
        >
          <Image src="/ActionPrint.png" alt="Imprimir" width={20} height={20} className="object-contain" />
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <span className="text-2xl font-bold text-sky-600">#{order.orderCode}</span>
            <p className="font-medium text-gray-800">{order.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.statusOrder)}`}>
            {order.statusName}
          </span>
        </div>

        {canStartDelivery() && (
          <button
            onClick={startDelivery}
            disabled={updating}
            className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md mb-4"
          >
            {updating ? 'Actualizando...' : `🚀 ${getStatusButtonText()}`}
          </button>
        )}

        {!canStartDelivery() && order.statusId === 3 && (
          <div className="w-full bg-orange-50 text-orange-700 py-3 rounded-xl font-medium text-center mb-4 border border-orange-200">
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

      {order.steps && order.steps.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-bold mb-3 text-gray-800">
            {user.role === 'driver' ? 'Mis Destinos' : 'Pasos del pedido'}
          </h3>
          <div className="space-y-3">
            {order.steps.map((step, index) => (
              <div key={step.stepId} className="border-l-2 border-sky-300 pl-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize text-gray-800">{step.step_type}</span>
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
                  <p className="text-sm text-gray-500">📞 {step.contact_name} - {step.contact_phone}</p>
                )}
                {step.notes && (
                  <p className="text-sm text-gray-400 italic">{step.notes}</p>
                )}
                {step.package_qty > 0 && (
                  <p className="text-xs text-sky-600 mt-1">📦 {step.package_qty} paquete(s)</p>
                )}
                {step.driverName && user.role === 'manager' && (
                  <p className="text-sm text-sky-600">Driver: {step.driverName}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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
                {t.observation && (
                  <p className="text-gray-500">{t.observation}</p>
                )}
                {t.receiver_name && (
                  <p className="text-gray-400 text-xs">Receptor: {t.receiver_name} ({t.receiver_document})</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {user.role === 'manager' && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h3 className="font-bold mb-3 text-gray-800">Cambiar Estado</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateOrderStatus(1)}
              disabled={updating || order.statusId === 1}
              className="bg-yellow-500 text-white py-2 rounded-lg disabled:opacity-50"
            >
              Pendiente
            </button>
            <button
              onClick={() => updateOrderStatus(2)}
              disabled={updating || order.statusId === 2}
              className="bg-sky-500 text-white py-2 rounded-lg disabled:opacity-50"
            >
              Asignado
            </button>
            <button
              onClick={() => updateOrderStatus(3)}
              disabled={updating || order.statusId === 3}
              className="bg-orange-500 text-white py-2 rounded-lg disabled:opacity-50"
            >
              En Curso
            </button>
            <button
              onClick={() => updateOrderStatus(4)}
              disabled={updating || order.statusId === 4}
              className="bg-green-500 text-white py-2 rounded-lg disabled:opacity-50"
            >
              Completado
            </button>
            <button
              onClick={() => updateOrderStatus(5)}
              disabled={updating || order.statusId === 5}
              className="bg-red-500 text-white py-2 rounded-lg disabled:opacity-50 col-span-2"
            >
              Cancelar Orden
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
