'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

interface Client {
  _id: string;
  name: string;
  cedula: string;
  phone: string;
}

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', cedula: '', phone: '' });

  const loadClients = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      const { data } = await api.get('/clients', { params });
      setClients(data.clients);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClients(); }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/clients/${editingId}`, form);
      } else {
        await api.post('/clients', form);
      }
      setForm({ name: '', cedula: '', phone: '' });
      setShowForm(false);
      setEditingId(null);
      loadClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (client: Client) => {
    setForm({ name: client.name, cedula: client.cedula, phone: client.phone });
    setEditingId(client._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await api.delete(`/clients/${id}`);
      loadClients();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', cedula: '', phone: '' }); }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition">
          <Plus size={18} /> Nuevo cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nombre, cédula o teléfono..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input type="text" placeholder="Nombre completo" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input type="text" placeholder="Cédula/Identidad" value={form.cedula}
              onChange={(e) => setForm({ ...form, cedula: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input type="tel" placeholder="Teléfono" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition">
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista */}
      <Card>
        {clients.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay clientes registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Nombre</th>
                  <th className="pb-3 font-medium">Cédula</th>
                  <th className="pb-3 font-medium">Teléfono</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="py-3 text-gray-600">{c.cedula}</td>
                    <td className="py-3 text-gray-600">{c.phone}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEdit(c)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(c._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
