'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string;
  vehicle_info: string;
  userId: string;
  userEmail: string;
  isActive: boolean;
}

interface DriverForm {
  name: string;
  phone: string;
  email: string;
  vehicleInfo: string;
  password: string;
  isActive: boolean;
}

const emptyForm: DriverForm = { name: '', phone: '', email: '', vehicleInfo: '', password: '', isActive: true };

export default function DriversPage() {
  const { authFetch } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete confirm
  const [deleting, setDeleting] = useState<Driver | null>(null);

  useEffect(() => {
    fetchDrivers();
  }, [search]);

  async function fetchDrivers() {
    setLoading(true);
    try {
      const url = search ? `/api/drivers?search=${encodeURIComponent(search)}` : '/api/drivers';
      const res = await authFetch(url);
      if (res.ok) {
        setDrivers(await res.json());
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(driver: Driver) {
    setEditing(driver);
    setForm({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      vehicleInfo: driver.vehicle_info,
      password: '',
      isActive: driver.isActive,
    });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      setError('Nombre y email son requeridos');
      return;
    }
    if (!editing && !form.password) {
      setError('La contraseña es requerida para nuevos cadetes');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/drivers/${editing.id}` : '/api/drivers';
      const method = editing ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchDrivers();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al guardar');
      }
    } catch {
      setError('Error al guardar');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      const res = await authFetch(`/api/drivers/${deleting.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleting(null);
        fetchDrivers();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al eliminar');
      }
    } catch {
      setError('Error al eliminar');
    }
    setSaving(false);
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Cadetes</h1>
        <button
          onClick={openCreate}
          className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600"
        >
          + Nuevo Cadete
        </button>
      </div>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, telefono o email..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No hay cadetes registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{driver.name}</p>
                  {!driver.isActive && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactivo</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{driver.phone || 'Sin telefono'}</p>
                <p className="text-gray-500 text-sm">{driver.email}</p>
                {driver.vehicle_info && (
                  <p className="text-gray-400 text-xs mt-1">{driver.vehicle_info}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(driver)}
                  className="text-sky-600 hover:text-sky-800 text-sm font-medium px-3 py-1 border border-sky-200 rounded-lg"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleting(driver)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-200 rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">
              {editing ? 'Editar Cadete' : 'Nuevo Cadete'}
            </h2>

            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="Juan Perez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="juan@ejemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Telefono</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="099123456"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Vehiculo</label>
                <input
                  type="text"
                  value={form.vehicleInfo}
                  onChange={(e) => setForm({ ...form, vehicleInfo: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="Moto Honda CG 150"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {editing ? 'Nueva contraseña (dejar vacio para no cambiar)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="••••••"
                />
              </div>
              {editing && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    id="isActive"
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-600">Activo</label>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-sky-500 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Eliminar Cadete</h2>
            <p className="text-gray-600 text-sm mb-4">
              ¿Estas seguro de que queres eliminar a <strong>{deleting.name}</strong>?
              {' '}Si tiene envios asignados, se desactivara en lugar de eliminarse.
            </p>
            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { setDeleting(null); setError(''); }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
