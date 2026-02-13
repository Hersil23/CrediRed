'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Users, DollarSign, Network, Shield, Search } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

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
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  if (user?.role !== 'superadmin') {
    return <p className="text-gray-500">No tienes acceso a esta página.</p>;
  }

  if (loading) return <LoadingSpinner size="lg" />;

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
              <input type="text" placeholder="Buscar usuarios..." value={search}
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
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Rol</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Registro</th>
                    <th className="pb-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-3 font-medium">{u.name}</td>
                      <td className="py-3 text-gray-500">{u.email}</td>
                      <td className="py-3">{u.role}</td>
                      <td className="py-3"><StatusBadge status={u.status} /></td>
                      <td className="py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('es')}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
