'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-600 text-2xl">✓</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Correo enviado</h2>
        <p className="text-gray-500 text-sm mb-6">
          Revisa tu bandeja de entrada. Te enviamos un enlace para restablecer tu contraseña.
        </p>
        <Link href="/login" className="text-emerald-600 font-medium text-sm hover:text-emerald-700">
          Volver al login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Recuperar contraseña</h2>
      <p className="text-center text-sm text-gray-500 mb-6">
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-emerald-500 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50">
          {loading ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-emerald-600 font-medium">Volver al login</Link>
      </p>
    </div>
  );
}
