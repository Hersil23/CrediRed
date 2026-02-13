'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Network,
  Receipt,
  Settings,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: 'all' },
  { href: '/inventario', label: 'Inventario', icon: Package, roles: 'all' },
  { href: '/ventas', label: 'Ventas', icon: ShoppingCart, roles: 'all' },
  { href: '/clientes', label: 'Clientes', icon: Users, roles: 'all' },
  { href: '/mi-red', label: 'Mi Red', icon: Network, roles: 'network' },
  { href: '/cobros', label: 'Cobros', icon: Receipt, roles: 'all' },
  { href: '/configuracion', label: 'Configuración', icon: Settings, roles: 'all' },
  { href: '/admin', label: 'Admin', icon: Shield, roles: 'superadmin' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredItems = menuItems.filter(item => {
    if (item.roles === 'all') return user?.role !== 'superadmin' || item.href === '/dashboard';
    if (item.roles === 'superadmin') return user?.role === 'superadmin';
    if (item.roles === 'network') {
      // Mostrar "Mi Red" solo si tiene gente abajo (no es independiente o tiene rol de supervisor)
      const supervisorRoles = ['empresarial', 'gerente', 'lider', 'distribuidor'];
      return supervisorRoles.includes(user?.role || '') && !user?.isIndependent;
    }
    return true;
  });

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo arriba */}
      <div className="px-4 py-4 border-b border-gray-700">
        <Link href="/dashboard">
          <Image src="/logo.svg" alt="CrediRed" width={160} height={40} priority />
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Status de suscripción */}
      {user && user.role !== 'superadmin' && (
        <div className="p-4 border-t border-gray-700">
          <div className={`text-xs px-3 py-2 rounded-lg ${
            user.status === 'active' ? 'bg-emerald-900/50 text-emerald-300' :
            user.status === 'trial' ? 'bg-amber-900/50 text-amber-300' :
            'bg-red-900/50 text-red-300'
          }`}>
            {user.status === 'active' && 'Suscripción activa'}
            {user.status === 'trial' && 'Período de prueba'}
            {user.status === 'expired' && 'Suscripción vencida'}
          </div>
        </div>
      )}

      {/* Logo abajo */}
      <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-center">
        <Image src="/logo-icon.svg" alt="CrediRed" width={28} height={28} className="opacity-40" />
        <span className="ml-2 text-xs text-gray-500">CrediRed v1.0</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Botón móvil */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-gray-800 text-white rounded-lg"
      >
        <Menu size={20} />
      </button>

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-gray-900">
        {navContent}
      </aside>

      {/* Sidebar móvil */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 z-50 lg:hidden">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
