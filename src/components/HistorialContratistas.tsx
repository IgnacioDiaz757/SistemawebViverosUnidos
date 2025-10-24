'use client';

import React, { useState, useEffect } from 'react';
import { Asociado, Empleado } from '@/types/asociado';
import { CATEGORIAS_ROPA } from '@/types/ropa';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseHistorialContratistasService } from '@/services/supabaseHistorialContratistasService';
import { supabaseContratistasService } from '@/services/supabaseContratistasService';
import { SnapshotRopaEmpleado } from '@/types/historialContratista';

interface HistorialContratistasProps {
  empleado: Empleado | null;
  isOpen: boolean;
  onClose: () => void;
}

const HistorialContratistas: React.FC<HistorialContratistasProps> = ({ empleado, isOpen, onClose }) => {
  const [ropaExpandida, setRopaExpandida] = useState<string | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [contratistas, setContratistas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [mapIdToNombre, setMapIdToNombre] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && empleado?.id) {
      cargarHistorial();
    }
  }, [isOpen, empleado?.id]);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const lista = await supabaseContratistasService.listar();
        setContratistas(lista || []);
        const map: Record<string, string> = Object.fromEntries((lista || []).map((c: any) => [String(c.id), c.nombre]));
        setMapIdToNombre(map);
      } catch {
        setContratistas([]);
        setMapIdToNombre({});
      }
    })();
  }, [isOpen]);

  const cargarHistorial = async () => {
    if (!empleado?.id) return;
    
    setCargando(true);
    try {
      if (isSupabaseConfigured) {
        const datos = await supabaseHistorialContratistasService.listar(empleado.id);
        setHistorial(Array.isArray(datos) ? datos : []);
      } else {
        // Leer historial desde localStorage (mock sin backend)
        const key = `historial_contratistas_${empleado.id}`;
        const datos = JSON.parse(localStorage.getItem(key) || '[]');
        setHistorial(Array.isArray(datos) ? datos : []);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setHistorial([]);
    } finally {
      setCargando(false);
    }
  };

  if (!isOpen || !empleado) return null;

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  const hayHistorial = historial.length > 0;

  const obtenerCategoriaLabel = (categoria: string) => {
    return CATEGORIAS_ROPA.find(c => c.value === categoria)?.label || categoria;
  };

  const toggleRopaExpandida = (cambioId: string) => {
    setRopaExpandida(ropaExpandida === cambioId ? null : cambioId);
  };

  // Calcular estadísticas desde el historial de Supabase
  const estadisticas = {
    totalCambios: historial.filter(h => (h.tipo_movimiento || h.tipo) === 'cambio_contratista').length,
    contratistasPorLosQuePaso: [...new Set(historial.map(h => (mapIdToNombre[String(h.contratista_nuevo)] || mapIdToNombre[String(h.contratista_anterior)] || h.contratista_nuevo || h.contratista_anterior)).filter(Boolean))],
    contratistaActual:
      // Si viene como objeto con nombre
      (empleado?.contratista && typeof (empleado as any).contratista === 'object' && (empleado as any).contratista?.nombre) ||
      // Si tenemos contratista_id usar el mapa
      (empleado?.contratista_id ? (mapIdToNombre[String(empleado.contratista_id)] || undefined) : undefined) ||
      // Si contratista es string (id o nombre)
      (typeof (empleado as any)?.contratista === 'string'
        ? (mapIdToNombre[String((empleado as any).contratista)] || (empleado as any).contratista)
        : undefined) ||
      'Sin asignar',
  };

  const mostrarContratista = (valor: any): string => {
    if (!valor) return 'Sin asignar';
    const key = String(valor);
    return mapIdToNombre[key] || key;
  };

  const RopaSnapshot: React.FC<{ snapshot: SnapshotRopaEmpleado; cambioId: string }> = ({ snapshot, cambioId }) => {
    const isExpanded = ropaExpandida === cambioId;
    
    return (
      <div className="mt-3 p-3 bg-white rounded-md border border-blue-200">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => toggleRopaExpandida(cambioId)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-blue-800">
              👕 Ropa entregada con {snapshot.contratista}
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {snapshot.totalElementos} elementos
            </span>
          </div>
          <span className="text-blue-600">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
        
        {isExpanded && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-blue-600">
              Registro capturado el: {formatearFecha(snapshot.fechaSnapshot)}
            </p>
            
            {snapshot.entregas.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No había ropa entregada</p>
            ) : (
              <div className="space-y-2">
                {snapshot.entregas.map((entrega) => (
                  <div key={entrega.id} className="flex justify-between items-start p-2 bg-gray-50 rounded text-sm">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {entrega.nombreElemento}
                        {entrega.talla && (
                          <span className="ml-2 px-1 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                            {entrega.talla}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-x-2">
                        <span>{obtenerCategoriaLabel(entrega.categoria)}</span>
                        <span>•</span>
                        <span>Entregado: {formatearFecha(entrega.fechaEntrega)}</span>
                        <span>•</span>
                        <span>Por: {entrega.entregadoPor}</span>
                      </div>
                      {entrega.observaciones && (
                        <div className="text-xs text-gray-500 mt-1">
                          Obs: {entrega.observaciones}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-gray-700">
                        x{entrega.cantidad}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Historial de Contratistas - {empleado.nombre} {empleado.apellido}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.totalCambios}</div>
            <div className="text-sm text-gray-600">Cambios de contratista</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{estadisticas.contratistasPorLosQuePaso.length}</div>
            <div className="text-sm text-gray-600">Contratistas diferentes</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {historial.filter(h => h.tipo_movimiento === 'alta').length}
            </div>
            <div className="text-sm text-gray-600">Altas registradas</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{estadisticas.contratistaActual}</div>
            <div className="text-sm text-gray-600">Contratista actual</div>
          </div>
        </div>

        {/* Historial */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-800">Historial Completo</h4>
          
          {cargando ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">⏳</div>
              <p>Cargando historial...</p>
            </div>
          ) : !hayHistorial ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>No hay historial de movimientos disponible</p>
              <p className="text-sm">Este asociado no tiene registros de cambios de contratista</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Línea de tiempo */}
              <div className="relative">
                {/* Línea vertical */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                
                {/* Movimientos del historial */}
                {historial.map((movimiento, index) => (
                  <div key={movimiento.id} className="relative flex items-start space-x-4 pb-6">
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                      movimiento.tipo_movimiento === 'alta' ? '' :
                      movimiento.tipo_movimiento === 'baja' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={movimiento.tipo_movimiento === 'alta' ? {backgroundColor: '#C70CB9'} : {}}>
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <div 
                      className={`flex-1 p-4 rounded-lg border ${
                        movimiento.tipo_movimiento === 'alta' ? '' :
                        movimiento.tipo_movimiento === 'baja' ? 'bg-red-50 border-red-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                      style={movimiento.tipo_movimiento === 'alta' ? {
                        backgroundColor: '#F3E5F2',
                        borderColor: '#C70CB9'
                      } : {}}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 
                            className={`font-semibold ${
                              movimiento.tipo_movimiento === 'alta' ? '' :
                              movimiento.tipo_movimiento === 'baja' ? 'text-red-800' :
                              'text-blue-800'
                            }`}
                            style={movimiento.tipo_movimiento === 'alta' ? {color: '#A00A9A'} : {}}
                          >
                          {(movimiento.tipo_movimiento || movimiento.tipo) === 'alta' ? 'Alta de Asociado' :
                             (movimiento.tipo_movimiento || movimiento.tipo) === 'baja' ? 'Baja de Asociado' :
                             'Cambio de Contratista'}
                          </h5>
                          
                          {(movimiento.tipo_movimiento || movimiento.tipo) === 'cambio_contratista' ? (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-red-600">De:</span>
                                <span className="font-medium text-red-700">{mostrarContratista(movimiento.contratista_anterior)}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-green-600">A:</span>
                                <span className="font-medium text-green-700">{mostrarContratista(movimiento.contratista_nuevo)}</span>
                              </div>
                            </div>
                          ) : (
                            <p className={`${
                              (movimiento.tipo_movimiento || movimiento.tipo) === 'alta' ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {(movimiento.tipo_movimiento || movimiento.tipo) === 'alta' ? 'Asignado a:' : 'Dado de baja de:'} 
                              <span className="font-medium ml-1">{mostrarContratista(movimiento.contratista_nuevo || movimiento.contratista_anterior)}</span>
                            </p>
                          )}
                          
                          <div className="mt-2 space-y-1">
                            <p className={`text-sm ${
                              (movimiento.tipo_movimiento || movimiento.tipo) === 'alta' ? 'text-green-600' :
                              (movimiento.tipo_movimiento || movimiento.tipo) === 'baja' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              <span className="font-medium">Fecha:</span> {formatearFecha(movimiento.fecha_movimiento || movimiento.fecha)}
                            </p>
                            <p className={`text-sm ${
                              (movimiento.tipo_movimiento || movimiento.tipo) === 'alta' ? 'text-green-600' :
                              (movimiento.tipo_movimiento || movimiento.tipo) === 'baja' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              <span className="font-medium">Responsable:</span> {typeof movimiento.responsable === 'string' ? movimiento.responsable : `${movimiento.responsable?.nombre || ''} ${movimiento.responsable?.apellido || ''}`.trim()}
                            </p>
                            {movimiento.observaciones && (
                              <p className={`text-sm ${
                                (movimiento.tipo_movimiento || movimiento.tipo) === 'alta' ? 'text-green-600' :
                                (movimiento.tipo_movimiento || movimiento.tipo) === 'baja' ? 'text-red-600' :
                                'text-blue-600'
                              }`}>
                                <span className="font-medium">Observaciones:</span> {movimiento.observaciones}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          (movimiento.tipo_movimiento || movimiento.tipo) === 'alta' ? 'bg-green-100 text-green-800' :
                          (movimiento.tipo_movimiento || movimiento.tipo) === 'baja' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {(movimiento.tipo_movimiento || movimiento.tipo) === 'alta' ? 'Alta' :
                           (movimiento.tipo_movimiento || movimiento.tipo) === 'baja' ? 'Baja' :
                           'Cambio'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Estado actual */}
                <div className="relative flex items-start space-x-4">
                  <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-purple-500 rounded-full">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-purple-800">Estado Actual</h5>
                        <p className="text-purple-700">
                          Contratista actual: <span className="font-medium">{estadisticas.contratistaActual}</span>
                        </p>
                        <p className="text-sm text-purple-600">
                          Asociado {empleado.activo ? 'activo' : 'dado de baja'}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Actual
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumen de contratistas */}
        {estadisticas.contratistasPorLosQuePaso.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-semibold text-gray-800 mb-2">Resumen de Contratistas</h5>
            <div className="flex flex-wrap gap-2">
                  {estadisticas.contratistasPorLosQuePaso.map((contratista, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    contratista === estadisticas.contratistaActual
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {contratista}
                      {contratista === estadisticas.contratistaActual && ' (actual)'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Botón cerrar */}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistorialContratistas;
