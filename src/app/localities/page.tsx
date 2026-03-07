'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Department {
  id: number;
  name: string;
}

interface Locality {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
}

interface LocalityForm {
  name: string;
  departmentId: number | '';
  isActive: boolean;
}

const emptyForm: LocalityForm = { name: '', departmentId: '', isActive: true };

export default function LocalitiesPage() {
  const { authFetch } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Locality | null>(null);
  const [form, setForm] = useState<LocalityForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchLocalities();
  }, [search, filterDept]);

  async function fetchDepartments() {
    try {
      const res = await authFetch('/api/departments');
      if (res.ok) setDepartments(await res.json());
    } catch {}
  }

  async function fetchLocalities() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterDept) params.set('departmentId', filterDept);
      const url = `/api/localities${params.toString() ? '?' + params : ''}`;
      const res = await authFetch(url);
      if (res.ok) setLocalities(await res.json());
    } catch {}
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, departmentId: filterDept ? Number(filterDept) : '' });
    setError('');
    setShowModal(true);
  }

  function openEdit(loc: Locality) {
    setEditing(loc);
    setForm({ name: loc.name, departmentId: loc.departmentId, isActive: true });
    setError('');
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.departmentId) {
      setError('Nombre y departamento son requeridos');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/localities/${editing.id}` : '/api/localities';
      const method = editing ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        fetchLocalities();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Error al guardar');
      }
    } catch {
      setError('Error al guardar');
    }
    setSaving(false);
  }

  async function handleDelete(loc: Locality) {
    if (!confirm(`¿Desactivar la localidad "${loc.name}"?`)) return;
    try {
      const res = await authFetch(`/api/localities/${loc.id}`, { method: 'DELETE' });
      if (res.ok) fetchLocalities();
    } catch {}
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Localidades</h1>
        <button
          onClick={openCreate}
          className="bg-sky-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sky-600"
        >
          + Nueva Localidad
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar localidad..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
        />
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Todos los deptos.</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
        </div>
      ) : localities.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No se encontraron localidades</p>
        </div>
      ) : (
        <div className="space-y-2">
          {localities.map((loc) => (
            <div
              key={loc.id}
              className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{loc.name}</p>
                <p className="text-gray-500 text-sm">{loc.departmentName}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(loc)}
                  className="text-sky-600 hover:text-sky-800 text-sm font-medium px-3 py-1 border border-sky-200 rounded-lg"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(loc)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 border border-red-200 rounded-lg"
                >
                  Desactivar
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
              {editing ? 'Editar Localidad' : 'Nueva Localidad'}
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
                  placeholder="Pocitos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Departamento *</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value ? Number(e.target.value) : '' })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="">Seleccionar...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
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
    </div>
  );
}
