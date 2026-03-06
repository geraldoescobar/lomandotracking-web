'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { user, authFetch, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: '', lastname: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  async function fetchProfile() {
    try {
      const res = await authFetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setForm({
          name: data.name || '',
          lastname: data.lastname || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await authFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name,
          lastname: form.lastname,
          phone: form.phone,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Error al guardar');
      }
    } catch (err) {
      setError('Error al guardar');
    }
    setSaving(false);
  }

  function getRoleLabel(role: string) {
    if (role === 'manager') return 'Administrador';
    if (role === 'driver') return 'Repartidor';
    return 'Cliente';
  }

  if (authLoading || !user) return null;

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
        <p className="text-gray-500 text-sm">Gestiona tu informacion personal</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
            <h2 className="text-sky-600 font-semibold mb-4">Informacion Personal</h2>

            {error && (
              <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg mb-3 text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 px-3 py-2 rounded-lg mb-3 text-sm">Cambios guardados</div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={form.lastname}
                    onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">El email no se puede modificar</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Telefono</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
                  placeholder="Tu numero de telefono"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-4 bg-sky-500 text-white px-6 py-2 rounded-xl font-medium shadow-md hover:bg-sky-600 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <h2 className="text-gray-800 font-semibold mb-2">Tipo de Cuenta</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-800">{getRoleLabel(user.role)}</p>
                <p className="text-sm text-gray-500">Cuenta personal</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Activo</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
