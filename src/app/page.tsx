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

export default function Home() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [filter, user]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? `/api/orders`
        : `/api/orders?statusId=${filter}`;
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
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          {user.role === 'manager' ? 'Todos los Pedidos' : 
           user.role === 'driver' ? 'Mis Entregas' : 'Mis Pedidos'}
        </h1>
        {(user.role === 'customer' || user.role === 'manager') && (
          <Link 
            href="/orders/new" 
            className="bg-sky-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-md"
          >
            + Nueva
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('1')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filter === '1' ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('2')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filter === '2' ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Asignados
        </button>
        <button
          onClick={() => setFilter('4')}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${filter === '4' ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
        >
          Completados
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.orderId}
              href={`/orders/${order.orderId}`}
              className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-sky-600">#{order.orderCode}</span>
                  <p className="text-gray-800 font-medium line-clamp-1">{order.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.statusOrder)}`}>
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
  );
}
