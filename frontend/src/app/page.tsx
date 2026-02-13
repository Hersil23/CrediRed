'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Users, Receipt, Shield, ChevronRight, Smartphone } from 'lucide-react';

const features = [
  {
    icon: ShoppingCart,
    title: 'Ventas al instante',
    description: 'Registra ventas de contado o crédito en segundos. Control total de tu inventario.'
  },
  {
    icon: Users,
    title: 'Red multinivel',
    description: 'Crea tu red de distribuidores con hasta 5 niveles jerárquicos personalizables.'
  },
  {
    icon: Receipt,
    title: 'Cobros automáticos',
    description: 'Gestiona créditos, abonos y fechas de vencimiento. Nunca pierdas un cobro.'
  },
  {
    icon: Smartphone,
    title: 'Plantillas WhatsApp',
    description: 'Notifica a tus clientes por WhatsApp con mensajes personalizados automáticos.'
  },
  {
    icon: Shield,
    title: 'Multimoneda',
    description: 'Trabaja en USD, COP o VES con tasas de cambio actualizadas en tiempo real.'
  }
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image src="/logo.svg" alt="CrediRed" width={160} height={40} priority />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-300 hover:text-white transition px-4 py-2">
              Iniciar sesión
            </Link>
            <Link href="/register" className="text-sm bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition font-medium">
              Registrarse gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="text-emerald-400 text-sm font-medium">15 días gratis — sin tarjeta de crédito</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Gestiona tus ventas,<br />
          <span className="text-emerald-400">créditos y cobros</span><br />
          en un solo lugar
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
          La plataforma para vendedores por catálogo y redes de distribución.
          Controla inventario, registra ventas a crédito, cobra a tiempo y haz crecer tu red.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-lg text-lg font-medium transition flex items-center gap-2">
            Empezar gratis <ChevronRight size={20} />
          </Link>
          <Link href="/login" className="border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-lg text-lg transition">
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Todo lo que necesitas</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Herramientas diseñadas para vendedores por catálogo, distribuidores y redes multinivel.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing hint */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple y accesible</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Prueba 15 días gratis con todas las funciones. Luego solo <span className="text-emerald-400 font-bold text-2xl">$7/mes</span> para acceso completo.
          </p>
          <Link href="/register" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium transition">
            Comenzar prueba gratuita
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-10">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.svg" alt="CrediRed" width={24} height={24} className="opacity-50" />
            <span className="text-sm text-gray-500">CrediRed © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-300 transition">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-gray-300 transition">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
