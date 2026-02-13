'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <main className="p-4 md:p-6">
          {/* Banner de suscripción vencida */}
          {user.status === 'expired' && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-red-800 font-medium">Tu suscripción ha vencido</p>
                <p className="text-red-600 text-sm">Contacta al administrador para renovar tu acceso.</p>
              </div>
            </div>
          )}
          {/* Banner de trial */}
          {user.status === 'trial' && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800 font-medium">Período de prueba</p>
              <p className="text-amber-600 text-sm">
                Tienes acceso limitado: máx. 6 clientes y 3 invitaciones.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
