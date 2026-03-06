'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// --- Icon components ---
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// --- Nav link definitions per role ---
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case 'manager':
      return [
        { href: '/', label: 'Inicio', icon: HomeIcon },
        { href: '/orders', label: 'Mis Envios', icon: PackageIcon },
        { href: '/customers', label: 'Clientes', icon: UsersIcon },
        { href: '/scan', label: 'Escanear', icon: ScanIcon },
      ];
    case 'driver':
      return [
        { href: '/', label: 'Inicio', icon: HomeIcon },
        { href: '/scan', label: 'Escanear', icon: ScanIcon },
      ];
    case 'customer':
      return [
        { href: '/', label: 'Inicio', icon: HomeIcon },
        { href: '/orders/new', label: 'Nuevo Envio', icon: PlusIcon },
        { href: '/orders', label: 'Mis Envios', icon: PackageIcon },
        { href: '/addresses', label: 'Mis Domicilios', icon: MapPinIcon },
        { href: '/profile', label: 'Mi Perfil', icon: UserIcon },
      ];
    default:
      return [
        { href: '/', label: 'Inicio', icon: HomeIcon },
      ];
  }
}

// Mobile bottom nav only shows a subset of items
function getMobileNavItems(role: string): NavItem[] {
  switch (role) {
    case 'manager':
      return [
        { href: '/', label: 'Inicio', icon: HomeIcon },
        { href: '/scan', label: 'Escanear', icon: ScanIcon },
        { href: '/customers', label: 'Clientes', icon: UsersIcon },
      ];
    case 'driver':
      return [
        { href: '/', label: 'Inicio', icon: HomeIcon },
        { href: '/scan', label: 'Escanear', icon: ScanIcon },
      ];
    case 'customer':
      return [
        { href: '/', label: 'Inicio', icon: HomeIcon },
        { href: '/scan', label: 'Escanear', icon: ScanIcon },
        { href: '/orders', label: 'Mis Envios', icon: PackageIcon },
      ];
    default:
      return [
        { href: '/', label: 'Inicio', icon: HomeIcon },
      ];
  }
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

export default function NavBar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (loading) {
    return null;
  }

  // --- Not logged in ---
  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sky-500 to-sky-400 text-white p-3 z-50 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/track" className="text-lg font-bold tracking-tight">
            Lomando
          </Link>
          <Link href="/login" className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors">
            Ingresar
          </Link>
        </div>
      </nav>
    );
  }

  // --- Logged in ---
  function handleLogout() {
    logout();
    router.push('/login');
  }

  const desktopItems = getNavItems(user.role);
  const mobileItems = getMobileNavItems(user.role);

  return (
    <>
      {/* Top bar */}
      <nav className="fixed top-0 left-0 right-0 bg-gradient-to-r from-sky-500 to-sky-400 text-white p-3 z-50 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          {/* Left: Logo */}
          <Link href="/" className="text-lg font-bold tracking-tight">
            Lomando
          </Link>

          {/* Center: Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {desktopItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-white/25 font-semibold'
                      : 'hover:bg-white/15'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: User info + logout */}
          <div className="flex gap-2 items-center">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{user.name}</span>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full capitalize">{user.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Bottom nav: mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-sky-100 pb-safe z-50 md:hidden">
        <div className="max-w-5xl mx-auto flex justify-around p-2">
          {mobileItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center p-2 ${
                  active ? 'text-sky-500' : 'text-gray-500'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
