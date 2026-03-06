'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Address {
  id: number;
  name: string;
  street: string;
  number: string;
  city: string;
  province: string;
  apartment: string;
  latitude: number | null;
  longitude: number | null;
  is_favorite: boolean;
}

export default function AddressesPage() {
  const router = useRouter();
  const { user, authFetch, loading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '', street: '', number: '', city: '', province: '', additionalInfo: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  async function fetchAddresses() {
    setLoading(true);
    try {
      const res = await authFetch(`/api/addresses?customerId=${user?.id}`);
      const data = await res.json();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
    setLoading(false);
  }

  function startEdit(addr: Address) {
    setForm({
      name: addr.name || '',
      street: addr.street || '',
      number: addr.number || '',
      city: addr.city || '',
      province: addr.province || '',
      additionalInfo: addr.apartment || '',
    });
    setEditingId(addr.id);
    setShowForm(true);
    setError('');
  }

  function startNew() {
    setForm({ name: '', street: '', number: '', city: '', province: '', additionalInfo: '' });
    setEditingId(null);
    setShowForm(true);
    setError('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setError('');
  }

  async function handleSave() {
    if (!form.street || !form.city) {
      setError('Calle y ciudad son requeridos');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        customerId: user?.id,
        name: form.name,
        street: form.street,
        number: form.number,
        city: form.city,
        province: form.province,
        additionalInfo: form.additionalInfo,
        saveAddress: true,
      };

      if (editingId) {
        await authFetch(`/api/addresses/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await authFetch('/api/addresses', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      cancelForm();
      fetchAddresses();
    } catch (err) {
      setError('Error al guardar');
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este domicilio?')) return;
    try {
      await authFetch(`/api/addresses/${id}`, { method: 'DELETE' });
      fetchAddresses();
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  }

  if (authLoading || !user) return null;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mis Domicilios</h1>
          <p className="text-gray-500 text-sm">Gestiona tus direcciones guardadas</p>
        </div>
        <button
          onClick={startNew}
          className="bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:bg-sky-600"
        >
          + Nuevo Domicilio
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-sky-200">
          <h3 className="font-bold text-gray-800 mb-3">
            {editingId ? 'Editar Domicilio' : 'Nuevo Domicilio'}
          </h3>
          {error && (
            <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-3 text-sm">{error}</div>
          )}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nombre del lugar (opcional)</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                placeholder="Ej: Oficina central, Casa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Calle y numero *</label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                placeholder="Av. Corrientes 1234"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Ciudad *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  placeholder="Montevideo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Provincia</label>
                <input
                  type="text"
                  value={form.province}
                  onChange={(e) => setForm({ ...form, province: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  placeholder="Montevideo"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Info adicional</label>
              <input
                type="text"
                value={form.additionalInfo}
                onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                placeholder="Piso, depto, timbre"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={cancelForm}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-sky-500 text-white py-2 rounded-xl font-medium disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No tenés domicilios guardados</p>
          <p className="text-sm mt-1">Agrega uno para usar en tus envíos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {addr.name && <p className="font-semibold text-gray-800">{addr.name}</p>}
                  <p className="text-gray-700">{addr.street} {addr.number}</p>
                  {addr.apartment && <p className="text-gray-500 text-sm">{addr.apartment}</p>}
                  <p className="text-gray-500 text-sm">{addr.city}{addr.province ? `, ${addr.province}` : ''}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => startEdit(addr)}
                  className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-600 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="flex-1 flex items-center justify-center gap-1 text-sm text-red-500 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
