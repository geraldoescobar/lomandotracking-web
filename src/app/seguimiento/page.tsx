'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// ── Types ──
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
  assigned_driver_id?: number;
  driverName?: string;
}

interface OrderResult {
  type: 'order';
  order: {
    orderId: number;
    orderCode: string;
    description: string;
    statusId: number;
    statusName: string;
    statusOrder: number;
    created_at: string;
    customerName: string;
    customerLastname: string;
    customerPhone: string;
  };
  steps: Step[];
  driverSteps?: Step[];
}

interface StepResult {
  type: 'step';
  step: {
    stepId: number;
    stepCode: string;
    step_type: string;
    address: string;
    contact_name: string;
    contact_phone: string;
    notes: string;
    package_qty: number;
    statusId: number;
    statusName: string;
    statusOrder: number;
    orderCode: string;
    orderDescription: string;
    order_id: number;
  };
}

// Public tracking result (different shape)
interface PublicStepResult {
  type: 'step';
  stepCode: string;
  statusName: string;
  statusOrder: number;
  address: string;
  contact_name: string;
  contact_phone: string;
  package_qty: number;
  orderCode: string;
  orderStatusName: string;
  orderStatusOrder: number;
}

interface PublicOrderResult {
  type: 'order';
  orderCode: string;
  description: string;
  statusName: string;
  statusOrder: number;
  created_at: string;
  steps: { stepId: number; step_type: string; address: string; contact_name: string; statusName: string; statusOrder: number }[];
}

type ScanResult = OrderResult | StepResult;
type PublicResult = PublicOrderResult | PublicStepResult;

export default function SeguimientoPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Cargando...</p></div>}>
      <SeguimientoPage />
    </Suspense>
  );
}

function SeguimientoPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, authFetch, loading: authLoading } = useAuth();

  const [code, setCode] = useState(searchParams.get('code') || '');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [publicResult, setPublicResult] = useState<PublicResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Delivery modal
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryStepId, setDeliveryStepId] = useState<number | null>(null);
  const [receiverName, setReceiverName] = useState('');
  const [receiverDocument, setReceiverDocument] = useState('');

  // Report modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStepId, setReportStepId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportPhoto, setReportPhoto] = useState<File | null>(null);

  // Auto-search on mount if code present
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode && !authLoading) {
      setCode(urlCode.toUpperCase());
      doSearch(urlCode.toUpperCase());
    }
  }, [searchParams, authLoading]);

  async function doSearch(searchCode: string) {
    if (!searchCode.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setPublicResult(null);
    setActionMessage('');

    try {
      if (user) {
        // Authenticated search
        const res = await authFetch(`/api/scan?code=${searchCode.trim()}`);
        if (res.ok) {
          const data = await res.json();
          setResult(data);
        } else {
          setError('No se encontró ningún envío con ese código');
        }
      } else {
        // Public search (only step codes allowed)
        const res = await fetch(`/api/track/${searchCode.trim()}`);
        if (res.ok) {
          const data = await res.json();
          setPublicResult(data);
        } else {
          // Could be an order code that requires auth — redirect to login
          router.push(`/login?redirect=${encodeURIComponent(`/seguimiento?code=${searchCode.trim()}`)}`);
          return;
        }
      }
    } catch {
      setError('Error al buscar');
    }
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(code);
  }

  // ── Driver actions ──
  async function driverOrderAction(orderId: number, newStatusId: number, label: string) {
    setUpdating(true);
    setActionMessage('');
    try {
      const res = await authFetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ statusId: newStatusId, observation: label }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al actualizar');
      } else {
        setActionMessage(`✓ ${label}`);
        await doSearch(code);
      }
    } catch { setError('Error al actualizar'); }
    setUpdating(false);
  }

  async function driverStepAction(stepId: number, newStatusId: number, label: string) {
    setUpdating(true);
    setActionMessage('');
    try {
      const res = await authFetch(`/api/steps/${stepId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ statusId: newStatusId, observation: label }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al actualizar');
      } else {
        setActionMessage(`✓ ${label}`);
        await doSearch(code);
      }
    } catch { setError('Error al actualizar'); }
    setUpdating(false);
  }

  function startDelivery(stepId: number) {
    setDeliveryStepId(stepId);
    setReceiverName('');
    setReceiverDocument('');
    setShowDeliveryModal(true);
  }

  async function confirmDelivery() {
    if (!deliveryStepId || !receiverName || !receiverDocument) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/steps/${deliveryStepId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          statusId: 5,
          observation: 'Entregado',
          receiverName,
          receiverDocument,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al confirmar entrega');
      } else {
        setShowDeliveryModal(false);
        setActionMessage('✓ Paquete entregado');
        await doSearch(code);
      }
    } catch { setError('Error al confirmar entrega'); }
    setUpdating(false);
  }

  function startReport(stepId: number) {
    setReportStepId(stepId);
    setReportReason('');
    setReportPhoto(null);
    setShowReportModal(true);
  }

  async function confirmReport() {
    if (!reportStepId || !reportReason) return;
    setUpdating(true);
    try {
      let photoUrl = '';
      if (reportPhoto) {
        const formData = new FormData();
        formData.append('photo', reportPhoto);
        const uploadRes = await authFetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photoUrl = uploadData.url;
        }
      }

      await authFetch(`/api/steps/${reportStepId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          statusId: 6,
          observation: reportReason,
          photoUrl,
        }),
      });
      setShowReportModal(false);
      setActionMessage('✓ Reporte enviado');
      doSearch(code);
    } catch { setError('Error al reportar'); }
    setUpdating(false);
  }

  // ── Helpers ──
  function getStatusColor(statusOrder: number) {
    if (statusOrder <= 1) return 'bg-yellow-100 text-yellow-800';
    if (statusOrder <= 2) return 'bg-sky-100 text-sky-800';
    if (statusOrder <= 3) return 'bg-orange-100 text-orange-800';
    if (statusOrder >= 5) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  }

  function getStatusDot(statusOrder: number) {
    if (statusOrder >= 5) return 'bg-green-500';
    if (statusOrder >= 2) return 'bg-sky-500';
    return 'bg-gray-300';
  }

  // ── Render ──
  const isDriver = user?.role === 'driver';
  const isCustomer = user?.role === 'customer';
  const isManager = user?.role === 'manager';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-sky-400 p-4 shadow-md">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-bold text-white">
              {isDriver ? 'Escaneo de envío' : 'Seguimiento de envío'}
            </h1>
            {user ? (
              <Link href="/" className="text-sm text-white/80 hover:text-white">← Volver al inicio</Link>
            ) : (
              <Link href="/login" className="text-sm text-white/80 hover:text-white">Ingresar</Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-2">Código de envío o paquete</label>
          <div className="flex gap-2">
            <input
              data-testid="seguimiento-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ej: D000000010200"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono"
            />
            <button
              data-testid="seguimiento-submit"
              type="submit"
              disabled={loading}
              className="bg-sky-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md"
            >
              {loading ? '...' : 'Consultar'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        )}
        {actionMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">{actionMessage}</div>
        )}

        {/* ═══════ PUBLIC VIEW (no user) ═══════ */}
        {!user && publicResult?.type === 'order' && (
          <PublicOrderView result={publicResult as PublicOrderResult} getStatusColor={getStatusColor} getStatusDot={getStatusDot} />
        )}
        {!user && publicResult?.type === 'step' && (
          <PublicStepView result={publicResult as PublicStepResult} getStatusColor={getStatusColor} />
        )}

        {/* ═══════ DRIVER + ORDER ═══════ */}
        {isDriver && result?.type === 'order' && (
          <DriverOrderView
            result={result as OrderResult}
            updating={updating}
            onAction={driverOrderAction}
            onStepAction={driverStepAction}
            onDeliver={startDelivery}
            onReport={startReport}
            getStatusColor={getStatusColor}
          />
        )}

        {/* ═══════ DRIVER + STEP ═══════ */}
        {isDriver && result?.type === 'step' && (
          <DriverStepView
            result={result as StepResult}
            updating={updating}
            onStepAction={driverStepAction}
            onDeliver={startDelivery}
            onReport={startReport}
            getStatusColor={getStatusColor}
          />
        )}

        {/* ═══════ CUSTOMER / MANAGER + ORDER ═══════ */}
        {(isCustomer || isManager) && result?.type === 'order' && (
          <CustomerOrderView
            result={result as OrderResult}
            getStatusColor={getStatusColor}
            getStatusDot={getStatusDot}
          />
        )}

        {/* ═══════ CUSTOMER / MANAGER + STEP ═══════ */}
        {(isCustomer || isManager) && result?.type === 'step' && (
          <CustomerStepView
            result={result as StepResult}
            getStatusColor={getStatusColor}
          />
        )}
      </div>

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Confirmar entrega</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre de quien recibe *</label>
                <input data-testid="delivery-receiver-name" type="text" value={receiverName} onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2" placeholder="Juan Pérez" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cédula (CI) *</label>
                <input data-testid="delivery-receiver-ci" type="text" value={receiverDocument} onChange={(e) => setReceiverDocument(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2" placeholder="1.234.567-8" />
              </div>
            </div>
            <div className="flex gap-2">
              <button data-testid="delivery-cancel" onClick={() => setShowDeliveryModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancelar</button>
              <button data-testid="delivery-confirm" onClick={confirmDelivery} disabled={!receiverName || !receiverDocument || updating}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg disabled:opacity-50">
                {updating ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Reportar problema</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Motivo *</label>
                <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2">
                  <option value="">Seleccionar motivo...</option>
                  <option value="No se encontró al destinatario">No se encontró al destinatario</option>
                  <option value="Dirección incorrecta">Dirección incorrecta</option>
                  <option value="Destinatario rechazó el paquete">Destinatario rechazó el paquete</option>
                  <option value="Zona inaccesible">Zona inaccesible</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Foto del domicilio (opcional)</label>
                <input type="file" accept="image/*" capture="environment"
                  onChange={(e) => setReportPhoto(e.target.files?.[0] || null)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowReportModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg">Cancelar</button>
              <button onClick={confirmReport} disabled={!reportReason || updating}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg disabled:opacity-50">
                {updating ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════
// Sub-components
// ═══════════════════════════════════

function PublicOrderView({ result, getStatusColor, getStatusDot }: { result: PublicOrderResult; getStatusColor: (n: number) => string; getStatusDot: (n: number) => string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xl font-bold text-sky-600">#{result.orderCode}</span>
          {result.description && <p className="text-sm text-gray-700">{result.description}</p>}
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.statusOrder)}`}>{result.statusName}</span>
      </div>
      {result.steps?.map((step, i) => (
        <div key={step.stepId} className="flex gap-3 mt-2">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${getStatusDot(step.statusOrder)}`}></div>
            {i < result.steps.length - 1 && <div className="w-0.5 flex-1 min-h-[20px] bg-gray-200"></div>}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">{step.step_type === 'origin' ? 'Origen' : 'Destino'}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(step.statusOrder)}`}>{step.statusName}</span>
            </div>
            <p className="text-sm text-gray-600">{step.address}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PublicStepView({ result, getStatusColor }: { result: PublicStepResult; getStatusColor: (n: number) => string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-lg font-bold text-sky-600">#{result.stepCode}</span>
          <p className="text-xs text-gray-400">Orden: {result.orderCode}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.statusOrder)}`}>{result.statusName}</span>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">{result.address}</p>
        {result.contact_name && <p className="text-sm text-gray-500 mt-1">📞 {result.contact_name}</p>}
        {result.package_qty > 0 && <p className="text-xs text-sky-600 mt-1">📦 {result.package_qty} paquete(s)</p>}
      </div>
      <div className="mt-3 text-sm text-gray-500">
        Estado del pedido: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(result.orderStatusOrder)}`}>{result.orderStatusName}</span>
      </div>
    </div>
  );
}

function DriverOrderView({ result, updating, onAction, onStepAction, onDeliver, onReport, getStatusColor }: {
  result: OrderResult; updating: boolean;
  onAction: (id: number, status: number, label: string) => void;
  onStepAction: (id: number, status: number, label: string) => void;
  onDeliver: (id: number) => void;
  onReport: (id: number) => void;
  getStatusColor: (n: number) => string;
}) {
  const { order, steps } = result;
  const destSteps = steps.filter(s => s.step_type !== 'origin');
  const originStep = steps.find(s => s.step_type === 'origin');

  return (
    <div className="space-y-4">
      {/* Order info */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xl font-bold text-sky-600">#{order.orderCode}</span>
            <p className="text-sm text-gray-700">{order.description}</p>
            <p className="text-sm text-gray-500">{order.customerName} {order.customerLastname} • {order.customerPhone}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.statusOrder)}`}>{order.statusName}</span>
        </div>

        {originStep && (
          <div className="bg-gray-50 rounded-lg p-3 mt-3">
            <p className="text-xs font-medium text-gray-500 mb-1">📍 RETIRO</p>
            <p className="text-sm font-medium text-gray-800">{originStep.address}</p>
            {originStep.contact_name && <p className="text-sm text-gray-500">{originStep.contact_name} - {originStep.contact_phone}</p>}
          </div>
        )}

        {/* Driver order actions */}
        <div className="mt-4 space-y-2">
          {order.statusId === 1 && (
            <button data-testid="btn-confirm-pickup" onClick={() => onAction(order.orderId, 2, 'Retiro confirmado')} disabled={updating}
              className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 shadow-md">
              📋 Confirmar retiro
            </button>
          )}
          {order.statusId === 2 && (
            <button data-testid="btn-start-delivery" onClick={() => onAction(order.orderId, 3, 'Entrega iniciada')} disabled={updating}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 shadow-md">
              🚚 Salir a entregar
            </button>
          )}
          {order.statusId === 3 && (
            <div className="bg-orange-50 text-orange-700 py-3 rounded-xl text-center border border-orange-200 text-sm">
              🚚 En curso — actualiza cada destino abajo
            </div>
          )}
          {order.statusId >= 4 && (
            <div className="bg-green-50 text-green-700 py-3 rounded-xl text-center border border-green-200 text-sm">
              ✅ {order.statusName}
            </div>
          )}
        </div>
      </div>

      {/* Destination list with actions */}
      {destSteps.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3">Destinos ({destSteps.length})</h3>
          <div className="space-y-3">
            {destSteps.map((step, i) => (
              <div key={step.stepId} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{i + 1}. {step.address}</span>
                    {step.contact_name && <p className="text-xs text-gray-500">{step.contact_name} - {step.contact_phone}</p>}
                    {step.package_qty > 0 && <p className="text-xs text-sky-600">📦 {step.package_qty} paquete(s)</p>}
                    {step.notes && <p className="text-xs text-gray-400 italic">{step.notes}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusColor(step.statusOrder)}`}>{step.statusName}</span>
                </div>
                {/* Step actions */}
                {step.statusId < 5 && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                    {(step.statusId === 1 || step.statusId === 2) && (
                      <button data-testid={`btn-en-camino-${i}`} onClick={() => onStepAction(step.stepId, 3, 'En camino')} disabled={updating}
                        className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                        🚚 En camino
                      </button>
                    )}
                    {step.statusId === 3 && (
                      <>
                        <button data-testid={`btn-deliver-${i}`} onClick={() => onDeliver(step.stepId)} disabled={updating}
                          className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                          Entregar
                        </button>
                        <button data-testid={`btn-report-${i}`} onClick={() => onReport(step.stepId)} disabled={updating}
                          className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                          Problema
                        </button>
                      </>
                    )}
                  </div>
                )}
                {step.statusId >= 5 && (
                  <div className={`mt-2 pt-2 border-t border-gray-100 text-center text-xs ${step.statusId === 5 ? 'text-green-600' : 'text-red-600'}`}>
                    {step.statusId === 5 ? 'Entregado' : 'No entregado'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DriverStepView({ result, updating, onStepAction, onDeliver, onReport, getStatusColor }: {
  result: StepResult; updating: boolean;
  onStepAction: (id: number, status: number, label: string) => void;
  onDeliver: (id: number) => void;
  onReport: (id: number) => void;
  getStatusColor: (n: number) => string;
}) {
  const { step } = result;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-lg font-bold text-sky-600">#{step.stepCode}</span>
          <p className="text-xs text-gray-400">Orden: {step.orderCode}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.statusOrder)}`}>{step.statusName}</span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="font-medium text-gray-800">{step.address}</p>
        {step.contact_name && <p className="text-sm text-gray-600">📞 {step.contact_name} - {step.contact_phone}</p>}
        {step.notes && <p className="text-sm text-gray-400 italic mt-1">📝 {step.notes}</p>}
        {step.package_qty > 0 && <p className="text-xs text-sky-600 mt-1">📦 {step.package_qty} paquete(s)</p>}
      </div>

      {/* Driver step actions */}
      <div className="space-y-2">
        {step.statusId === 1 && (
          <button onClick={() => onStepAction(step.stepId, 3, 'En camino')} disabled={updating}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 shadow-md">
            🚚 Iniciar viaje
          </button>
        )}
        {step.statusId === 2 && (
          <button onClick={() => onStepAction(step.stepId, 3, 'En camino')} disabled={updating}
            className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 shadow-md">
            🚚 Iniciar viaje
          </button>
        )}
        {step.statusId === 3 && (
          <>
            <button onClick={() => onDeliver(step.stepId)} disabled={updating}
              className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 shadow-md">
              ✅ Entregar
            </button>
            <button onClick={() => onReport(step.stepId)} disabled={updating}
              className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 shadow-md">
              ⚠️ Reportar problema
            </button>
          </>
        )}
        {step.statusId >= 5 && (
          <div className={`py-3 rounded-xl text-center border text-sm ${step.statusId === 5 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {step.statusId === 5 ? '✅ Entregado' : '⚠️ No entregado'}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomerOrderView({ result, getStatusColor, getStatusDot }: {
  result: OrderResult; getStatusColor: (n: number) => string; getStatusDot: (n: number) => string;
}) {
  const { order, steps } = result;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xl font-bold text-sky-600">#{order.orderCode}</span>
            <p className="text-sm text-gray-700">{order.description}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.statusOrder)}`}>{order.statusName}</span>
        </div>
        <Link href={`/orders/${order.orderId}`} className="text-sm text-sky-600 font-medium hover:underline">
          Ver detalle completo →
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-3">Estado de entrega</h3>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={step.stepId} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${getStatusDot(step.statusOrder)}`}></div>
                {i < steps.length - 1 && <div className="w-0.5 flex-1 min-h-[20px] bg-gray-200"></div>}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{step.step_type === 'origin' ? 'Origen' : 'Destino'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(step.statusOrder)}`}>{step.statusName}</span>
                </div>
                <p className="text-sm text-gray-600">{step.address}</p>
                {step.contact_name && <p className="text-xs text-gray-500">{step.contact_name}</p>}
                {step.package_qty > 0 && <p className="text-xs text-sky-600">📦 {step.package_qty} paquete(s)</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomerStepView({ result, getStatusColor }: { result: StepResult; getStatusColor: (n: number) => string }) {
  const { step } = result;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-lg font-bold text-sky-600">#{step.stepCode}</span>
          <p className="text-xs text-gray-400">Orden: {step.orderCode}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.statusOrder)}`}>{step.statusName}</span>
      </div>
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="font-medium text-gray-800">{step.address}</p>
        {step.contact_name && <p className="text-sm text-gray-600">📞 {step.contact_name} - {step.contact_phone}</p>}
        {step.notes && <p className="text-sm text-gray-400 italic mt-1">{step.notes}</p>}
        {step.package_qty > 0 && <p className="text-xs text-sky-600 mt-1">📦 {step.package_qty} paquete(s)</p>}
      </div>
      <Link href={`/orders/${step.order_id}`} className="block mt-3 text-center text-sm text-sky-600 font-medium bg-sky-50 rounded-xl py-2 hover:bg-sky-100">
        Ver la orden completa →
      </Link>
    </div>
  );
}
