'use client';

import { useEmpleados } from '@/context/EmpleadosContext';
import { useAuth } from '@/context/AuthContext';

export default function EstadisticasAdmin() {
  const { state, obtenerEmpleadosActivos, obtenerEmpleadosDeBaja } = useEmpleados();
  const { user } = useAuth();

  const asociadosActivos = obtenerEmpleadosActivos();
  const asociadosBaja = obtenerEmpleadosDeBaja();
  const totalAsociados = asociadosActivos.length;
  const totalMonotributo = asociadosActivos.filter(emp => emp.monotributo).length;
  const totalDependencia = totalAsociados - totalMonotributo;

  // Estadísticas por contratista
  const estadisticasPorContratista = state.contratistas.map(contratista => {
    const asociadosDelContratista = asociadosActivos.filter(
      asociado => asociado.contratista === contratista.nombre
    );
    return {
      nombre: contratista.nombre,
      cantidad: asociadosDelContratista.length,
      monotributo: asociadosDelContratista.filter(a => a.monotributo).length,
      dependencia: asociadosDelContratista.filter(a => !a.monotributo).length
    };
  });

  // Estadísticas de actividad reciente
  const fechaHoy = new Date().toISOString().split('T')[0];
  const fechaUltimaSemana = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const altasRecientes = state.asociados.filter(
    asociado => (asociado as any).fechaCarga >= fechaUltimaSemana || asociado.fecha_carga >= fechaUltimaSemana
  ).length;

  const bajasRecientes = asociadosBaja.filter(
    asociado => ((asociado as any).fechaBaja && (asociado as any).fechaBaja >= fechaUltimaSemana) || (asociado.fecha_baja && asociado.fecha_baja >= fechaUltimaSemana)
  ).length;

  return (
    <div className="space-y-6">
      {/* Saludo personalizado */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">
          👋 ¡Hola, {user?.nombre || 'Admin'}!
        </h2>
        <p className="text-blue-100">
          Aquí tienes un resumen de la actividad de la cooperativa
        </p>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">👥</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Asociados
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {totalAsociados}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📈</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Monotributo
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {totalMonotributo}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🏢</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Dependencia
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {totalDependencia}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📋</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Dados de Baja
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {asociadosBaja.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Actividad reciente */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Actividad de los Últimos 7 Días
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">⬆️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Nuevos Ingresos
                </p>
                <p className="text-lg font-bold text-green-900">
                  {altasRecientes}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">⬇️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Bajas Recientes
                </p>
                <p className="text-lg font-bold text-red-900">
                  {bajasRecientes}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución por contratista */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🏢 Distribución por Contratista
        </h3>
        <div className="space-y-3">
          {estadisticasPorContratista.map((contratista, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{contratista.nombre}</h4>
                <p className="text-sm text-gray-500">
                  {contratista.cantidad} asociados total
                </p>
              </div>
              <div className="flex space-x-4 text-sm">
                <div className="text-center">
                  <p className="font-medium text-green-600">{contratista.monotributo}</p>
                  <p className="text-gray-500">Monotrib.</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-purple-600">{contratista.dependencia}</p>
                  <p className="text-gray-500">Depend.</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
