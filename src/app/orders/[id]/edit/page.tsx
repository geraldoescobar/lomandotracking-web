'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

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
}

interface OrderData {
  orderId: number;
  orderCode: string;
  description: string;
  notes: string;
  steps: Step[];
}

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { user, authFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [orderCode, setOrderCode] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (params.id && user) fetchOrder();
  }, [params.id, user]);

  async function fetchOrder() {
    try {
      const res = await authFetch(`/api/orders/${params.id}`);
      if (res.ok) {
        const data: OrderData = await res.json();
        setOrderCode(data.orderCode);
        setDescription(data.description || '');
        setNotes(data.notes || '');
        setSteps(data.steps || []);
      }
    } catch {}
    setLoading(false);
  }

  function updateStep(stepId: number, field: keyof Step, value: string | number) {
    setSteps(prev => prev.map(s =>
      s.stepId === stepId ? { ...s, [field]: value } : s
    ));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await authFetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          description,
          notes,
          steps: steps.map(s => ({
            stepId: s.stepId,
            address: s.address,
            contact_name: s.contact_name,
            contact_phone: s.contact_phone,
            notes: s.notes,
            package_qty: s.package_qty,
          })),
        }),
      });

      if (res.ok) {
        setSuccess('Orden actualizada correctamente');
        setTimeout(() => router.push(`/orders/${params.id}`), 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al guardar');
      }
    } catch {
      setError('Error al guardar');
    }
    setSaving(false);
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (user.role !== 'manager') {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No tenes permisos para editar ordenes</p>
      </div>
    );
  }

  const originSteps = steps.filter(s => s.step_type === 'origin');
  const destSteps = steps.filter(s => s.step_type !== 'origin');

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => router.back()} className="text-sky-600">← Volver</button>
        <h1 className="text-lg font-bold">Editar #{orderCode}</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 px-4 py-3 rounded-xl text-sm mb-4">{success}</div>
      )}

      {/* Order info */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <h2 className="font-bold text-gray-800 mb-3">Datos de la orden</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Descripcion</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Origin */}
      {originSteps.map((step) => (
        <div key={step.stepId} className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">
            Origen
            <span className="text-xs font-mono text-gray-400 ml-2">{step.stepCode}</span>
          </h2>
          <StepForm step={step} onUpdate={updateStep} />
        </div>
      ))}

      {/* Destinations */}
      {destSteps.map((step, i) => (
        <div key={step.stepId} className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <h2 className="font-bold text-gray-800 mb-3">
            Destino {i + 1}
            <span className="text-xs font-mono text-gray-400 ml-2">{step.stepCode}</span>
          </h2>
          <StepForm step={step} onUpdate={updateStep} showPackageQty />
        </div>
      ))}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-sky-500 text-white py-3 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}

function StepForm({ step, onUpdate, showPackageQty }: {
  step: Step;
  onUpdate: (stepId: number, field: keyof Step, value: string | number) => void;
  showPackageQty?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Direccion</label>
        <input
          type="text"
          value={step.address}
          onChange={(e) => onUpdate(step.stepId, 'address', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contacto</label>
          <input
            type="text"
            value={step.contact_name}
            onChange={(e) => onUpdate(step.stepId, 'contact_name', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Telefono</label>
          <input
            type="text"
            value={step.contact_phone}
            onChange={(e) => onUpdate(step.stepId, 'contact_phone', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Notas</label>
        <input
          type="text"
          value={step.notes || ''}
          onChange={(e) => onUpdate(step.stepId, 'notes', e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2"
        />
      </div>
      {showPackageQty && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Cant. paquetes</label>
          <input
            type="number"
            min={0}
            value={step.package_qty}
            onChange={(e) => onUpdate(step.stepId, 'package_qty', Number(e.target.value))}
            className="w-24 border border-gray-200 rounded-lg px-3 py-2"
          />
        </div>
      )}
    </div>
  );
}
