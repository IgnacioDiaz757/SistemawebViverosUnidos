'use client';

import React, { useState, useEffect } from 'react';
import { downloadBase64File } from '@/utils/fileUtils';
import { isSupabaseConfigured } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import { useEmpleados } from '@/context/EmpleadosContext';
import { Accidente, EstadoAccidente, TipoAccidente, TipologiaAccidente } from '@/types/accidentes';
import { useAuth } from '@/context/AuthContext';
import { supabaseAccidentesService } from '@/services/supabaseAccidentesService';
import { supabaseContratistasService } from '@/services/supabaseContratistasService';
import ObservacionesDiarias from './ObservacionesDiarias';

interface GestionAccidentesProps {
  isOpen: boolean;
  onClose: () => void;
}

const GestionAccidentes: React.FC<GestionAccidentesProps> = ({ isOpen, onClose }) => {
  const { state } = useEmpleados();
  const { user } = useAuth();
  const [accidentes, setAccidentes] = useState<Accidente[]>([]);
  const [contratistas, setContratistas] = useState<any[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoAccidente>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [accidenteParaObservaciones, setAccidenteParaObservaciones] = useState<Accidente | null>(null);
  const [mostrarObservaciones, setMostrarObservaciones] = useState(false);
  
  const [nuevoAccidente, setNuevoAccidente] = useState<Omit<Accidente, 'id' | 'fechaCreacion' | 'creadoPor'>>({
    nombre: '',
    apellido: '',
    dni: '',
    fechaNacimiento: '',
    cuil: '',
    contratista: '',
    fechaAccidente: new Date().toISOString().split('T')[0],
    nroSiniestro: '',
    obraDireccion: '',
    descripcion: '',
    nombreSeguro: '',
    tipoAccidente: 'leve',
    tipologiaAccidente: undefined,
    estado: 'reportado',
    observaciones: '',
    observacionesDiarias: [], // Inicializar array vacío
    asociadoId: undefined
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar accidentes desde Supabase
  useEffect(() => {
    if (isOpen) {
      cargarAccidentes();
      cargarContratistas();
    }
  }, [isOpen]);

  const cargarAccidentes = async () => {
    try {
      const data = await supabaseAccidentesService.obtenerAccidentes();
      setAccidentes(data);
    } catch (error) {
      console.error('Error al cargar accidentes:', error);
    }
  };

  const cargarContratistas = async () => {
    try {
      const data = await supabaseContratistasService.listar();
      setContratistas(data);
    } catch (error) {
      console.error('Error al cargar contratistas:', error);
    }
  };

  // Ya no necesitamos guardar en localStorage, se maneja en Supabase

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!nuevoAccidente.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }
    if (!nuevoAccidente.apellido.trim()) {
      nuevosErrores.apellido = 'El apellido es obligatorio';
    }
    if (!nuevoAccidente.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción del accidente es obligatoria';
    }
    if (!nuevoAccidente.nombreSeguro.trim()) {
      nuevosErrores.nombreSeguro = 'El nombre del seguro es obligatorio';
    }
    if (!nuevoAccidente.nroSiniestro?.trim()) {
      nuevosErrores.nroSiniestro = 'El nro de siniestro es obligatorio';
    }
    if (!nuevoAccidente.fechaAccidente) {
      nuevosErrores.fechaAccidente = 'La fecha del accidente es obligatoria';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      // Buscar el contratista seleccionado
      const contratistaSeleccionado = contratistas.find(c => c.nombre === nuevoAccidente.contratista);
      
      const accidenteData = {
        nombre: nuevoAccidente.nombre,
        apellido: nuevoAccidente.apellido,
        dni: nuevoAccidente.dni,
        fecha_nacimiento: nuevoAccidente.fechaNacimiento || null,
        cuil: nuevoAccidente.cuil || null,
        contratista_id: contratistaSeleccionado?.id || null,
        obra_direccion: nuevoAccidente.obraDireccion || null,
        nro_siniestro: nuevoAccidente.nroSiniestro || null,
        descripcion: nuevoAccidente.descripcion || null,
        observaciones: nuevoAccidente.observaciones || null,
        tipologia: nuevoAccidente.tipologiaAccidente || 'otros',
        severidad: nuevoAccidente.tipoAccidente || 'leve',
        nombre_seguro: nuevoAccidente.nombreSeguro || '',
        fecha_accidente: nuevoAccidente.fechaAccidente || null,
        creado_por_id: user?.id || null
      };

      await supabaseAccidentesService.crearAccidente(accidenteData);
      await cargarAccidentes(); // Recargar la lista
      
      // Resetear formulario
      setNuevoAccidente({
        nombre: '',
        apellido: '',
        dni: '',
        fechaNacimiento: '',
        cuil: '',
        contratista: '',
        fechaAccidente: new Date().toISOString().split('T')[0],
        nroSiniestro: '',
        obraDireccion: '',
        descripcion: '',
        nombreSeguro: '',
        tipoAccidente: 'leve',
        tipologiaAccidente: undefined,
        estado: 'reportado',
        observaciones: '',
        observacionesDiarias: [],
        asociadoId: undefined
      });
      setErrores({});
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al crear accidente:', error);
      alert('Error al crear el accidente. Inténtalo de nuevo.');
    }
  };

  const actualizarEstadoAccidente = async (id: string, nuevoEstado: EstadoAccidente) => {
    try {
      console.log('Actualizando estado:', { id, nuevoEstado });
      await supabaseAccidentesService.actualizarAccidente(id, { estado: nuevoEstado });
      await cargarAccidentes(); // Recargar la lista
    } catch (error) {
      console.error('Error al actualizar estado del accidente:', error);
      alert((error as any)?.message || 'Error al actualizar el estado del accidente.');
    }
  };

  const actualizarAccidente = async (accidenteActualizado: Accidente) => {
    try {
      await supabaseAccidentesService.actualizarAccidente(accidenteActualizado.id, accidenteActualizado);
      await cargarAccidentes(); // Recargar la lista
    } catch (error) {
      console.error('Error al actualizar accidente:', error);
      alert('Error al actualizar el accidente.');
    }
  };

  const abrirObservaciones = (accidente: Accidente) => {
    setAccidenteParaObservaciones(accidente);
    setMostrarObservaciones(true);
  };

  const eliminarAccidente = (id: string) => {
    if (confirm('¿Está seguro que desea eliminar este registro de accidente?')) {
      supabaseAccidentesService.eliminarAccidente(id).then(cargarAccidentes);
    }
  };

  // Filtrar accidentes
  const accidentesFiltrados = accidentes.filter(accidente => {
    const cumpleFiltroEstado = filtroEstado === 'todos' || accidente.estado === filtroEstado;
    const cumpleBusqueda = busqueda === '' || 
      accidente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      accidente.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
      accidente.dni?.includes(busqueda) ||
      accidente.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleFiltroEstado && cumpleBusqueda;
  });

  const obtenerColorTipo = (tipo: TipoAccidente) => {
    switch (tipo) {
      case 'leve': return '';
      case 'grave': return 'text-orange-700 bg-orange-100';
      case 'muy_grave': return 'text-red-700 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const obtenerColorEstado = (estado: EstadoAccidente) => {
    switch (estado) {
      case 'reportado': return 'text-blue-600 bg-blue-100';
      case 'en_tratamiento': return 'text-orange-600 bg-orange-100';
      case 'resuelto': return '';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            🚨 Gestión de Accidentes
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Accidentes</p>
            <p className="text-2xl font-bold text-blue-700">{accidentes.length}</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-600 font-medium">En Tratamiento</p>
            <p className="text-2xl font-bold text-orange-700">
              {accidentes.filter(a => a.estado === 'en_tratamiento').length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Resueltos</p>
            <p className="text-2xl font-bold text-green-700">
              {accidentes.filter(a => a.estado === 'resuelto').length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Graves</p>
            <p className="text-2xl font-bold text-red-700">
              {accidentes.filter(a => a.tipoAccidente === 'muy_grave').length}
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setMostrarFormulario(true)}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            ➕ Registrar Accidente
          </button>
          
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los estados</option>
            <option value="reportado">Reportado</option>
            <option value="en_tratamiento">En Tratamiento</option>
            <option value="resuelto">Resuelto</option>
          </select>

          <input
            type="text"
            placeholder="Buscar por nombre, DNI o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 min-w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Lista de accidentes */}
        <div className="bg-white rounded-lg border">
          {accidentesFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {accidentes.length === 0 
                ? 'No hay accidentes registrados'
                : 'No se encontraron accidentes con los filtros aplicados'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accidentado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Accidente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seguro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seguimiento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archivos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accidentesFiltrados.map((accidente) => (
                    <tr key={accidente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {accidente.nombre} {accidente.apellido}
                          </div>
                          {accidente.dni && (
                            <div className="text-sm text-gray-500">DNI: {accidente.dni}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(() => {
                          const f = (accidente as any).fechaAccidente || (accidente as any).fecha_accidente;
                          const d = f ? new Date(f) : null;
                          return d ? d.toLocaleDateString('es-ES') : '-';
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerColorTipo((accidente as any).tipoAccidente || (accidente as any).severidad)}`}
                          style={((accidente as any).tipoAccidente || (accidente as any).severidad) === 'leve' ? {
                            backgroundColor: '#F3E5F2',
                            color: '#C70CB9'
                          } : {}}
                        >
                          {(() => {
                            const t = (accidente as any).tipoAccidente || (accidente as any).severidad || '';
                            return t ? t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ') : '-';
                          })()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <select
                          value={(accidente.estado as EstadoAccidente) || 'reportado'}
                        onChange={(e) => actualizarEstadoAccidente(accidente.id, e.target.value as EstadoAccidente)}
                         className={`text-xs font-semibold rounded-full px-2 py-1 border-0 ${obtenerColorEstado((accidente.estado as EstadoAccidente) || 'reportado')}`}
                         style={(accidente.estado as EstadoAccidente) === 'resuelto' ? {
                           backgroundColor: '#F3E5F2',
                           color: '#C70CB9'
                         } : {}}
                           >
                           <option value="reportado">Reportado</option>
                       <option value="en_tratamiento">En Tratamiento</option>
                        <option value="resuelto">Resuelto</option>
                         </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(accidente as any).nombreSeguro || (accidente as any).nombre_seguro || ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium text-blue-600">
                            {accidente.observacionesDiarias.length} observaciones
                          </span>
                          {accidente.observacionesDiarias.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {(() => {
                              const obs = (accidente as any).observacionesDiarias || (accidente as any).observaciones_diarias || [];
                              const last = obs[obs.length - 1];
                              const d = last?.fecha ? new Date(last.fecha) : null;
                              return d ? `Último: ${d.toLocaleDateString('es-ES')}` : '';
                            })()}
                          </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => abrirObservaciones(accidente)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver seguimiento diario"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => eliminarAccidente(accidente.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar accidente"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <AccidenteArchivos accidenteId={accidente.id} onChanged={cargarAccidentes} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de formulario */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-gray-900">Registrar Nuevo Accidente</h4>
                <button
                  onClick={() => {
                    setMostrarFormulario(false);
                    setErrores({});
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={nuevoAccidente.nombre}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, nombre: e.target.value}))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.nombre ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={nuevoAccidente.apellido}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, apellido: e.target.value}))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.apellido ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errores.apellido && <p className="text-red-500 text-xs mt-1">{errores.apellido}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      DNI
                    </label>
                    <input
                      type="text"
                      value={nuevoAccidente.dni}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, dni: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="12345678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={nuevoAccidente.fechaNacimiento || ''}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, fechaNacimiento: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CUIL
                    </label>
                    <input
                      type="text"
                      value={nuevoAccidente.cuil || ''}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, cuil: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="20-12345678-3"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contratista
                    </label>
                    <select
                      value={nuevoAccidente.contratista || ''}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, contratista: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar contratista</option>
                      {state.contratistas.map((c) => (
                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción del Accidente *
                  </label>
                  <textarea
                    value={nuevoAccidente.descripcion}
                    onChange={(e) => setNuevoAccidente(prev => ({...prev, descripcion: e.target.value}))}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.descripcion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describa qué le sucedió al accidentado..."
                  />
                  {errores.descripcion && <p className="text-red-500 text-xs mt-1">{errores.descripcion}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha del Accidente *
                    </label>
                    <input
                      type="date"
                      value={nuevoAccidente.fechaAccidente}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, fechaAccidente: e.target.value}))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.fechaAccidente ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errores.fechaAccidente && <p className="text-red-500 text-xs mt-1">{errores.fechaAccidente}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección de la Obra
                    </label>
                    <input
                      type="text"
                      value={nuevoAccidente.obraDireccion || ''}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, obraDireccion: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Calle, número y ciudad"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nro de Siniestro *
                    </label>
                    <input
                      type="text"
                      value={nuevoAccidente.nroSiniestro || ''}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, nroSiniestro: e.target.value}))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.nroSiniestro ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: 03-06-02104101"
                    />
                    {errores.nroSiniestro && <p className="text-red-500 text-xs mt-1">{errores.nroSiniestro}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Seguro *
                    </label>
                    <input
                      type="text"
                      value={nuevoAccidente.nombreSeguro}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, nombreSeguro: e.target.value}))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errores.nombreSeguro ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ej: ART La Segunda, OSDE, etc."
                    />
                    {errores.nombreSeguro && <p className="text-red-500 text-xs mt-1">{errores.nombreSeguro}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severidad del Accidente
                    </label>
                    <select
                      value={nuevoAccidente.tipoAccidente}
                      onChange={(e) => setNuevoAccidente(prev => ({...prev, tipoAccidente: e.target.value as TipoAccidente}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="leve">Leve</option>
                      <option value="grave">Grave</option>
                      <option value="muy_grave">Muy grave</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipología del Accidente
                  </label>
                  <select
                    value={nuevoAccidente.tipologiaAccidente || ''}
                    onChange={(e) => setNuevoAccidente(prev => ({...prev, tipologiaAccidente: (e.target.value || undefined) as TipologiaAccidente}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar tipología</option>
                    <option value="caida_de_altura">Caída de altura</option>
                    <option value="accidentes_con_maquinas">Accidentes con máquinas</option>
                    <option value="golpes_por_objetos">Golpes por objetos</option>
                    <option value="atrapamientos">Atrapamientos</option>
                    <option value="lesiones_herramientas_manuales">Lesiones por herramientas manuales</option>
                    <option value="exposicion_sustancias_peligrosas">Exposición a sustancias peligrosas</option>
                    <option value="accidentes_por_andamios_inseguros">Accidentes por andamios inseguros</option>
                    <option value="electrocuciones">Electrocuciones</option>
                    <option value="sobreesfuerzo">Sobreesfuerzo</option>
                    <option value="fatiga">Fatiga</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={nuevoAccidente.observaciones}
                    onChange={(e) => setNuevoAccidente(prev => ({...prev, observaciones: e.target.value}))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Observaciones adicionales..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setErrores({});
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Registrar Accidente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Observaciones Diarias */}
        {accidenteParaObservaciones && (
          <ObservacionesDiarias
            accidente={accidenteParaObservaciones}
            isOpen={mostrarObservaciones}
            onClose={() => {
              setMostrarObservaciones(false);
              setAccidenteParaObservaciones(null);
            }}
            onUpdate={(accidenteActualizado) => {
              actualizarAccidente(accidenteActualizado);
              setAccidenteParaObservaciones(accidenteActualizado); // Actualizar el estado local también
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GestionAccidentes;

// Inline componente para gestionar archivos de un accidente
function AccidenteArchivos({ accidenteId, onChanged }: { accidenteId: string; onChanged: () => void }) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [archivos, setArchivos] = React.useState<any[]>([]);
  const [preview, setPreview] = React.useState<{ src: string; nombre: string } | null>(null);

  React.useEffect(() => {
    (async () => {
      if (isSupabaseConfigured) {
        try {
          // Listar archivos desde Storage: accidentes/{id}
          const carpeta = `accidentes/${accidenteId}`;
          const lista = await (supabaseStorageService as any).listarCarpeta(carpeta);
          const mapped = (lista || []).map((f: any) => ({
            id: f.path,
            nombre: f.name,
            url: f.url,
            path: f.path,
            contenido: undefined,
          }));
          setArchivos(mapped);
          return;
        } catch {
          setArchivos([]);
          return;
        }
      }
      // Modo local: leer base64 embebido
      try {
        const lista = JSON.parse(localStorage.getItem('accidentes') || '[]');
        const acc = lista.find((a: any) => a.id === accidenteId);
        setArchivos(acc?.archivos || []);
      } catch {
        setArchivos([]);
      }
    })();
  }, [accidenteId, onChanged]);

  const handlePick = () => fileInputRef.current?.click();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await supabaseAccidentesService.agregarArchivo(accidenteId, {
        nombre: file.name,
        contenido: base64,
        tipo: file.type,
        tamano: file.size,
        categoria: 'medico',
      });
      onChanged();
    } catch (e) {
      alert('Error al subir archivo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (archivoId: string) => {
    if (!confirm('Eliminar archivo?')) return;
    try {
      if (isSupabaseConfigured) {
        // Intentar eliminar metadatos y luego el archivo físico
        try { await supabaseAccidentesService.eliminarArchivo(accidenteId, archivoId); } catch (_) {}
        try { await supabaseStorageService.eliminarArchivo(archivoId); } catch (_) {}
        onChanged();
        return;
      }
      await supabaseAccidentesService.eliminarArchivo(accidenteId, archivoId);
      onChanged();
    } catch (e) {
      alert('No se pudo eliminar el archivo');
    }
  };

  const handleDownload = (a: any) => {
    try {
      if (a.url) {
        const link = document.createElement('a');
        link.href = a.url;
        link.download = a.nombre || 'archivo';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      if (a.contenido) {
        downloadBase64File(a.contenido, a.nombre || 'archivo');
        return;
      }
      alert('Archivo no disponible');
    } catch {
      alert('No se pudo descargar el archivo');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button
        type="button"
        onClick={handlePick}
        disabled={isUploading}
        className={`px-2 py-1 text-xs rounded-md border ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
        title="Subir imagen (recetas, papeles del hospital)"
      >
        📎 Subir
      </button>
      {archivos.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto max-w-[260px]">
          {archivos.map((a) => (
            <div key={a.id} className="relative group">
              <img
                src={a.url || a.contenido}
                alt={a.nombre}
                className="w-12 h-12 object-cover rounded border cursor-pointer"
                onClick={() => setPreview({ src: a.url || a.contenido, nombre: a.nombre })}
                title={a.nombre}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleDownload(a)}
                  className="bg-blue-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center"
                  title="Descargar"
                >
                  ⬇
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center"
                  title="Eliminar"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-lg p-3 max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-800 truncate" title={preview.nombre}>{preview.nombre}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadBase64File(preview.src, preview.nombre || 'archivo')}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Descargar
                </button>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cerrar
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto">
              <img src={preview.src} alt={preview.nombre} className="w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
