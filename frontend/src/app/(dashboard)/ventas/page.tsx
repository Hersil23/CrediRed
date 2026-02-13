'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { fetchRates, formatCurrency } from '@/lib/currency';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Plus, MessageCircle } from 'lucide-react';

export default function VentasPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const currency = user?.preferredCurrency || 'USD';

  const [form, setForm] = useState({
    type: 'detal',
    paymentType: 'contado',
    clientId: '',
    buyerId: '',
    productId: '',
    quantity: '1',
    unitPrice: '',
    creditUnit: 'quincena',
    creditQuantity: '1'
  });

  const loadData = async () => {
    try {
      const params: any = {};
      if (filter.type) params.type = filter.type;
      if (filter.status) params.status = filter.status;

      const [salesRes, ratesRes] = await Promise.all([
        api.get('/sales', { params }),
        fetchRates()
      ]);
      setSales(salesRes.data.sales);
      setRates(ratesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async () => {
    try {
      const [clientsRes, productsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/products')
      ]);
      setClients(clientsRes.data.clients);
      setProducts(productsRes.data.products);

      if (!user?.isIndependent) {
        try {
          const { data } = await api.get('/networks/members');
          const flat: any[] = [];
          const flatten = (arr: any[]) => arr.forEach((m: any) => { flat.push(m); if (m.subordinates) flatten(m.subordinates); });
          flatten(data.members);
          setMembers(flat);
        } catch { /* no hay red */ }
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [filter]);

  const fmt = (amountUSD: number) => formatCurrency(amountUSD, currency, rates?.[currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/sales', {
        type: form.type,
        paymentType: form.paymentType,
        clientId: form.type === 'detal' ? form.clientId : undefined,
        buyerId: form.type === 'red' ? form.buyerId : undefined,
        items: [{
          productId: form.productId,
          quantity: Number(form.quantity),
          unitPrice: Number(form.unitPrice)
        }],
        currency,
        creditTerm: form.paymentType === 'credito' ? {
          unit: form.creditUnit,
          quantity: Number(form.creditQuantity)
        } : undefined
      });
      setShowForm(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar venta');
    }
  };

  const sendWhatsApp = (sale: any) => {
    const phone = sale.client?.phone || '';
    const name = sale.client?.name || sale.buyer?.name || '';
    const itemsText = sale.items.map((i: any) => `${i.productName} x${i.quantity}`).join(', ');
    const total = fmt(sale.totalAmount);

    let message = '';
    if (sale.paymentType === 'contado') {
      message = `Hola ${name}, gracias por tu compra en CrediRed. Detalle: ${itemsText} - ${total}. Pago: Contado. Gracias por tu preferencia.`;
    } else {
      const pending = fmt(sale.totalAmount - sale.paidAmount);
      const due = sale.creditTerm?.dueDate ? new Date(sale.creditTerm.dueDate).toLocaleDateString('es') : '';
      message = `Hola ${name}, gracias por tu compra. Detalle: ${itemsText} - ${total}. Plazo: ${due}. Saldo pendiente: ${pending}.`;
    }

    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
        <button onClick={() => { setShowForm(true); loadFormData(); }}
          className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition">
          <Plus size={18} /> Nueva venta
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos los tipos</option>
          <option value="detal">Detal</option>
          <option value="red">Red</option>
        </select>
        <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="saldado">Saldado</option>
          <option value="vencido">Vencido</option>
        </select>
      </div>

      {/* Formulario nueva venta */}
      {showForm && (
        <Card title="Registrar venta">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="detal">Cliente (Detal)</option>
                  <option value="red">Red (Revendedor)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pago</label>
                <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="contado">Contado</option>
                  <option value="credito">Crédito/Fiado</option>
                </select>
              </div>
            </div>

            {form.type === 'detal' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                  <option value="">Seleccionar cliente</option>
                  {clients.map((c: any) => <option key={c._id} value={c._id}>{c.name} - {c.cedula}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Miembro de red</label>
                <select value={form.buyerId} onChange={(e) => setForm({ ...form, buyerId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                  <option value="">Seleccionar miembro</option>
                  {members.map((m: any) => <option key={m._id} value={m._id}>{m.name} ({m.role})</option>)}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select value={form.productId} onChange={(e) => {
                  const p = products.find((pr: any) => pr._id === e.target.value);
                  setForm({ ...form, productId: e.target.value, unitPrice: p ? String(p.price) : '' });
                }}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                  <option value="">Seleccionar</option>
                  {products.map((p: any) => <option key={p._id} value={p._id}>{p.name} (Stock: {p.quantity})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio unitario ({currency})</label>
                <input type="number" value={form.unitPrice} step="0.01" onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required min="0" />
              </div>
            </div>

            {form.paymentType === 'credito' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plazo</label>
                  <select value={form.creditUnit} onChange={(e) => setForm({ ...form, creditUnit: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="quincena">Quincenas</option>
                    <option value="semana">Semanas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input type="number" value={form.creditQuantity} onChange={(e) => setForm({ ...form, creditQuantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" min="1" />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition">
                Registrar venta
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de ventas */}
      <Card>
        {sales.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay ventas registradas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Cliente/Miembro</th>
                  <th className="pb-3 font-medium">Productos</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Tipo</th>
                  <th className="pb-3 font-medium">Pago</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s: any) => (
                  <tr key={s._id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 text-gray-500">{new Date(s.createdAt).toLocaleDateString('es')}</td>
                    <td className="py-3 font-medium">{s.client?.name || s.buyer?.name || '-'}</td>
                    <td className="py-3">{s.items.map((i: any) => `${i.productName} x${i.quantity}`).join(', ')}</td>
                    <td className="py-3 font-medium">{fmt(s.totalAmount)}</td>
                    <td className="py-3"><StatusBadge status={s.type} /></td>
                    <td className="py-3"><StatusBadge status={s.paymentType} /></td>
                    <td className="py-3"><StatusBadge status={s.status} /></td>
                    <td className="py-3 text-right">
                      <button onClick={() => sendWhatsApp(s)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="WhatsApp">
                        <MessageCircle size={16} />
                      </button>
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
