'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { fetchRates, formatCurrency } from '@/lib/currency';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { DollarSign, MessageCircle } from 'lucide-react';

export default function CobrosPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const currency = user?.preferredCurrency || 'USD';

  const loadData = async () => {
    try {
      const [collectionsRes, ratesRes] = await Promise.all([
        api.get('/sales/collections'),
        fetchRates()
      ]);
      setSales(collectionsRes.data.sales);
      setSummary(collectionsRes.data.summary);
      setRates(ratesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const fmt = (amountUSD: number) => formatCurrency(amountUSD, currency, rates?.[currency]);

  const handlePayment = async (saleId: string) => {
    try {
      await api.post('/payments', {
        saleId,
        amount: Number(paymentAmount),
        currency
      });
      setPayingId(null);
      setPaymentAmount('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const sendReminder = (sale: any) => {
    const phone = sale.client?.phone || '';
    const name = sale.client?.name || sale.buyer?.name || '';
    const pending = fmt(sale.totalAmount - sale.paidAmount);
    const due = sale.creditTerm?.dueDate ? new Date(sale.creditTerm.dueDate).toLocaleDateString('es') : '';

    const message = sale.status === 'vencido'
      ? `Hola ${name}, tu deuda de ${pending} venció el ${due}. Por favor comunícate para coordinar el pago. Gracias.`
      : `Hola ${name}, te recordamos que tienes un saldo pendiente de ${pending} con vencimiento el ${due}. Agradecemos tu pronto pago.`;

    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Cobros</h1>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card title="Total por cobrar" value={fmt(summary.totalPorCobrar)} icon={<DollarSign size={24} />} color="amber" />
          <Card title="Pendientes" value={summary.pendientes} color="blue" />
          <Card title="Vencidas" value={summary.vencidas} color="red" />
        </div>
      )}

      <Card>
        {sales.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tienes cobros pendientes</p>
        ) : (
          <div className="space-y-4">
            {sales.map((s: any) => {
              const remaining = s.totalAmount - s.paidAmount;
              const dueDate = s.creditTerm?.dueDate ? new Date(s.creditTerm.dueDate) : null;
              const isOverdue = dueDate && dueDate < new Date();

              return (
                <div key={s._id} className={`border rounded-lg p-4 ${isOverdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-800">{s.client?.name || s.buyer?.name}</p>
                      <p className="text-xs text-gray-500">
                        {s.items.map((i: any) => `${i.productName} x${i.quantity}`).join(', ')}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-medium">{fmt(s.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Abonado</p>
                      <p className="font-medium text-green-600">{fmt(s.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pendiente</p>
                      <p className="font-bold text-red-600">{fmt(remaining)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Vence</p>
                      <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                        {dueDate?.toLocaleDateString('es') || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((s.paidAmount / s.totalAmount) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {payingId === s._id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input type="number" placeholder={`Monto (${currency})`} value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)} step="0.01" min="0"
                          className="flex-1 px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        <button onClick={() => handlePayment(s._id)}
                          className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-emerald-600">Registrar</button>
                        <button onClick={() => setPayingId(null)} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => setPayingId(s._id)}
                          className="bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-emerald-600 transition">
                          Registrar abono
                        </button>
                        <button onClick={() => sendReminder(s)}
                          className="flex items-center gap-1 text-green-600 px-3 py-1.5 rounded-lg text-sm hover:bg-green-50 transition">
                          <MessageCircle size={16} /> WhatsApp
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
