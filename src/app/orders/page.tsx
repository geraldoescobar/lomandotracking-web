'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Order {
  orderId: number;
  orderCode: string;
  description: string;
  statusName: string;
  statusOrder: number;
  statusId: number;
  created_at: string;
  customerName: string;
  customerLastname: string;
}

export default function OrdersPage() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [filter, user]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const url = filter === 'all' ? `/api/orders` : `/api/orders?statusId=${filter}`;
      const res = await authFetch(url);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  }

  function getStatusColor(statusOrder: number) {
    if (statusOrder <= 1) return 'bg-yellow-100 text-yellow-800';
    if (statusOrder <= 2) return 'bg-sky-100 text-sky-800';
    if (statusOrder <= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  const filteredOrders = search
    ? orders.filter(o => o.orderCode.toLowerCase().includes(search.toLowerCase()) || o.description?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  if (authLoading || !user) return null;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {user.role === 'manager' ? 'Todos los Envíos' : user.role === 'driver' ? 'Mis Entregas' : 'Mis Envíos'}
          </h1>
          <p className="text-gray-500 text-sm">Gestiona y consulta tus envíos</p>
        </div>
        {(user.role === 'customer' || user.role === 'manager') && (
          <Link
            href="/orders/new"
            className="bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-md hover:bg-sky-600"
          >
            + Nuevo Envio
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por codigo..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Todos los estados</option>
            <option value="1">Pendientes</option>
            <option value="2">Asignados</option>
            <option value="3">En Curso</option>
            <option value="4">Completados</option>
            <option value="5">Cancelados</option>
          </select>
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-3">Mostrando {filteredOrders.length} de {orders.length} envíos</p>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No hay envíos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.orderId}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-gray-800 font-mono">{order.orderCode}</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.statusOrder)}`}>
                    {order.statusName}
                  </span>
                </div>
                <Link
                  href={`/orders/${order.orderId}`}
                  className="text-sm text-sky-600 font-medium border border-sky-200 px-3 py-1 rounded-lg hover:bg-sky-50"
                >
                  Ver Detalle
                </Link>
              </div>
              {order.description && (
                <p className="text-gray-600 text-sm line-clamp-1 mb-1">{order.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{order.customerName} {order.customerLastname}</span>
                <span>Creado el {formatDate(order.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
