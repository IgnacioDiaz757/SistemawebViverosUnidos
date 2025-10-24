'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useEmpleados } from '@/context/EmpleadosContext';
import { FiltroReporte, ReporteLiquidacion, MESES_NOMBRES } from '@/types/reportes';
import { generarReporteLiquidacion, exportarReporteCSV, descargarCSV } from '@/utils/reportesLiquidacion';
import { useServicios } from '@/context/ServiciosContext';
import { isSupabaseConfigured } from '@/lib/supabase';
// PDF functionality removed for stability

const ReportesLiquidacion: React.FC = () => {
  const { state } = useEmpleados();
  const { asociados: asociadosService, contratistas: contratistasService } = useServicios();
  const [asociadosSupabase, setAsociadosSupabase] = React.useState<any[]>([]);
  const [contratistasSupabase, setContratistasSupabase] = React.useState<any[]>([]);
  const [cargando, setCargando] = React.useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const cargar = async () => {
      setCargando(true);
      try {
        // Traer activos y bajas y unificarlos
        const [activos, bajas, c] = await Promise.all([
          asociadosService.obtenerAsociadosActivos(),
          asociadosService.obtenerAsociadosBaja?.() || Promise.resolve([]),
          contratistasService.listar(),
        ]);
        const listaContratistas = (c || []) as any[];
        const idToNombre: Record<string, string> = Object.fromEntries(
          listaContratistas.map((x: any) => [String(x.id), String(x.nombre)])
        );
        const normalizar = (emp: any) => ({
          ...emp,
          // Normalizar nombres de campos a camelCase esperados por utils
          fechaCarga: emp.fecha_carga || emp.fechaCarga,
          fechaBaja: emp.fecha_baja || emp.fechaBaja,
          fechaIngreso: emp.fecha_ingreso || emp.fechaIngreso,
          activo: emp.activo !== false,
          contratista: ((): string => {
            const direct = emp?.contratista;
            if (typeof direct === 'string') return direct;
            const cid = emp?.contratista_id || emp?.id_contratista || emp?.contratistaId;
            return (cid && idToNombre[String(cid)]) || '';
          })(),
          responsableBaja: emp.responsable_baja || emp.responsableBaja,
        });
        const unificados = ([...(activos || []), ...((bajas as any[]) || [])] as any[]).map(normalizar);
        setAsociadosSupabase(unificados);
        setContratistasSupabase(c || []);
      } finally {
        setCargando(false);
      }
    };
    cargar();
    const handler = () => cargar();
    window.addEventListener('contratistasUpdated', handler as any);
    return () => window.removeEventListener('contratistasUpdated', handler as any);
  }, [isSupabaseConfigured, asociadosService, contratistasService]);
  const [filtro, setFiltro] = useState<FiltroReporte>({
    año: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    tipoMovimiento: 'todos'
  });
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // Generar reporte basado en los filtros actuales
  const fuenteAsociados = isSupabaseConfigured ? asociadosSupabase : state.asociados;
  const fuenteContratistas = isSupabaseConfigured ? contratistasSupabase : state.contratistas;

  const reporte: ReporteLiquidacion = useMemo(() => {
    return generarReporteLiquidacion(fuenteAsociados as any, fuenteContratistas as any, filtro);
  }, [fuenteAsociados, fuenteContratistas, filtro]);

  const handleFiltroChange = (campo: keyof FiltroReporte, valor: any) => {
    setFiltro(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // PDF functions removed for stability

  const handleExportarCSV = () => {
    const contenidoCSV = exportarReporteCSV(reporte);
    const nombreArchivo = `liquidacion_${filtro.año}_${filtro.mes ? MESES_NOMBRES[filtro.mes - 1] : 'anual'}.csv`;
    descargarCSV(contenidoCSV, nombreArchivo);
  };

  const años = useMemo(() => {
    const añosSet = new Set<number>();
    (fuenteAsociados as any[]).forEach(asociado => {
      if (asociado.fechaCarga) {
        añosSet.add(new Date(asociado.fechaCarga).getFullYear());
      }
      if (asociado.fechaBaja) {
        añosSet.add(new Date(asociado.fechaBaja).getFullYear());
      }
    });
    return Array.from(añosSet).sort((a, b) => b - a);
  }, [fuenteAsociados]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Filtros de Reporte</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Año */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <select
              value={filtro.año}
              onChange={(e) => handleFiltroChange('año', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {años.map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>
          </div>

          {/* Mes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mes
            </label>
            <select
              value={filtro.mes || ''}
              onChange={(e) => handleFiltroChange('mes', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todo el año</option>
              {MESES_NOMBRES.map((mes, index) => (
                <option key={index} value={index + 1}>{mes}</option>
              ))}
            </select>
          </div>

          {/* Contratista */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contratista
            </label>
            <select
              value={filtro.contratista || ''}
              onChange={(e) => handleFiltroChange('contratista', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los contratistas</option>
              {(fuenteContratistas as any[]).map(contratista => (
                <option key={contratista.id} value={contratista.nombre}>{contratista.nombre}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimiento
            </label>
            <select
              value={filtro.tipoMovimiento || 'todos'}
              onChange={(e) => handleFiltroChange('tipoMovimiento', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              <option value="alta">Solo Altas</option>
              <option value="baja">Solo Bajas</option>
              <option value="cambio_contratista">Solo Cambios</option>
            </select>
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filtro.fechaDesde || ''}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filtro.fechaHasta || ''}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleExportarCSV}
            className="px-4 py-2 text-white font-medium rounded-md focus:outline-none focus:ring-2 transition-colors"
            style={{
              backgroundColor: '#C70CB9',
              '--tw-ring-color': '#C70CB9'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#A00A9A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#C70CB9';
            }}
          >
            📊 Exportar CSV
          </button>
          <button
            onClick={() => setMostrarDetalle(!mostrarDetalle)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {mostrarDetalle ? '👁️ Ocultar Detalle' : '👁️ Mostrar Detalle'}
          </button>
          <button
            onClick={() => setFiltro({
              año: new Date().getFullYear(),
              mes: new Date().getMonth() + 1,
              tipoMovimiento: 'todos'
            })}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            🗑️ Limpiar Filtros
          </button>
        </div>
      </div>

      {/* Resumen General */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Resumen General - {reporte.nombreMes} {reporte.año}
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{reporte.resumenGeneral.totalAltas}</div>
            <div className="text-sm text-gray-600">Altas</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{reporte.resumenGeneral.totalBajas}</div>
            <div className="text-sm text-gray-600">Bajas</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{reporte.resumenGeneral.totalCambios}</div>
            <div className="text-sm text-gray-600">Cambios</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{reporte.resumenGeneral.asociadosActivosInicioMes}</div>
            <div className="text-sm text-gray-600">Activos Inicio</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{reporte.resumenGeneral.asociadosActivosFinMes}</div>
            <div className="text-sm text-gray-600">Activos Fin</div>
          </div>
        </div>
      </div>

      {/* Resumen por Contratista */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen por Contratista</h2>
        
        {reporte.resumenPorContratista.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No hay movimientos para el período seleccionado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contratista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Altas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bajas
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entrada
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salida
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Neto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reporte.resumenPorContratista.map((resumen, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {resumen.contratista}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resumen.nombreMes} {resumen.año}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        +{resumen.totalAltas}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        -{resumen.totalBajas}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        +{resumen.totalCambiosEntrada}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        -{resumen.totalCambiosSalida}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          resumen.saldoNeto > 0 
                            ? '' 
                            : resumen.saldoNeto < 0 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                        }`}
                        style={resumen.saldoNeto > 0 ? {
                          backgroundColor: '#F3E5F2',
                          color: '#C70CB9'
                        } : {}}
                      >
                        {resumen.saldoNeto > 0 ? '+' : ''}{resumen.saldoNeto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalle de Movimientos */}
      {mostrarDetalle && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalle de Movimientos</h2>
          
          {reporte.movimientos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay movimientos para mostrar</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Movimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asociado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DNI
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Legajo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contratista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Ingreso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Salida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Días Trabajados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsable
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reporte.movimientos.map((movimiento, index) => {
                    // Calcular días trabajados (compatibilidad camelCase/snake_case)
                    let diasTrabajados = '-';
                    const fechaIngresoStr = (movimiento.asociado as any).fechaIngreso || (movimiento.asociado as any).fecha_ingreso;
                    const fechaBajaStr = (movimiento.asociado as any).fechaBaja || (movimiento.asociado as any).fecha_baja;
                    if (fechaIngresoStr) {
                      const fechaIngreso = new Date(fechaIngresoStr);
                      const fechaFin = movimiento.tipo === 'baja' && fechaBajaStr
                        ? new Date(fechaBajaStr)
                        : new Date(); // Si está activo, hasta hoy
                      const diffTime = fechaFin.getTime() - fechaIngreso.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      diasTrabajados = diffDays.toString();
                    }

                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(movimiento.fecha).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            movimiento.tipo === 'alta' 
                              ? 'bg-green-100 text-green-800' 
                              : movimiento.tipo === 'baja'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}>
                            {movimiento.tipo.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {movimiento.asociado.nombre} {movimiento.asociado.apellido}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movimiento.asociado.dni}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movimiento.asociado.legajo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movimiento.contratista}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {fechaIngresoStr 
                            ? new Date(fechaIngresoStr).toLocaleDateString('es-AR')
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {fechaBajaStr ? (
                            <span className="text-red-600 font-medium">
                              {new Date(fechaBajaStr).toLocaleDateString('es-AR')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ACTIVO
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {diasTrabajados !== '-' ? `${diasTrabajados} días` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {movimiento.responsable || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportesLiquidacion;
