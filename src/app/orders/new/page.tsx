'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Address {
  id: number;
  street: string;
  number: string;
  apartment: string;
  city: string;
  notes: string;
  is_favorite: boolean;
}

interface Customer {
  id: string;
  name: string;
  lastname: string;
  email: string;
}

interface Locality {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
}

interface OriginStep {
  street: string;
  number: string;
  apartment: string;
  city: string;
  contactName: string;
  contactPhone: string;
  notes: string;
  selectedAddressId?: number;
  saveAddress: boolean;
  addressName: string;
}

interface DestinationStep {
  id: number;
  street: string;
  number: string;
  apartment: string;
  city: string;
  contactName: string;
  contactPhone: string;
  notes: string;
  packageQty: number;
}

function LocalityInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const { authFetch } = useAuth();
  const [suggestions, setSuggestions] = useState<Locality[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(val: string) {
    setInputValue(val);
    onChange(val);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (val.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await authFetch(`/api/localities?search=${encodeURIComponent(val)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function selectSuggestion(loc: Locality) {
    const display = `${loc.name}, ${loc.departmentName}`;
    setInputValue(display);
    onChange(display);
    setShowSuggestions(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
        placeholder="Escribí para buscar..."
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-1 shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((loc) => (
            <li
              key={loc.id}
              onClick={() => selectSuggestion(loc)}
              className="px-4 py-2 hover:bg-sky-50 cursor-pointer text-sm"
            >
              <span className="font-medium">{loc.name}</span>
              <span className="text-gray-400 ml-1">- {loc.departmentName}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  const router = useRouter();
  const { user, authFetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);

  const [originStep, setOriginStep] = useState<OriginStep>({
    street: '', number: '', apartment: '', city: '',
    contactName: '', contactPhone: '', notes: '',
    selectedAddressId: undefined, saveAddress: false, addressName: ''
  });

  const [destinationSteps, setDestinationSteps] = useState<DestinationStep[]>([
    { id: 1, street: '', number: '', apartment: '', city: '', contactName: '', contactPhone: '', notes: '', packageQty: 1 }
  ]);

  const [orderNotes, setOrderNotes] = useState('');
  const [orderDescription, setOrderDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.role === 'customer') {
      fetchAddresses(user.id);
    }
    if (user.role === 'manager') {
      fetchCustomers();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'manager' && selectedCustomerId) {
      fetchAddresses(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  async function fetchAddresses(customerId: string) {
    try {
      const res = await authFetch(`/api/addresses?customerId=${customerId}`);
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await authFetch('/api/customers');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  }

  function addDestination() {
    setDestinationSteps([
      ...destinationSteps,
      { id: Date.now(), street: '', number: '', apartment: '', city: '', contactName: '', contactPhone: '', notes: '', packageQty: 1 }
    ]);
  }

  function removeDestination(id: number) {
    if (destinationSteps.length > 1) {
      setDestinationSteps(destinationSteps.filter(d => d.id !== id));
    }
  }

  function updateDestination(id: number, field: string, value: any) {
    setDestinationSteps(destinationSteps.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  }

  async function handleSubmit() {
    setError('');

    if (user?.role === 'manager' && !selectedCustomerId) {
      setError('Seleccioná un cliente');
      return;
    }

    const fullAddress = [originStep.street, originStep.number, originStep.apartment, originStep.city].filter(Boolean).join(', ');

    if (!originStep.street || !originStep.city || !originStep.contactName || !originStep.contactPhone) {
      setError('Completá los datos del origen');
      return;
    }

    const incompleteDest = destinationSteps.find(d => !d.street || !d.city || !d.contactName);
    if (incompleteDest) {
      const missing = [];
      if (!incompleteDest.street) missing.push('calle');
      if (!incompleteDest.city) missing.push('localidad');
      if (!incompleteDest.contactName) missing.push('contacto');
      setError(`Completá los datos del destino: falta ${missing.join(', ')}`);
      return;
    }

    const validDests = destinationSteps.map(d => ({
      ...d,
      address: [d.street, d.number, d.apartment, d.city].filter(Boolean).join(', ')
    }));

    setLoading(true);
    try {
      const res = await authFetch('/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          customerId: user?.role === 'manager' ? selectedCustomerId : user?.id,
          description: orderDescription,
          notes: orderNotes,
          type: 'distribution',
          originStep: { ...originStep, address: fullAddress },
          destinationSteps: validDests
        })
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/orders/${data.orderId}`);
      } else {
        setError(data.error || 'Error al crear la orden');
      }
    } catch (err) {
      setError('Error al crear la orden');
    }
    setLoading(false);
  }

  function handleAddressSelect(addressId: number) {
    const addr = addresses.find(a => a.id === addressId);
    if (addr) {
      setOriginStep({
        ...originStep,
        selectedAddressId: addressId,
        street: addr.street,
        number: addr.number || '',
        apartment: addr.apartment || '',
        city: addr.city,
        addressName: addr.notes || addr.street
      });
    }
  }

  if (!user) {
    return <div className="p-4">Debes iniciar sesión</div>;
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-sky-600">←</button>
        <h1 className="text-xl font-bold text-gray-800">Nueva Orden</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* Customer selector for manager */}
      {user.role === 'manager' && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
          <h2 className="font-bold text-gray-800 mb-3">👤 Cliente</h2>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
          >
            <option value="">Seleccionar cliente...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} {c.lastname} ({c.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Descripcion */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">📋 Descripción</h2>
        <input
          type="text"
          value={orderDescription}
          onChange={(e) => setOrderDescription(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
          placeholder="Breve descripción del envío"
        />
      </div>

      {/* Origin */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">📍 Origen (Retiro)</h2>

        {!showNewAddress ? (
          <>
            <label className="block text-sm font-medium text-gray-600 mb-1">Dirección de retiro</label>
            {addresses.length > 0 ? (
              <select
                value={originStep.selectedAddressId || ''}
                onChange={(e) => handleAddressSelect(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 mb-3"
              >
                <option value="">Seleccionar dirección guardada</option>
                {addresses.map(addr => (
                  <option key={addr.id} value={addr.id}>
                    {addr.street} {addr.number}, {addr.city} {addr.apartment ? `(${addr.apartment})` : ''}
                  </option>
                ))}
              </select>
            ) : null}

            <button
              onClick={() => setShowNewAddress(true)}
              className="text-sky-600 text-sm font-medium"
            >
              + Agregar nueva dirección
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Calle *</label>
              <input
                type="text"
                value={originStep.street}
                onChange={(e) => setOriginStep({...originStep, street: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                placeholder="Av. Principal"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Número</label>
                <input
                  type="text"
                  value={originStep.number}
                  onChange={(e) => setOriginStep({...originStep, number: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                  placeholder="123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Apto/Oficina</label>
                <input
                  type="text"
                  value={originStep.apartment}
                  onChange={(e) => setOriginStep({...originStep, apartment: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                  placeholder="Apto 4"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Localidad *</label>
              <LocalityInput
                value={originStep.city}
                onChange={(val) => setOriginStep({...originStep, city: val})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre para guardar</label>
              <input
                type="text"
                value={originStep.addressName}
                onChange={(e) => setOriginStep({...originStep, addressName: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                placeholder="Mi casa"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={originStep.saveAddress}
                onChange={(e) => setOriginStep({...originStep, saveAddress: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Guardar esta dirección</span>
            </label>
            <button
              onClick={() => setShowNewAddress(false)}
              className="text-gray-500 text-sm"
            >
              ← Volver a direcciones guardadas
            </button>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Contacto *</label>
              <input
                type="text"
                value={originStep.contactName}
                onChange={(e) => setOriginStep({...originStep, contactName: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono *</label>
              <input
                type="text"
                value={originStep.contactPhone}
                onChange={(e) => setOriginStep({...originStep, contactPhone: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                placeholder="099123456"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">Observaciones</label>
            <input
              type="text"
              value={originStep.notes}
              onChange={(e) => setOriginStep({...originStep, notes: e.target.value})}
              className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
              placeholder="Horario de retiro, etc."
            />
          </div>
        </div>
      </div>

      {/* Destinations */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-gray-800">📦 Destinos</h2>
          <button onClick={addDestination} className="text-sky-600 text-sm font-medium">
            + Agregar
          </button>
        </div>

        {destinationSteps.map((dest, index) => (
          <div key={dest.id} className="border border-gray-200 rounded-xl p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Destino {index + 1}</span>
              {destinationSteps.length > 1 && (
                <button onClick={() => removeDestination(dest.id)} className="text-red-500 text-sm">✕</button>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Calle *</label>
                <input
                  type="text"
                  value={dest.street}
                  onChange={(e) => updateDestination(dest.id, 'street', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                  placeholder="Av. Principal"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Número</label>
                  <input
                    type="text"
                    value={dest.number}
                    onChange={(e) => updateDestination(dest.id, 'number', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                    placeholder="123"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Apto/Oficina</label>
                  <input
                    type="text"
                    value={dest.apartment}
                    onChange={(e) => updateDestination(dest.id, 'apartment', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                    placeholder="Apto 4"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Localidad *</label>
                <LocalityInput
                  value={dest.city}
                  onChange={(val) => updateDestination(dest.id, 'city', val)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Contacto *</label>
                  <input
                    type="text"
                    value={dest.contactName}
                    onChange={(e) => updateDestination(dest.id, 'contactName', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                    placeholder="Nombre"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={dest.contactPhone}
                    onChange={(e) => updateDestination(dest.id, 'contactPhone', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                    placeholder="099123456"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones</label>
                  <input
                    type="text"
                    value={dest.notes}
                    onChange={(e) => updateDestination(dest.id, 'notes', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                    placeholder="Timbre, horario, etc."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cant. paquetes</label>
                  <input
                    type="number"
                    min="1"
                    value={dest.packageQty}
                    onChange={(e) => updateDestination(dest.id, 'packageQty', parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order notes */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-3">📝 Notas de la orden</h2>
        <textarea
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50"
          placeholder="Información adicional..."
          rows={3}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-sky-500 text-white py-4 rounded-xl font-semibold hover:bg-sky-600 disabled:opacity-50 shadow-md"
      >
        {loading ? 'Creando...' : 'Crear Orden'}
      </button>
    </div>
  );
}
