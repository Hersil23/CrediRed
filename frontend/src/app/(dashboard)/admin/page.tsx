'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  Users, DollarSign, Network, Shield, Search,
  MessageCircle, Eye, X, Phone, Calendar,
  ShoppingCart, UserCheck, AlertTriangle, ChevronDown
} from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'superadmin') return;
    loadDashboard();
    loadUsers();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard/admin');
      setDashboard(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/users', { params });
      setUsers(data.users);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (user?.role === 'superadmin') loadUsers(); }, [search, filterStatus]);

  const handleBlock = async (userId: string) => {
    if (!confirm('¿Bloquear este usuario?')) return;
    await api.put(`/users/${userId}/block`);
    loadUsers();
  };

  const handleUnblock = async (userId: string) => {
    await api.put(`/users/${userId}/unblock`);
    loadUsers();
  };

  const handleActivateSubscription = async (userId: string) => {
    const months = prompt('¿Cuántos meses activar?', '1');
    if (!months) return;
    await api.put(`/users/${userId}/subscription`, { months: Number(months) });
    loadUsers();
    loadDashboard();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/users/${userId}`);
      loadUsers();
      loadDashboard();
      if (selectedUser?._id === userId) setSelectedUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      setChangingRole(null);
      loadUsers();
      if (selectedUser?._id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleViewUser = async (userId: string) => {
    setLoadingStats(true);
    setSelectedUser(null);
    try {
      const { data } = await api.get(`/users/${userId}/stats`);
      setSelectedUser(data.user);
      setUserStats(data.stats);
    } catch (err) { console.error(err); }
    finally { setLoadingStats(false); }
  };

  const getExpirationDate = (u: any) => {
    if (u.status === 'active' && u.subscription?.endDate) {
      return new Date(u.subscription.endDate);
    }
    if (u.status === 'trial' && u.trialEndsAt) {
      return new Date(u.trialEndsAt);
    }
    return null;
  };

  const getExpirationLabel = (u: any) => {
    const date = getExpirationDate(u);
    if (!date) return '-';
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dateStr = date.toLocaleDateString('es');
    if (diffDays < 0) return `Venció ${dateStr}`;
    if (diffDays <= 7) return `${dateStr} (${diffDays}d)`;
    return dateStr;
  };

  const isExpiringSoon = (u: any) => {
    const date = getExpirationDate(u);
    if (!date) return false;
    const diffDays = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  // Mensaje de cobro de suscripción por WhatsApp
  const sendWhatsAppBilling = (u: any) => {
    const phone = u.phone?.replace(/\D/g, '') || '';
    if (!phone) {
      alert('Este usuario no tiene número de teléfono registrado');
      return;
    }

    let message = '';
    if (u.status === 'expired') {
      message = `Hola ${u.name}, tu suscripción en CrediRed ha vencido. Para seguir usando la plataforma, realiza el pago de tu mensualidad. Escríbenos para coordinar. Gracias.`;
    } else if (u.status === 'trial') {
      const trialEnd = u.trialEndsAt ? new Date(u.trialEndsAt).toLocaleDateString('es') : '';
      message = `Hola ${u.name}, tu período de prueba en CrediRed vence el ${trialEnd}. Para continuar usando la plataforma sin interrupciones, te invitamos a activar tu suscripción. Escríbenos para más información.`;
    } else if (u.status === 'active' && u.subscription?.endDate) {
      const subEnd = new Date(u.subscription.endDate).toLocaleDateString('es');
      message = `Hola ${u.name}, tu suscripción en CrediRed vence el ${subEnd}. Recuerda renovar a tiempo para no perder acceso. Escríbenos para coordinar el pago. Gracias.`;
    } else {
      message = `Hola ${u.name}, te contactamos desde CrediRed respecto a tu cuenta. ¿Podemos ayudarte con algo?`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (user?.role !== 'superadmin') {
    return <p className="text-gray-500">No tienes acceso a esta página.</p>;
  }

  if (loading) return <LoadingSpinner size="lg" />;

  const roleLabels: Record<string, string> = {
    empresarial: 'Empresarial',
    gerente: 'Gerente',
    lider: 'Líder',
    distribuidor: 'Distribuidor',
    emprendedor: 'Emprendedor'
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Panel de Administración</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        <button onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
          Dashboard
        </button>
        <button onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'users' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>
          Usuarios
        </button>
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && dashboard && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Total usuarios" value={dashboard.usuarios.total} icon={<Users size={24} />} color="blue" />
            <Card title="Activos" value={dashboard.usuarios.activos} icon={<Shield size={24} />} color="emerald" />
            <Card title="Trial" value={dashboard.usuarios.trial} color="amber" />
            <Card title="Ingresos mensuales" value={`$${dashboard.ingresos.estimadoMensual}`} icon={<DollarSign size={24} />} color="emerald" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card title="Expirados" value={dashboard.usuarios.expirados} color="red" />
            <Card title="Bloqueados" value={dashboard.usuarios.bloqueados} color="gray" />
            <Card title="Redes activas" value={dashboard.redes.total} icon={<Network size={24} />} color="purple" />
          </div>
          <Card title="Nuevos este mes" value={dashboard.usuarios.nuevosEsteMes} color="blue" />
        </>
      )}

      {/* Usuarios */}
      {activeTab === 'users' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Buscar por nombre, email o teléfono..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="trial">Trial</option>
              <option value="expired">Expirados</option>
              <option value="blocked">Bloqueados</option>
            </select>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-3 font-medium">Nombre</th>
                    <th className="pb-3 font-medium">Teléfono</th>
                    <th className="pb-3 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Vencimiento</th>
                    <th className="pb-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u._id} className={`border-b last:border-0 hover:bg-gray-50 ${isExpiringSoon(u) ? 'bg-amber-50/50' : ''}`}>
                      <td className="py-3">
                        <div>
                          <p className="font-medium text-gray-800">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          <span className="text-gray-600">{u.phone || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        {changingRole === u._id ? (
                          <select
                            defaultValue={u.role}
                            onChange={(e) => handleChangeRole(u._id, e.target.value)}
                            onBlur={() => setChangingRole(null)}
                            autoFocus
                            className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {Object.entries(roleLabels).map(([key, label]) => (
                              <option key={key} value={key}>{label}</option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setChangingRole(u._id)}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition"
                            title="Click para cambiar rol"
                          >
                            {roleLabels[u.role] || u.role}
                            <ChevronDown size={12} />
                          </button>
                        )}
                      </td>
                      <td className="py-3"><StatusBadge status={u.status} /></td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span className={`text-xs ${isExpiringSoon(u) ? 'text-amber-600 font-medium' : u.status === 'expired' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {getExpirationLabel(u)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleViewUser(u._id)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Ver detalle">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => sendWhatsAppBilling(u)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition"
                            title="Cobrar por WhatsApp">
                            <MessageCircle size={16} />
                          </button>
                          <button onClick={() => handleActivateSubscription(u._id)}
                            className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100">Activar</button>
                          {u.status === 'blocked' ? (
                            <button onClick={() => handleUnblock(u._id)}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Desbloquear</button>
                          ) : (
                            <button onClick={() => handleBlock(u._id)}
                              className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded hover:bg-amber-100">Bloquear</button>
                          )}
                          <button onClick={() => handleDelete(u._id)}
                            className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100">Eliminar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Modal de detalle de usuario */}
      {(selectedUser || loadingStats) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedUser(null); setUserStats(null); }}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {loadingStats ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner size="lg" />
              </div>
            ) : selectedUser && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{selectedUser.name}</h2>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                  <button onClick={() => { setSelectedUser(null); setUserStats(null); }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <X size={20} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Teléfono</p>
                      <p className="font-medium flex items-center gap-1">
                        <Phone size={14} /> {selectedUser.phone || '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Rol</p>
                      <p className="font-medium">{roleLabels[selectedUser.role] || selectedUser.role}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Estado</p>
                      <StatusBadge status={selectedUser.status} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Registrado</p>
                      <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('es')}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Vencimiento</p>
                      <p className={`font-medium ${selectedUser.status === 'expired' ? 'text-red-600' : isExpiringSoon(selectedUser) ? 'text-amber-600' : ''}`}>
                        {getExpirationLabel(selectedUser)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">Independiente</p>
                      <p className="font-medium">{selectedUser.isIndependent ? 'Sí' : 'No (en red)'}</p>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  {userStats && (
                    <>
                      <h3 className="text-sm font-semibold text-gray-700 pt-2">Estadísticas</h3>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-emerald-50 rounded-lg p-3 text-center">
                          <ShoppingCart size={18} className="mx-auto text-emerald-600 mb-1" />
                          <p className="text-lg font-bold text-emerald-700">{userStats.cantidadVentas}</p>
                          <p className="text-xs text-emerald-600">Ventas</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <UserCheck size={18} className="mx-auto text-blue-600 mb-1" />
                          <p className="text-lg font-bold text-blue-700">{userStats.totalClientes}</p>
                          <p className="text-xs text-blue-600">Clientes</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                          <Users size={18} className="mx-auto text-purple-600 mb-1" />
                          <p className="text-lg font-bold text-purple-700">{userStats.subordinados}</p>
                          <p className="text-xs text-purple-600">En su red</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="border rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Total vendido</p>
                          <p className="text-lg font-bold text-gray-800">${userStats.totalVendido.toFixed(2)}</p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <p className="text-gray-500 text-xs">Total cobrado</p>
                          <p className="text-lg font-bold text-emerald-600">${userStats.totalCobrado.toFixed(2)}</p>
                        </div>
                      </div>
                      {(userStats.ventasPendientes > 0 || userStats.ventasVencidas > 0) && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
                          <p className="text-amber-700">
                            {userStats.ventasPendientes} venta(s) pendiente(s), {userStats.ventasVencidas} vencida(s)
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Acciones rápidas */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <button onClick={() => sendWhatsAppBilling(selectedUser)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">
                      <MessageCircle size={16} /> Cobrar por WhatsApp
                    </button>
                    <button onClick={() => handleActivateSubscription(selectedUser._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition">
                      <Shield size={16} /> Activar suscripción
                    </button>
                    {selectedUser.status === 'blocked' ? (
                      <button onClick={() => { handleUnblock(selectedUser._id); setSelectedUser({ ...selectedUser, status: 'active' }); }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
                        Desbloquear
                      </button>
                    ) : (
                      <button onClick={() => { handleBlock(selectedUser._id); setSelectedUser({ ...selectedUser, status: 'blocked' }); }}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition">
                        Bloquear
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
