'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEmpleados } from '@/context/EmpleadosContext';
import { useServicios } from '@/context/ServiciosContext';
import GestionContratistas from './GestionContratistas';
import GestionAccidentes from './GestionAccidentes';
import { Accidente } from '@/types/accidentes';
import supabaseAccidentesService from '@/services/supabaseAccidentesService';
import { generarReporteLiquidacion } from '@/utils/reportesLiquidacion';
// PDF functionality removed for stability

const EstadisticasDashboard: React.FC = () => {
  const { state, obtenerEmpleadosActivos, obtenerEmpleadosDeBaja } = useEmpleados();
  const servicios = useServicios() as any;
  const router = useRouter();
  const [mostrarGestionContratistas, setMostrarGestionContratistas] = useState(false);
  const [mostrarGestionAccidentes, setMostrarGestionAccidentes] = useState(false);
  const [accidentes, setAccidentes] = useState<Accidente[]>([]);
  const [asociadosActivos, setAsociadosActivos] = useState<any[]>([]);
  const [asociadosBaja, setAsociadosBaja] = useState<any[]>([]);
  const [contratistas, setContratistas] = useState<any[]>([]);
  const [filtroContratista, setFiltroContratista] = useState<string>(''); // almacena ID del contratista
  
  // Cargar datos desde servicios (Supabase o local según config)
  const cargarDatos = useCallback(async () => {
    try {
      const [activos, baja, contratistasData] = await Promise.all([
        servicios.asociados.obtenerAsociadosActivos(),
        servicios.asociados.obtenerAsociadosBaja(),
        servicios.contratistas.listar()
      ]);
      const listaContratistas = (contratistasData || []).map((c: any) => ({ id: c.id, nombre: c.nombre }));
      const porId: Record<string, string> = {};
      for (const c of listaContratistas) porId[c.id] = c.nombre;

      const getNombreContratistaFromEmp = (emp: any): string => {
        const direct = emp?.contratista;
        if (typeof direct === 'string') return direct;
        if (direct && typeof direct === 'object' && direct.nombre) return direct.nombre;
        const cid = emp?.contratista_id || emp?.id_contratista || emp?.contratistaId;
        if (cid && porId[cid]) return porId[cid];
        return '';
      };

      const getContratistaIdFromEmp = (emp: any): string | undefined => {
        const cid = emp?.contratista_id || emp?.id_contratista || emp?.contratistaId;
        if (cid) return String(cid);
        const direct = emp?.contratista;
        if (typeof direct === 'string') {
          const k = direct.trim().toLowerCase();
          return Object.keys(porId).find((id) => porId[id].trim().toLowerCase() === k);
        }
        if (direct && typeof direct === 'object' && direct.nombre) {
          const k = String(direct.nombre).trim().toLowerCase();
          return Object.keys(porId).find((id) => porId[id].trim().toLowerCase() === k);
        }
        return undefined;
      };

      const normalizar = (emp: any) => ({
        ...emp,
        contratista: getNombreContratistaFromEmp(emp),
        contratistaIdResolved: getContratistaIdFromEmp(emp),
      });

      setAsociadosActivos((activos || []).map(normalizar));
      setAsociadosBaja((baja || []).map(normalizar));
      setContratistas(listaContratistas);
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Fallback al contexto local
      setAsociadosActivos(obtenerEmpleadosActivos());
      setAsociadosBaja(obtenerEmpleadosDeBaja());
      setContratistas(state.contratistas);
    }
  }, [servicios, state.contratistas, obtenerEmpleadosActivos, obtenerEmpleadosDeBaja]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Escuchar cambios globales de contratistas para refrescar (disparado desde GestionContratistas)
  useEffect(() => {
    const handler = () => { try { cargarDatos(); } catch {} };
    window.addEventListener('contratistasUpdated', handler as any);
    return () => window.removeEventListener('contratistasUpdated', handler as any);
  }, [cargarDatos]);

  // Helper para obtener ID de contratista desde múltiples formas (id directo o por nombre)
  const nombreToId: Record<string, string> = Object.fromEntries(
    (contratistas || []).map((c: any) => [String((c?.nombre || '').toLowerCase()), c.id])
  );
  const getEmpContratistaId = (emp: any): string | undefined => emp?.contratistaIdResolved || emp?.contratista_id || emp?.id_contratista || emp?.contratistaId || ((): string | undefined => {
    const direct = emp?.contratista;
    if (typeof direct === 'string') return nombreToId[direct.trim().toLowerCase()];
    if (direct && typeof direct === 'object' && direct.nombre) return nombreToId[String(direct.nombre).trim().toLowerCase()];
    return undefined;
  })();

  // Estadísticas por contratista usando ID para filtrar (con fallback por nombre)
  const asociadosActivosFiltrados = filtroContratista
    ? asociadosActivos.filter(emp => String(getEmpContratistaId(emp) || '').trim().toLowerCase() === String(filtroContratista || '').trim().toLowerCase())
    : asociadosActivos;
  const contratistasParaMostrar = filtroContratista
    ? contratistas.filter((c: any) => c.id === filtroContratista)
    : contratistas;

  const estadisticasPorContratista = contratistasParaMostrar.map((contratista: any) => {
    const asociadosContratista = asociadosActivos.filter(emp => String(getEmpContratistaId(emp) || '').trim().toLowerCase() === String(contratista.id || '').trim().toLowerCase());
    const asociadosMonotributo = asociadosContratista.filter(emp => emp.monotributo);

    return {
      nombre: contratista.nombre,
      total: asociadosContratista.length,
      monotributo: asociadosMonotributo.length,
      dependencia: asociadosContratista.length - asociadosMonotributo.length
    };
  });

  const totalAsociados = asociadosActivosFiltrados.length;
  const totalMonotributo = asociadosActivosFiltrados.filter(emp => emp.monotributo).length;
  const totalDependencia = totalAsociados - totalMonotributo;

  // Cargar accidentes desde el servicio (Supabase o local según config)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const lista = await supabaseAccidentesService.obtenerAccidentes();
        if (mounted) setAccidentes(lista || []);
      } catch {
        if (mounted) setAccidentes([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Funciones para navegar al hacer clic en las cards
  const handleCardClick = (ruta: string) => {
    router.push(ruta);
  };

  // PDF functionality removed for stability

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Tarjeta: Total Asociados Activos */}
      <button
        onClick={() => handleCardClick('/asociadosactivos')}
        className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg hover:bg-blue-50 transition-all duration-200 text-left w-full cursor-pointer"
      >
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Asociados Activos</h3>
            <p className="text-3xl font-bold text-blue-600">{totalAsociados}</p>
            <p className="text-sm text-blue-500 mt-1">Click para ver lista</p>
          </div>
          <div className="text-blue-500 text-3xl"></div>
        </div>
      </button>

      {/* Tarjeta: Asociados de Baja */}
      <button
        onClick={() => handleCardClick('/bajas')}
        className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg hover:bg-red-50 transition-all duration-200 text-left w-full cursor-pointer"
      >
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Asociados de Baja</h3>
            <p className="text-3xl font-bold text-red-600">{asociadosBaja.length}</p>
            <p className="text-sm text-red-500 mt-1">Click para ver historial</p>
          </div>
          <div className="text-red-500 text-3xl"></div>
        </div>
      </button>

      {/* Tarjeta: Monotributo */}
      <button
        onClick={() => handleCardClick('/monotributos')}
        className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg hover:bg-green-50 transition-all duration-200 text-left w-full cursor-pointer"
      >
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Monotributo</h3>
            <p className="text-3xl font-bold text-green-600">{totalMonotributo}</p>
            <p className="text-sm text-gray-500">
              {totalAsociados > 0 ? Math.round((totalMonotributo / totalAsociados) * 100) : 0}% del total
            </p>
            <p className="text-sm text-green-500 mt-1">Click para ver monotributos</p>
          </div>
          <div className="text-green-500 text-3xl"></div>
        </div>
      </button>

      {/* Tarjeta: Accidentes */}
      <button
        onClick={() => setMostrarGestionAccidentes(true)}
        className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-600 hover:shadow-lg hover:bg-red-50 transition-all duration-200 text-left w-full cursor-pointer"
      >
        <div className="flex items-center">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Accidentes</h3>
            <p className="text-3xl font-bold text-red-600">{accidentes.length}</p>
            <p className="text-sm text-gray-500">
              {accidentes.filter(a => a.estado !== 'resuelto').length} pendientes
            </p>
            <p className="text-sm text-red-500 mt-1">Click para gestionar</p>
          </div>
          <div className="text-red-600 text-3xl"></div>
        </div>
      </button>

      {/* Estadísticas por Contratista */}
      <div className="md:col-span-2 lg:col-span-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Asociados por Contratista</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filtroContratista}
                onChange={(e) => setFiltroContratista(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Filtrar por contratista"
              >
                <option value="">Todos los contratistas</option>
                {contratistas.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {filtroContratista && (
                <button
                  onClick={() => setFiltroContratista('')}
                  className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Limpiar filtro
                </button>
              )}
              <Link
                href="/reportes"
                className="px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 transition-colors"
                style={{
                  backgroundColor: '#C70CB9',
                  '--tw-ring-color': '#C70CB9'
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#A00A9A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#C70CB9';
                }}
              >
                📊 Reportes Liquidación
              </Link>
              <button
                onClick={() => setMostrarGestionContratistas(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                🏢 Gestionar Contratistas
              </button>
            </div>
          </div>
          
          {estadisticasPorContratista.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay contratistas registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-4 min-w-[720px] md:min-w-0 md:grid md:grid-cols-2 lg:grid-cols-3">
                {estadisticasPorContratista.map((stats) => (
                  <div key={stats.nombre} className="border border-gray-200 rounded-lg p-4 min-w-[320px]">
                    <h4 className="font-semibold text-gray-900 mb-2">{stats.nombre}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total:</span>
                        <span className="font-medium text-blue-600">{stats.total}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monotributo:</span>
                        <span className="font-medium text-green-600">{stats.monotributo}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Dependencia:</span>
                        <span className="font-medium text-purple-600">{stats.dependencia}</span>
                      </div>
                    </div>
                    {stats.total > 0 && (
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(stats.monotributo / stats.total) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round((stats.monotributo / stats.total) * 100)}% Monotributo
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Gestión de Contratistas */}
      <GestionContratistas 
        isOpen={mostrarGestionContratistas}
        onClose={async () => { setMostrarGestionContratistas(false); try { await cargarDatos(); } catch {} }}
      />

      {/* Modal de Gestión de Accidentes */}
      <GestionAccidentes 
        isOpen={mostrarGestionAccidentes}
        onClose={() => setMostrarGestionAccidentes(false)}
      />
    </div>
  );
};

export default EstadisticasDashboard;
