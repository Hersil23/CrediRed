'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchRates } from '@/lib/currency';
import api from '@/lib/api';
import {
  Bell,
  Copy,
  Check,
  ChevronDown,
  LogOut,
  Settings,
  User,
  MessageCircle
} from 'lucide-react';

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  empresarial: 'Empresarial',
  gerente: 'Gerente',
  lider: 'Líder',
  distribuidor: 'Distribuidor',
  emprendedor: 'Emprendedor'
};

const currencies = ['USD', 'COP', 'VES'];

export default function Navbar() {
  const { user, logout, updateUser } = useAuth();
  const [currentTime, setCurrentTime] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(user?.preferredCurrency || 'USD');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString('es', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }));
    }, 1000);
    setCurrentTime(new Date().toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' }));
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const { data } = await api.get('/notifications/unread-count');
        setUnreadCount(data.count);
      } catch { /* silenciar */ }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCurrencyChange = async (currency: string) => {
    setSelectedCurrency(currency);
    try {
      await api.put('/users/profile', { preferredCurrency: currency });
      updateUser({ preferredCurrency: currency });
    } catch { /* silenciar */ }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/unirse/${user?.inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const link = `${window.location.origin}/unirse/${user?.inviteCode}`;
    const text = `¡Únete a CrediRed! Gestiona tus ventas y créditos fácilmente. Regístrate aquí: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* Saludo y hora */}
      <div className="hidden md:block">
        <p className="text-sm font-medium text-gray-800">
          Bienvenido, <span className="text-emerald-600">{user?.name}</span>
          <span className="text-xs text-gray-500 ml-2">({roleLabels[user?.role || '']})</span>
        </p>
        <p className="text-xs text-gray-500">{currentTime}</p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Selector de moneda */}
        <select
          value={selectedCurrency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {currencies.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Botón invitar */}
        {user?.role !== 'superadmin' && (
          <div className="flex items-center gap-1">
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-1 text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition"
              title="Copiar enlace de invitación"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Invitar'}</span>
            </button>
            <button
              onClick={shareWhatsApp}
              className="flex items-center text-sm bg-green-50 text-green-700 p-1.5 rounded-lg hover:bg-green-100 transition"
              title="Compartir por WhatsApp"
            >
              <MessageCircle size={16} />
            </button>
          </div>
        )}

        {/* Notificaciones */}
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Perfil */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={16} className="text-gray-500" />
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-20 py-1">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{roleLabels[user?.role || '']}</p>
                </div>
                <a href="/configuracion" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Settings size={16} /> Configuración
                </a>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <LogOut size={16} /> Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
