'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Customer {
  CustomerId: string;
  CustomerName: string;
  CustomerLastname: string;
  CustomerPhone: string;
  CustomerEmail: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const url = search ? `/api/customers?search=${search}` : '/api/customers';
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
    setLoading(false);
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Clientes</h1>
      
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar clientes..."
        className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p>No hay clientes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <div
              key={customer.CustomerId}
              className="bg-white rounded-lg shadow-sm p-4"
            >
              <p className="font-medium">{customer.CustomerName} {customer.CustomerLastname}</p>
              <p className="text-gray-600 text-sm">{customer.CustomerPhone}</p>
              {customer.CustomerEmail && (
                <p className="text-gray-500 text-sm">{customer.CustomerEmail}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
