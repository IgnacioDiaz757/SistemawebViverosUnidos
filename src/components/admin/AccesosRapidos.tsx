'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useEmpleados } from '@/context/EmpleadosContext';
import { migrarDatosASupabase, verificarMigracion } from '@/scripts/migrarASupabase';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AccesosRapidos() {
  const { state } = useEmpleados();
  const [mostrarModalRapido, setMostrarModalRapido] = useState(false);
  const [migrandoSupabase, setMigrandoSupabase] = useState(false);

  const handleMigrarASupabase = async () => {
    setMigrandoSupabase(true);
    try {
      const resultado = await migrarDatosASupabase();
      if (resultado.success) {
        alert('✅ Migración completada exitosamente!');
        await verificarMigracion();
      } else {
        alert(`❌ Error en migración: ${resultado.message}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error}`);
    } finally {
      setMigrandoSupabase(false);
    }
  };

  const accionesRapidas = [
    {
      titulo: 'Registrar Asociado',
      descripcion: 'Agregar un nuevo miembro a la cooperativa',
      icono: '➕',
      href: '/registro',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      titulo: 'Ver Reportes',
      descripcion: 'Generar reportes de liquidación mensual',
      icono: '📊',
      href: '/reportes',
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      titulo: 'Gestionar Contratistas',
      descripcion: 'Administrar empresas contratistas',
      icono: '🏢',
      href: '/contratistas',
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const estadisticasRapidas = [
    {
      titulo: 'Asociados Activos',
      valor: state.asociados.filter(a => a.activo).length,
      icono: '👥',
      color: 'text-blue-600'
    },
    {
      titulo: 'Contratistas',
      valor: state.contratistas.length,
      icono: '🏢',
      color: 'text-green-600'
    },
    {
      titulo: 'Total Bajas',
      valor: state.asociados.filter(a => !a.activo).length,
      icono: '📋',
      color: 'text-red-600'
    }
  ];

  const handleExportacionRapida = () => {
    // Generar CSV rápido con datos básicos
    const asociadosActivos = state.asociados.filter(a => a.activo);
    const csvContent = [
      'Nombre,Apellido,DNI,Legajo,Contratista,Monotributo',
      ...asociadosActivos.map(a => 
        `${a.nombre},${a.apellido},${a.dni},${a.legajo},${a.contratista},${a.monotributo ? 'Sí' : 'No'}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `asociados_activos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas rápidas */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚡ Vista Rápida
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {estadisticasRapidas.map((stat, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`text-2xl ${stat.color} mb-2`}>
                {stat.icono}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.valor}
              </div>
              <div className="text-sm text-gray-600">
                {stat.titulo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accionesRapidas.map((accion, index) => (
            <Link
              key={index}
              href={accion.href}
              className={`block p-4 rounded-lg text-white transition-colors ${accion.color} hover:scale-105 transform transition-transform`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{accion.icono}</div>
                <h4 className="font-semibold text-sm mb-1">{accion.titulo}</h4>
                <p className="text-xs opacity-90">{accion.descripcion}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Herramientas de exportación */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📤 Exportación Rápida
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportacionRapida}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <span className="mr-2">📊</span>
            Exportar Asociados Activos (CSV)
          </button>
          
          <Link
            href="/reportes"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">📋</span>
            Generar Reporte Completo
          </Link>

          <button
            onClick={() => setMostrarModalRapido(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <span className="mr-2">⚙️</span>
            Herramientas Avanzadas
          </button>

          <button
            onClick={handleMigrarASupabase}
            disabled={migrandoSupabase}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
          >
            <span className="mr-2">🚀</span>
            {migrandoSupabase ? 'Migrando...' : 'Migrar a Supabase'}
          </button>
        </div>
      </div>

      {/* Estado de Supabase */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🗄️ Estado de Base de Datos
        </h3>
        <div className="space-y-3">
          {isSupabaseConfigured ? (
            <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 mr-3 mt-0.5">✅</span>
              <div>
                <h4 className="text-sm font-medium text-green-800">
                  Supabase Configurado
                </h4>
                <p className="text-sm text-green-700">
                  Base de datos PostgreSQL conectada y funcionando
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <span className="text-orange-600 mr-3 mt-0.5">⚙️</span>
              <div>
                <h4 className="text-sm font-medium text-orange-800">
                  Configurar Supabase
                </h4>
                <p className="text-sm text-orange-700">
                  Usando datos temporales. Configura Supabase para producción.
                </p>
                <div className="mt-2 text-xs text-orange-600">
                  <p>1. Crea proyecto en supabase.com</p>
                  <p>2. Copia credenciales a .env.local</p>
                  <p>3. Reinicia el servidor</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recordatorios y notificaciones */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔔 Recordatorios
        </h3>
        <div className="space-y-3">
          <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-yellow-600 mr-3 mt-0.5">⚠️</span>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                Revisión mensual pendiente
              </h4>
              <p className="text-sm text-yellow-700">
                Recuerda generar los reportes de liquidación del mes actual
              </p>
            </div>
          </div>

          <div className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-600 mr-3 mt-0.5">💡</span>
            <div>
              <h4 className="text-sm font-medium text-blue-800">
                Tip del día
              </h4>
              <p className="text-sm text-blue-700">
                Puedes usar el filtro por contratista para generar reportes específicos
              </p>
            </div>
          </div>

          <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="text-green-600 mr-3 mt-0.5">✅</span>
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Sistema actualizado
              </h4>
              <p className="text-sm text-green-700">
                Todas las funcionalidades están operativas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de herramientas avanzadas */}
      {mostrarModalRapido && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚙️ Herramientas Avanzadas
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                🗑️ Limpiar datos de prueba
              </button>
              <button
                onClick={() => {
                  console.log('Estado actual:', state);
                  setMostrarModalRapido(false);
                }}
                className="w-full text-left px-3 py-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
              >
                🔍 Debug estado en consola
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setMostrarModalRapido(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
