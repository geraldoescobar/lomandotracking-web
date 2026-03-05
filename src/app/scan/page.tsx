'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { Html5Qrcode } from 'html5-qrcode';

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

interface Order {
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
  steps: Step[];
}

interface ScanResult {
  type: 'order' | 'step';
  order?: Order;
  step?: any;
  steps?: Step[];
  driverSteps?: Step[];
  tracking?: any[];
}

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [receiverDocument, setReceiverDocument] = useState('');
  const [stepNotes, setStepNotes] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    return () => {
      if (qrRef.current?.isScanning) {
        qrRef.current.stop();
      }
    };
  }, []);

  async function startScan() {
    setScanError('');
    try {
      const qr = new Html5Qrcode('qr-reader');
      qrRef.current = qr;
      
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          qr.stop();
          setCode(decodedText.toUpperCase());
          handleCodeSearch(decodedText.toUpperCase());
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setScanError('Error al iniciar cámara. Verificá permisos.');
      console.error(err);
    }
  }

  async function stopScan() {
    if (qrRef.current?.isScanning) {
      await qrRef.current.stop();
    }
    setScanning(false);
  }

  async function handleCodeSearch(searchCode: string) {
    if (!searchCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const url = user ? `/api/scan?code=${searchCode.trim()}&role=${user.role}&userId=${user.id}` : `/api/scan?code=${searchCode.trim()}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        const data = await res.json();
        setError(data.error || 'No se encontró');
      }
    } catch (err) {
      setError('Error al buscar');
    }

    setLoading(false);
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    await handleCodeSearch(code);
  }

  async function startDelivery() {
    if (!result?.order) return;
    
    setUpdating(true);
    try {
      await fetch(`/api/orders/${result.order.orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          statusId: 3, 
          userId: user?.id,
          observation: 'Iniciado al escanear código'
        }),
      });
      
      const res = await fetch(`/api/scan?code=${code}&role=${user?.role}&userId=${user?.id}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    }
    setUpdating(false);
  }

  async function updateStepStatus(stepId: number, newStatusId: number) {
    if (newStatusId === 5 && (!receiverName || !receiverDocument)) {
      setShowDeliveryModal(true);
      return;
    }
    
    await submitStepUpdate(stepId, newStatusId);
  }

  async function submitStepUpdate(stepId: number, newStatusId: number) {
    setUpdating(true);
    try {
      await fetch(`/api/steps/${stepId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          statusId: newStatusId, 
          userId: user?.id,
          observation: stepNotes,
          receiverName,
          receiverDocument
        }),
      });
      
      const res = await fetch(`/api/scan?code=${code}&role=${user?.role}&userId=${user?.id}`);
      const data = await res.json();
      setResult(data);
      setShowDeliveryModal(false);
      setReceiverName('');
      setReceiverDocument('');
      setStepNotes('');
    } catch (err) {
      console.error(err);
    }
    setUpdating(false);
  }

  function getStatusColor(statusOrder: number) {
    if (statusOrder <= 1) return 'bg-yellow-100 text-yellow-800';
    if (statusOrder <= 2) return 'bg-sky-100 text-sky-800';
    if (statusOrder <= 3) return 'bg-orange-100 text-orange-800';
    if (statusOrder === 5) return 'bg-green-100 text-green-800';
    return 'bg-red-100 text-red-800';
  }

  function getOrderStatusColor(statusOrder: number) {
    if (statusOrder <= 1) return 'bg-yellow-100 text-yellow-800';
    if (statusOrder <= 2) return 'bg-sky-100 text-sky-800';
    if (statusOrder <= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }

  function canDriverActOnStep(step: Step): boolean {
    if (user?.role !== 'driver') return true;
    if (!result?.driverSteps) return false;
    return result.driverSteps.some(ds => ds.stepId === step.stepId);
  }

  return (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 relative">
          <Image 
            src="/driverIcon.png" 
            alt="Driver" 
            fill
            className="object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-gray-800">Escanear</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div id="qr-reader" className="w-full rounded-lg overflow-hidden mb-3"></div>
        
        {scanError && (
          <p className="text-red-500 text-sm mb-2">{scanError}</p>
        )}
        
        {scanning ? (
          <button
            onClick={stopScan}
            className="w-full bg-red-500 text-white py-3 rounded-xl font-medium"
          >
            ⬛ Detener Cámara
          </button>
        ) : (
          <button
            onClick={startScan}
            className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 shadow-md mb-4"
          >
            📷 Escanear QR
          </button>
        )}
      </div>

      <div className="text-center text-gray-400 text-sm mb-4">— o ingresar manualmente —</div>

      <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder={user?.role === 'customer' ? "Código de entrega (ej: D000000060200)" : "Código de orden o entrega"}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md"
        >
          {loading ? 'Buscando...' : '🔍 Buscar'}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {result && (
        <>
          {result.type === 'order' && result.order && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-2xl font-bold text-sky-600">#{result.order.orderCode}</span>
                  <p className="font-medium text-gray-800">{result.order.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(result.order.statusOrder)}`}>
                  {result.order.statusName}
                </span>
              </div>

              {user?.role === 'driver' && (result.order.statusId === 1 || result.order.statusId === 2 || result.order.statusId === 3) && (
                <button
                  onClick={startDelivery}
                  disabled={updating}
                  className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md mb-4"
                >
                  {updating ? 'Actualizando...' : '🚀 Iniciar Entrega'}
                </button>
              )}

              {result.steps && result.steps.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold text-gray-800 mb-3">
                    {user?.role === 'driver' ? 'Mis Destinos' : 'Destinos'}
                  </h3>
                  <div className="space-y-3">
                    {result.steps.map((step) => (
                      <div key={step.stepId} className="border border-gray-200 rounded-xl p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize text-gray-800">{step.step_type}</span>
                            {step.stepCode && (
                              <span className="text-xs bg-sky-50 text-sky-600 px-2 py-0.5 rounded font-mono">{step.stepCode}</span>
                            )}
                            {step.driverName && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">🚚 {step.driverName}</span>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(step.statusOrder)}`}>
                            {step.statusName}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{step.address}</p>
                        {step.contact_name && (
                          <p className="text-sm text-gray-500">📞 {step.contact_name} - {step.contact_phone}</p>
                        )}
                        
                        {(user?.role === 'driver' || user?.role === 'manager') && step.statusId < 5 && canDriverActOnStep(step) && (
                          <div className="mt-3 pt-2 border-t flex gap-2">
                            {step.statusId === 1 && (
                              <button
                                onClick={() => updateStepStatus(step.stepId, 2)}
                                disabled={updating}
                                className="flex-1 bg-sky-500 text-white py-2 rounded-lg text-sm"
                              >
                                Asignarme
                              </button>
                            )}
                            {step.statusId === 2 && (
                              <button
                                onClick={() => updateStepStatus(step.stepId, 3)}
                                disabled={updating}
                                className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm"
                              >
                                🚚 En Viaje
                              </button>
                            )}
                            {step.statusId === 3 && (
                              <button
                                onClick={() => updateStepStatus(step.stepId, 5)}
                                disabled={updating}
                                className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm"
                              >
                                ✅ Entregado
                              </button>
                            )}
                            {step.statusId < 5 && (
                              <button
                                onClick={() => updateStepStatus(step.stepId, 6)}
                                disabled={updating}
                                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm"
                              >
                                ⚠️ No Entregado
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {result.type === 'step' && result.step && (
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-xl font-bold text-sky-600">#{result.step.stepCode}</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Pedido: {result.step.orderCode}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.step.statusOrder)}`}>
                  {result.step.statusName}
                </span>
              </div>

              <div className="border-t pt-3 mt-3">
                <h3 className="font-medium text-gray-700 mb-2 capitalize">{result.step.step_type}</h3>
                <p className="text-gray-800">{result.step.address}</p>
                {result.step.contact_name && (
                  <p className="text-gray-600">📞 {result.step.contact_name} - {result.step.contact_phone}</p>
                )}
                {result.step.notes && (
                  <p className="text-gray-500 text-sm mt-2">📝 {result.step.notes}</p>
                )}
              </div>

              {user?.role === 'customer' && (
                <div className="mt-4 p-3 bg-sky-50 rounded-lg">
                  <p className="text-sm text-sky-700">
                    Para más información sobre tu entrega, consultá en la app de tu remitente o comunicate con ellos.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-4">Confirmar Entrega</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre quien recibe</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Documento (CI)</label>
                <input
                  type="text"
                  value={receiverDocument}
                  onChange={(e) => setReceiverDocument(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Observación</label>
                <input
                  type="text"
                  value={stepNotes}
                  onChange={(e) => setStepNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2"
                  placeholder="Dejó en conserjería, etc."
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const step = result?.steps?.find(s => s.statusId < 5);
                  if (step) submitStepUpdate(step.stepId, 5);
                }}
                disabled={!receiverName || !receiverDocument}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
