'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import Card from '@/components/ui/Card';

export default function ConfiguracionPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [message, setMessage] = useState('');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'perfil', label: 'Datos personales' },
    { id: 'password', label: 'Contraseña' },
    { id: 'whatsapp', label: 'Plantillas WhatsApp' },
    { id: 'subscription', label: 'Suscripción' }
  ];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/users/profile', profileForm);
      updateUser(data.user);
      setMessage('Perfil actualizado');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return alert('Las contraseñas no coinciden');
    }
    try {
      await api.put('/users/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Contraseña actualizada');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.id ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Datos personales */}
      {activeTab === 'perfil' && (
        <Card title="Datos personales">
          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="tel" value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
              <input type="email" value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <button type="submit" className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition">
              Guardar cambios
            </button>
          </form>
        </Card>
      )}

      {/* Contraseña */}
      {activeTab === 'password' && (
        <Card title="Cambiar contraseña">
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input type="password" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input type="password" value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
              <input type="password" value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <button type="submit" className="bg-emerald-500 text-white px-6 py-2 rounded-lg hover:bg-emerald-600 transition">
              Cambiar contraseña
            </button>
          </form>
        </Card>
      )}

      {/* Plantillas WhatsApp */}
      {activeTab === 'whatsapp' && (
        <Card title="Plantillas de mensajes WhatsApp">
          <p className="text-sm text-gray-500 mb-4">
            Usa las variables: {'{nombre}'}, {'{producto}'}, {'{cantidad}'}, {'{monto}'}, {'{pendiente}'}, {'{fechaLimite}'}
          </p>
          <p className="text-sm text-gray-400">
            Las plantillas se editan desde el perfil del usuario. Próximamente se habilitará la edición directa aquí.
          </p>
        </Card>
      )}

      {/* Suscripción */}
      {activeTab === 'subscription' && (
        <Card title="Suscripción">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                user?.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                user?.status === 'trial' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {user?.status === 'active' && 'Activa'}
                {user?.status === 'trial' && 'Período de prueba'}
                {user?.status === 'expired' && 'Vencida'}
              </div>
            </div>

            <div className="text-sm space-y-2">
              <p><span className="text-gray-500">Plan:</span> <span className="font-medium">$7/mes</span></p>
              {user?.status === 'trial' && user?.trialEndsAt && (
                <p><span className="text-gray-500">Trial vence:</span>{' '}
                  <span className="font-medium">{new Date(user.trialEndsAt).toLocaleDateString('es')}</span>
                </p>
              )}
              {user?.subscription?.endDate && (
                <p><span className="text-gray-500">Suscripción hasta:</span>{' '}
                  <span className="font-medium">{new Date(user.subscription.endDate).toLocaleDateString('es')}</span>
                </p>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Para renovar tu suscripción:</p>
              <p>Contacta al administrador para realizar el pago y activar tu cuenta.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
