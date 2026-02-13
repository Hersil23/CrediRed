'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { fetchRates, formatCurrency } from '@/lib/currency';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  AlertTriangle,
  ShoppingCart
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [networkData, setNetworkData] = useState<any>(null);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currency = user?.preferredCurrency || 'USD';

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, ratesRes] = await Promise.all([
          api.get('/dashboard'),
          fetchRates()
        ]);
        setData(dashRes.data);
        setRates(ratesRes);

        // Si tiene red, cargar dashboard de red
        if (!user?.isIndependent && user?.role !== 'emprendedor') {
          const netRes = await api.get('/dashboard/network');
          setNetworkData(netRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!data) return <p className="text-gray-500">Error al cargar el dashboard</p>;

  const fmt = (amountUSD: number) => formatCurrency(amountUSD, currency, rates?.[currency]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          title="Vendido este mes"
          value={fmt(data.ventas.mesActual)}
          subtitle={`${data.ventas.cantidadMesActual} ventas`}
          icon={<DollarSign size={24} />}
          color="emerald"
        />
        <Card
          title="Por cobrar"
          value={fmt(data.cobros.porCobrar)}
          subtitle={`${data.cobros.morosos} morosos`}
          icon={<TrendingUp size={24} />}
          color="amber"
        />
        <Card
          title="Cobrado este mes"
          value={fmt(data.cobros.cobradoMes)}
          icon={<DollarSign size={24} />}
          color="blue"
        />
        <Card
          title="Inventario"
          value={`${data.inventario.totalItems} uds.`}
          subtitle={fmt(data.inventario.totalValue)}
          icon={<Package size={24} />}
          color="purple"
        />
      </div>

      {/* Ventas y Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Ventas">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Activas (pendientes)</span>
              <span className="font-medium text-amber-600">{data.ventas.activas}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Saldadas</span>
              <span className="font-medium text-green-600">{data.ventas.saldadas}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Vencidas</span>
              <span className="font-medium text-red-600">{data.ventas.vencidas}</span>
            </div>
            <hr />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mes anterior</span>
              <span className="font-medium">{fmt(data.ventas.mesAnterior)}</span>
            </div>
            {data.productoTop && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Producto top</span>
                <span className="font-medium text-emerald-600">{data.productoTop}</span>
              </div>
            )}
          </div>
        </Card>

        <Card title="Clientes">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-medium">{data.clientes.total}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Morosos</span>
              <span className="font-medium text-red-600">{data.clientes.morosos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Nuevos este mes</span>
              <span className="font-medium text-emerald-600">{data.clientes.nuevos}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Dashboard de red (si aplica) */}
      {networkData && networkData.stats !== null && (
        <>
          <h2 className="text-xl font-bold text-gray-800 mt-8">Mi Red</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              title="Miembros"
              value={networkData.red.totalMiembros}
              subtitle={`${networkData.red.activos} activos`}
              icon={<Users size={24} />}
              color="blue"
            />
            <Card
              title="Ventas de la red"
              value={fmt(networkData.ventas.totalVendidoMes)}
              subtitle="Este mes"
              icon={<ShoppingCart size={24} />}
              color="emerald"
            />
            <Card
              title="Por cobrar (red)"
              value={fmt(networkData.ventas.porCobrar)}
              icon={<AlertTriangle size={24} />}
              color="red"
            />
            {networkData.topVendedor && (
              <Card
                title="Top vendedor"
                value={networkData.topVendedor.name}
                subtitle={fmt(networkData.topVendedor.total)}
                icon={<TrendingUp size={24} />}
                color="emerald"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
