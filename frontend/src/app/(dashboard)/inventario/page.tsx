'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { fetchRates, formatCurrency } from '@/lib/currency';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Plus, Edit2, Trash2, Send } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  quantity: number;
  price: number;
}

export default function InventarioPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', quantity: '', price: '' });
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [assignForm, setAssignForm] = useState({ buyerId: '', quantity: '', price: '' });
  const [members, setMembers] = useState<any[]>([]);
  const currency = user?.preferredCurrency || 'USD';

  const loadProducts = async () => {
    try {
      const [prodRes, ratesRes] = await Promise.all([
        api.get('/products'),
        fetchRates()
      ]);
      setProducts(prodRes.data.products);
      setRates(ratesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const fmt = (amountUSD: number) => formatCurrency(amountUSD, currency, rates?.[currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        quantity: Number(form.quantity),
        price: Number(form.price)
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }

      setForm({ name: '', quantity: '', price: '' });
      setShowForm(false);
      setEditingId(null);
      loadProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handleEdit = (product: Product) => {
    setForm({ name: product.name, quantity: String(product.quantity), price: String(product.price) });
    setEditingId(product._id);
    setShowForm(true);
  };

  const openAssign = async (productId: string) => {
    setShowAssign(productId);
    try {
      const { data } = await api.get('/networks/members');
      // Aplanar el árbol
      const flat: any[] = [];
      const flatten = (arr: any[]) => {
        arr.forEach((m: any) => {
          flat.push(m);
          if (m.subordinates) flatten(m.subordinates);
        });
      };
      flatten(data.members);
      setMembers(flat);
    } catch { setMembers([]); }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/products/${showAssign}/assign`, {
        buyerId: assignForm.buyerId,
        quantity: Number(assignForm.quantity),
        price: Number(assignForm.price)
      });
      setShowAssign(null);
      setAssignForm({ buyerId: '', quantity: '', price: '' });
      loadProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Inventario</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', quantity: '', price: '' }); }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition"
        >
          <Plus size={18} /> Agregar producto
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <Card>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <input type="text" placeholder="Nombre del producto" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            <input type="number" placeholder="Cantidad" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="0" />
            <input type="number" placeholder="Precio (USD)" value={form.price} step="0.01"
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="0" />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition">
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Modal asignar */}
      {showAssign && (
        <Card title="Asignar mercancía">
          <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <select value={assignForm.buyerId} onChange={(e) => setAssignForm({ ...assignForm, buyerId: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
              <option value="">Seleccionar miembro</option>
              {members.map((m: any) => (
                <option key={m._id} value={m._id}>{m.name} ({m.role})</option>
              ))}
            </select>
            <input type="number" placeholder="Cantidad" value={assignForm.quantity}
              onChange={(e) => setAssignForm({ ...assignForm, quantity: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="1" />
            <input type="number" placeholder="Precio (USD)" value={assignForm.price} step="0.01"
              onChange={(e) => setAssignForm({ ...assignForm, price: e.target.value })}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="0" />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition">Asignar</button>
              <button type="button" onClick={() => setShowAssign(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabla de productos */}
      <Card>
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tienes productos en inventario</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Cantidad</th>
                  <th className="pb-3 font-medium">Precio</th>
                  <th className="pb-3 font-medium">Valor total</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="py-3">
                      <span className={p.quantity === 0 ? 'text-red-600 font-medium' : ''}>
                        {p.quantity}
                      </span>
                    </td>
                    <td className="py-3">{fmt(p.price)}</td>
                    <td className="py-3">{fmt(p.price * p.quantity)}</td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!user?.isIndependent && (
                          <button onClick={() => openAssign(p._id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Asignar">
                            <Send size={16} />
                          </button>
                        )}
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
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
