'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import SupabaseProtectedRoute from '@/components/SupabaseProtectedRoute';
import PerfilAdministrativa from '@/components/admin/PerfilAdministrativa';
import EstadisticasAdmin from '@/components/admin/EstadisticasAdmin';
import AccesosRapidos from '@/components/admin/AccesosRapidos';

export default function AdminDashboard() {
  const { user, loading, signOut } = useSupabaseAuth();
  const [vistaActiva, setVistaActiva] = useState<'dashboard' | 'perfil'>('dashboard');

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SupabaseProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        {/* Header del Dashboard */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Bienvenida, {user ? `${user.user_metadata?.nombre || ''} ${user.user_metadata?.apellido || ''}`.trim() || user.email : ''}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Rol actual</p>
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  👑 Administradora
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Navegación del Dashboard */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setVistaActiva('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  vistaActiva === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setVistaActiva('perfil')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  vistaActiva === 'perfil'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👤 Mi Perfil
              </button>
            </nav>
          </div>

          {/* Contenido del Dashboard */}
          <div className="p-6">
            {vistaActiva === 'dashboard' && (
              <div className="space-y-6">
                <EstadisticasAdmin />
                <AccesosRapidos />
              </div>
            )}
            
            {vistaActiva === 'perfil' && (
              <PerfilAdministrativa />
            )}
          </div>
        </div>

      </div>
    </SupabaseProtectedRoute>
  );
}
