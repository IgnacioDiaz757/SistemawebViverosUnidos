'use client';

import React, { useState } from 'react';
import { Accidente, ObservacionDiaria } from '@/types/accidentes';
import { useAuth } from '@/context/AuthContext';

interface ObservacionesDiariasProps {
  accidente: Accidente;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (accidenteActualizado: Accidente) => void;
}

const ObservacionesDiarias: React.FC<ObservacionesDiariasProps> = ({ 
  accidente, 
  isOpen, 
  onClose, 
  onUpdate 
}) => {
  const { user } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevaObservacion, setNuevaObservacion] = useState({
    fecha: new Date().toISOString().split('T')[0],
    observacion: ''
  });
  const [errores, setErrores] = useState<Record<string, string>>({});

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!nuevaObservacion.fecha) {
      nuevosErrores.fecha = 'La fecha es obligatoria';
    }
    if (!nuevaObservacion.observacion.trim()) {
      nuevosErrores.observacion = 'La observación es obligatoria';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    const observacion: ObservacionDiaria = {
      id: Date.now().toString(),
      fecha: nuevaObservacion.fecha,
      observacion: nuevaObservacion.observacion.trim(),
      creadoPor: user?.nombre || user?.email || 'Usuario desconocido',
      fechaCreacion: new Date().toISOString()
    };

    const accidenteActualizado: Accidente = {
      ...accidente,
      observacionesDiarias: [...accidente.observacionesDiarias, observacion]
    };

    try {
      // Persistir en DB: agregar a observaciones_diarias jsonb
      const payload = {
        id: observacion.id,
        fecha: observacion.fecha,
        observacion: observacion.observacion,
        creadoPor: observacion.creadoPor,
        fechaCreacion: observacion.fechaCreacion,
      };
      const svc: any = await import('@/services/supabaseAccidentesService');
      await svc.supabaseAccidentesService.agregarObservacionDiaria(accidente.id as any, payload);
      // Releer desde DB para asegurar sincronización y que jsonb fue guardado
      const refreshed = await svc.supabaseAccidentesService.obtenerAccidente(accidente.id as any);
      onUpdate((refreshed || accidenteActualizado) as any);
    } catch {
      // Si falla, al menos actualizamos en UI
      onUpdate(accidenteActualizado);
    }

    // Resetear formulario
    setNuevaObservacion({
      fecha: new Date().toISOString().split('T')[0],
      observacion: ''
    });
    setErrores({});
    setMostrarFormulario(false);
  };

  const eliminarObservacion = (observacionId: string) => {
    if (confirm('¿Está seguro que desea eliminar esta observación?')) {
      const observacionesFiltradas = accidente.observacionesDiarias.filter(
        obs => obs.id !== observacionId
      );
      
      const accidenteActualizado: Accidente = {
        ...accidente,
        observacionesDiarias: observacionesFiltradas
      };

      onUpdate(accidenteActualizado);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (fechaISO: string) => {
    return new Date(fechaISO).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case 'reportado': return 'bg-blue-100 text-blue-800';
      case 'en_tratamiento': return 'bg-orange-100 text-orange-800';
      case 'resuelto': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              📋 Seguimiento Diario - {accidente.nombre} {accidente.apellido}
            </h3>
            <div className="flex items-center gap-4 mt-2">
              {(() => {
                const estadoSafe = (accidente.estado as any) || 'reportado';
                return (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${obtenerColorEstado(estadoSafe)}`}>
                    {String(estadoSafe).replace('_', ' ').toUpperCase()}
                  </span>
                );
              })()}
              <span className="text-sm text-gray-600">
                📅 Accidente: {formatearFecha(accidente.fechaAccidente)}
              </span>
              <span className="text-sm text-gray-600">
                🏥 {accidente.nombreSeguro}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Información del accidente */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">Descripción del Accidente:</h4>
          <p className="text-gray-700">{accidente.descripcion}</p>
          {accidente.observaciones && (
            <>
              <h4 className="font-semibold text-gray-900 mt-3 mb-2">Observaciones Iniciales:</h4>
              <p className="text-gray-700">{accidente.observaciones}</p>
            </>
          )}
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Seguimientos</p>
            <p className="text-2xl font-bold text-blue-700">{accidente.observacionesDiarias.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Último Seguimiento</p>
            <p className="text-sm font-bold text-green-700">
              {accidente.observacionesDiarias.length > 0 
                ? formatearFecha(accidente.observacionesDiarias[accidente.observacionesDiarias.length - 1].fecha)
                : 'Sin seguimientos'
              }
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 font-medium">Días de Seguimiento</p>
            <p className="text-2xl font-bold text-purple-700">
              {accidente.observacionesDiarias.length > 0 
                ? Math.ceil((new Date().getTime() - new Date(accidente.fechaAccidente).getTime()) / (1000 * 3600 * 24))
                : 0
              }
            </p>
          </div>
        </div>

        {/* Botón para agregar observación */}
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-semibold text-gray-900">Observaciones Diarias</h4>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            ➕ Agregar Observación
          </button>
        </div>

        {/* Lista de observaciones */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {accidente.observacionesDiarias.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg">📝 No hay observaciones diarias registradas</p>
              <p className="text-sm mt-2">Comience agregando la primera observación del seguimiento</p>
            </div>
          ) : (
            accidente.observacionesDiarias
              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .map((observacion) => (
                <div key={observacion.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <span className="text-blue-600 text-sm">📅</span>
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">
                          {formatearFecha(observacion.fecha)}
                        </h5>
                        <p className="text-sm text-gray-500">
                          Por {observacion.creadoPor} • {formatearHora(observacion.fechaCreacion)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarObservacion(observacion.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Eliminar observación"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="ml-12">
                    <p className="text-gray-700 leading-relaxed">{observacion.observacion}</p>
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Modal de formulario para nueva observación */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-gray-900">➕ Nueva Observación Diaria</h4>
                <button
                  onClick={() => {
                    setMostrarFormulario(false);
                    setErrores({});
                    setNuevaObservacion({
                      fecha: new Date().toISOString().split('T')[0],
                      observacion: ''
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de la Observación *
                  </label>
                  <input
                    type="date"
                    value={nuevaObservacion.fecha}
                    onChange={(e) => setNuevaObservacion(prev => ({...prev, fecha: e.target.value}))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.fecha ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errores.fecha && <p className="text-red-500 text-xs mt-1">{errores.fecha}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observación del Día *
                  </label>
                  <textarea
                    value={nuevaObservacion.observacion}
                    onChange={(e) => setNuevaObservacion(prev => ({...prev, observacion: e.target.value}))}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.observacion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describa el estado del accidentado, evolución, tratamientos recibidos, etc..."
                  />
                  {errores.observacion && <p className="text-red-500 text-xs mt-1">{errores.observacion}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Ejemplo: "El paciente mostró mejoría en la movilidad. Se realizó fisioterapia. Dolor reducido de 8/10 a 5/10."
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setErrores({});
                      setNuevaObservacion({
                        fecha: new Date().toISOString().split('T')[0],
                        observacion: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    💾 Guardar Observación
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ObservacionesDiarias;
