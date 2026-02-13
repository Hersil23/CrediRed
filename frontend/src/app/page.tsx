'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart, Users, Receipt, Shield, ChevronRight, Smartphone,
  Monitor, TabletSmartphone, Globe, Star, CheckCircle, TrendingUp,
  Clock, BarChart3
} from 'lucide-react';

const features = [
  {
    icon: ShoppingCart,
    title: 'Ventas al instante',
    description: 'Registra ventas de contado o credito en segundos. Control total de tu inventario.'
  },
  {
    icon: Users,
    title: 'Red multinivel',
    description: 'Organiza tu red en niveles: Empresarial, Gerente, Lider, Distribuidor y Emprendedor. Personaliza los nombres segun tu empresa.'
  },
  {
    icon: Receipt,
    title: 'Cobros automaticos',
    description: 'Gestiona creditos, abonos y fechas de vencimiento. Nunca pierdas un cobro.'
  },
  {
    icon: Smartphone,
    title: 'Plantillas WhatsApp',
    description: 'Notifica a tus clientes por WhatsApp con mensajes personalizados automaticos.'
  },
  {
    icon: Shield,
    title: 'Multimoneda',
    description: 'Trabaja en USD, COP o VES con tasas de cambio actualizadas en tiempo real.'
  },
  {
    icon: TrendingUp,
    title: 'Dashboard inteligente',
    description: 'Visualiza tus ventas, cobros, morosos y rendimiento de tu red en tiempo real.'
  }
];

const whyChoose = [
  {
    icon: Monitor,
    title: 'Desde cualquier dispositivo',
    description: 'Accede desde tu celular, tablet o computadora. Solo necesitas un navegador web.'
  },
  {
    icon: Globe,
    title: 'Disponible 24/7',
    description: 'Tu informacion siempre disponible, en cualquier momento y desde cualquier lugar.'
  },
  {
    icon: Clock,
    title: 'Sin instalaciones',
    description: 'No necesitas descargar ni instalar nada. Entra a credired.app y listo.'
  },
  {
    icon: BarChart3,
    title: 'Reportes en tiempo real',
    description: 'Mira cuanto vendiste, cuanto te deben y quien es tu mejor vendedor al instante.'
  }
];

const testimonials = [
  {
    name: 'Maria Gonzalez',
    role: 'Distribuidora independiente',
    text: 'Antes anotaba todo en un cuaderno y perdia el control de mis cobros. Con CrediRed tengo todo organizado y mis clientes reciben recordatorios automaticos. Mis ventas crecieron un 40%.',
    stars: 5
  },
  {
    name: 'Carlos Ramirez',
    role: 'Lider de red - Tendencias',
    text: 'Manejo una red de 25 distribuidores y CrediRed me permite ver las ventas de cada uno en tiempo real. El dashboard de red es increible para tomar decisiones.',
    stars: 5
  },
  {
    name: 'Ana Martinez',
    role: 'Empresarial - Cosmeticos',
    text: 'Migre toda mi operacion a CrediRed y fue la mejor decision. El control de inventario, los creditos y los cobros en un solo lugar. Lo recomiendo al 100%.',
    stars: 5
  }
];

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [whatsappVisible, setWhatsappVisible] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const timer = setTimeout(() => setWhatsappVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <nav className="border-b border-gray-800 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Image src="/logo.svg" alt="CrediRed" width={160} height={40} priority />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-300 hover:text-white transition px-4 py-2">
              Iniciar sesion
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
          <span className="text-emerald-400 text-sm font-medium">15 dias gratis — sin tarjeta de credito</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Controla tus ventas y cobros<br />
          <span className="text-emerald-400">como un profesional</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
          Ideal para emprendedores, vendedores independientes y redes de distribucion
          como Tendencias, Avon o tu propia empresa.
          Controla tu inventario, registra ventas a credito, cobra a tiempo y haz crecer tu red.
        </p>
        <p className="text-base text-gray-500 max-w-xl mx-auto mb-10">
          Tanto si vendes solo como si manejas una red, CrediRed se adapta a ti.
          Nombra tu empresa, personaliza niveles y gestiona todo desde un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
        <h2 className="text-3xl font-bold text-center mb-4">Todo lo que necesitas para vender y cobrar</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Herramientas disenadas para vendedores, distribuidores y redes multinivel.
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

      {/* Por que elegir CrediRed */}
      <section className="py-20 bg-gray-800/30">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Por que elegir CrediRed.app</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Accede desde cualquier dispositivo, sin descargas ni complicaciones.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {whyChoose.map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <item.icon size={28} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-gray-400">
              <TabletSmartphone size={20} className="text-emerald-400" />
              <span className="text-sm">Celular</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Monitor size={20} className="text-emerald-400" />
              <span className="text-sm">Computadora</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <Globe size={20} className="text-emerald-400" />
              <span className="text-sm">Cualquier navegador</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Lo que dicen nuestros usuarios</h2>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Personas reales que transformaron su forma de vender y cobrar.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Simple y accesible</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Prueba 15 dias gratis con todas las funciones. Para activar tu suscripcion, contacta a tu distribuidor autorizado.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle size={16} className="text-emerald-400" /> 15 dias gratis
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle size={16} className="text-emerald-400" /> Sin tarjeta de credito
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <CheckCircle size={16} className="text-emerald-400" /> Soporte incluido
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium transition">
              Comenzar prueba gratuita
            </Link>
            <a
              href="https://wa.me/584145116337?text=Hola%2C%20quiero%20activar%20mi%20suscripcion%20en%20CrediRed"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border border-green-500 text-green-400 hover:bg-green-500/10 px-8 py-3 rounded-lg font-medium transition"
            >
              Contactar distribuidor
            </a>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Listo para transformar el cobro de tus ventas y llevar el control de forma profesional
        </h2>
        <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
          Deja de perder ventas, clientes y dinero. Empieza hoy con CrediRed y lleva tu negocio al siguiente nivel.
        </p>
        <Link href="/register" className="bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 rounded-lg text-lg font-medium transition inline-flex items-center gap-2">
          Crear mi cuenta gratis <ChevronRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.svg" alt="CrediRed" width={24} height={24} className="opacity-50" />
            <span className="text-sm text-gray-500">CrediRed {new Date().getFullYear()}</span>
          </div>
          <div className="text-sm text-gray-500">
            Creado por{' '}
            <a
              href="https://www.herasi.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 transition font-medium"
            >
              @herasi.dev
            </a>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-300 transition">Iniciar sesion</Link>
            <Link href="/register" className="hover:text-gray-300 transition">Registrarse</Link>
          </div>
        </div>
      </footer>

      {/* Boton WhatsApp flotante */}
      <a
        href="https://wa.me/584145116337?text=Hola%2C%20quiero%20informacion%20sobre%20CrediRed"
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-500 hover:scale-110 ${
          whatsappVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
        title="Contactanos por WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        {/* Pulso de animacion */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></span>
      </a>
    </div>
  );
}
