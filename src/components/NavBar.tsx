'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function NavBar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sky-500 to-sky-400 text-white p-3 z-50 shadow-md">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <Link href="/track" className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image 
                src="/logo_3.png" 
                alt="Lomando" 
                fill
                className="object-contain"
              />
            </div>
          </Link>
          <Link href="/login" className="text-sm bg-white/20 px-3 py-1 rounded-full">Ingresar</Link>
        </div>
      </nav>
    );
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sky-500 to-sky-400 text-white p-3 z-50 shadow-md">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 relative">
              <Image 
                src="/logo_3.png" 
                alt="Lomando" 
                fill
                className="object-contain"
              />
            </div>
          </Link>
          <div className="flex gap-2 items-center">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full capitalize">{user.role}</span>
            <button onClick={handleLogout} className="text-sm bg-white/20 px-2 py-1 rounded-full">Salir</button>
          </div>
        </div>
      </nav>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-sky-100 pb-safe z-50">
        <div className="max-w-md mx-auto flex justify-around p-2">
          <Link 
            href="/" 
            className={`flex flex-col items-center p-2 ${pathname === '/' ? 'text-sky-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <span className="text-xs mt-1">Pedidos</span>
          </Link>
          
          {user.role === 'manager' && (
            <Link 
              href="/customers" 
              className={`flex flex-col items-center p-2 ${pathname === '/customers' ? 'text-sky-500' : 'text-gray-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs mt-1">Clientes</span>
            </Link>
          )}
          
          <Link 
            href="/scan" 
            className={`flex flex-col items-center p-2 ${pathname === '/scan' ? 'text-sky-500' : 'text-gray-500'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span className="text-xs mt-1">Escanear</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
