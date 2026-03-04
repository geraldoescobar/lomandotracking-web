'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Order {
  OrderId: number;
  OrderCode: string;
  OrderDescription: string;
  OrderCreatedAt: string;
  OrderCurrentStatusId: number;
  OrderStatusName: string;
  OrderStatusOrder: number;
  CustomerName: string;
  CustomerLastname: string;
  CustomerPhone: string;
}

export default function Home() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  async function fetchOrders() {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/orders' : `/api/orders?statusId=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  }

  function getStatusColor(statusOrder: number) {
    if (statusOrder <= 1) return 'bg-yellow-100 text-yellow-800';
    if (statusOrder <= 3) return 'bg-blue-100 text-blue-800';
    if (statusOrder <= 5) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('1')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filter === '1' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('2')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filter === '2' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          En Curso
        </button>
        <button
          onClick={() => setFilter('6')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${filter === '6' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Entregados
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No hay pedidos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.OrderId}
              href={`/orders/${order.OrderId}`}
              className="block bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-bold text-indigo-600">#{order.OrderCode}</span>
                  <p className="text-gray-800 font-medium line-clamp-1">{order.OrderDescription}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.OrderStatusOrder)}`}>
                  {order.OrderStatusName}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{order.CustomerName} {order.CustomerLastname}</span>
                <span>{formatDate(order.OrderCreatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
