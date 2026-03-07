'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Customer {
  id: string;
  name: string;
  lastname: string;
  phone: string;
  email: string;
}

interface CustomerForm {
  name: string;
  lastname: string;
  phone: string;
  email: string;
}

const emptyForm: CustomerForm = { name: '', lastname: '', phone: '', email: '' };

export default function CustomersPage() {
  const { authFetch } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Delete confirm
  const [deleting, setDeleting] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const url = search ? `/api/customers?search=${encodeURIComponent(search)}` : '/api/customers';
      const res = await authFetch(url);
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      lastname: customer.lastname,
      phone: customer.phone,
      email: customer.email,
    });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/customers/${editing.id}` : '/api/customers';
      const method = editing ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchCustomers();
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
    setError('');
    try {
      const res = await authFetch(`/api/customers/${deleting.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleting(null);
        fetchCustomers();
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
        <h1 className="text-xl font-bold">Clientes</h1>
        <button
          onClick={openCreate}
          className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600"
        >
          + Nuevo Cliente
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
      ) : customers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No hay clientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{customer.name} {customer.lastname}</p>
                <p className="text-gray-600 text-sm">{customer.phone || 'Sin telefono'}</p>
                {customer.email && (
                  <p className="text-gray-500 text-sm">{customer.email}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(customer)}
                  className="text-sky-600 hover:text-sky-800 text-sm font-medium px-3 py-1 border border-sky-200 rounded-lg"
                >
                  Editar
                </button>
                <button
                  onClick={() => setDeleting(customer)}
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
              {editing ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                  placeholder="Juan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Apellido</label>
                <input
                  type="text"
                  value={form.lastname}
                  onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="Perez"
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  placeholder="juan@ejemplo.com"
                />
              </div>
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

      {/* Delete Confirmation */}
      {deleting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Eliminar Cliente</h2>
            <p className="text-gray-600 text-sm mb-4">
              ¿Estas seguro de que queres eliminar a <strong>{deleting.name} {deleting.lastname}</strong>?
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
