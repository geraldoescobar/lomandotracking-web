'use client';

import { useState, useEffect, useMemo } from 'react';
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

export default function Home() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await authFetch('/api/orders');
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
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.statusOrder <= 1).length;
    const inProgress = orders.filter((o) => o.statusOrder === 2 || o.statusOrder === 3).length;
    const completed = orders.filter((o) => o.statusOrder >= 4).length;
    return { total, pending, inProgress, completed };
  }, [orders]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [orders]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="p-4 space-y-6 pb-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {user.name}
        </h1>
        <p className="text-gray-500 mt-1">
          Gestiona tus envios y consulta el estado de tus paquetes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{loading ? '-' : stats.total}</p>
              <p className="text-xs text-gray-500">Total de Envios</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{loading ? '-' : stats.pending}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{loading ? '-' : stats.inProgress}</p>
              <p className="text-xs text-gray-500">En Curso</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{loading ? '-' : stats.completed}</p>
              <p className="text-xs text-gray-500">Finalizados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(user.role === 'customer' || user.role === 'manager') && (
          <Link
            href="/orders/new"
            className="block rounded-xl p-5 bg-gradient-to-r from-sky-500 to-purple-500 text-white shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-lg">Crear Nuevo Envio</p>
                <p className="text-white/80 text-sm">Registra un nuevo paquete para enviar</p>
              </div>
            </div>
          </Link>
        )}

        <Link
          href="/orders"
          className="block rounded-xl p-5 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-lg text-gray-800">Ver Mis Envios</p>
              <p className="text-gray-500 text-sm">Consulta todos tus envios y su estado</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">Envios Recientes</h2>
          {orders.length > 5 && (
            <Link href="/orders" className="text-sky-500 text-sm font-medium hover:underline">
              Ver todos
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No hay envios</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.orderId}
                href={`/orders/${order.orderId}`}
                className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-bold text-sky-600 font-mono">#{order.orderCode}</span>
                    <p className="text-gray-800 font-medium line-clamp-1">{order.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.statusOrder)}`}>
                    {order.statusName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{order.customerName} {order.customerLastname}</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
