'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Asociado } from '@/types/asociado';
import ModalEditarEmpleado from './ModalEditarEmpleado';
import GestionRopa from './GestionRopa';
import HistorialContratistas from './HistorialContratistas';
import GestionArchivos from './GestionArchivos';
import ResumenMedico from './ResumenMedico';
import { downloadBase64File } from '@/utils/fileUtils';
import { useServicios } from '@/context/ServiciosContext';
import { supabaseHistorialContratistasService } from '@/services/supabaseHistorialContratistasService';
import AlertBanner from '@/components/AlertBanner';
import { useEmpleados } from '@/context/EmpleadosContext';
import { isSupabaseConfigured } from '@/lib/supabase';

interface ListaEmpleadosProps {
  tipo: 'activos' | 'baja';
}

const ListaEmpleados: React.FC<ListaEmpleadosProps> = ({ tipo }) => {
  const { user } = useAuth();
  const { darDeBajaEmpleado, darDeAltaEmpleado } = useEmpleados();
  const [filtroContratista, setFiltroContratista] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [empleadoParaBaja, setEmpleadoParaBaja] = useState<string | null>(null);
  const [empleadoParaAlta, setEmpleadoParaAlta] = useState<string | null>(null);
  const [responsableBaja, setResponsableBaja] = useState('');
  const [fechaBajaManual, setFechaBajaManual] = useState('');
  const [responsableAlta, setResponsableAlta] = useState('');
  const [contratistaAlta, setContratistaAlta] = useState('');
  const [empleadoParaEditar, setEmpleadoParaEditar] = useState<Asociado | null>(null);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [empleadoParaRopa, setEmpleadoParaRopa] = useState<Asociado | null>(null);
  const [modalRopaAbierto, setModalRopaAbierto] = useState(false);
  const [empleadoParaHistorial, setEmpleadoParaHistorial] = useState<Asociado | null>(null);
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [empleadoParaArchivos, setEmpleadoParaArchivos] = useState<Asociado | null>(null);
  const [modalArchivosAbierto, setModalArchivosAbierto] = useState(false);

  const [contratistas, setContratistas] = useState<{ id: string; nombre: string }[]>([]);
  const [lista, setLista] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const { asociados: asociadosService, contratistas: contratistasService } = useServicios();

  // Funciones para manejar el scroll horizontal
  const checkScrollButtons = () => {
    if (tableScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableScrollRef.current;
      const hasHorizontalScroll = scrollWidth > clientWidth;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
      
      // Si no hay scroll horizontal, habilitar ambas flechas para que se vean activas
      if (!hasHorizontalScroll) {
        setCanScrollLeft(false);
        setCanScrollRight(false);
      }
    }
  };

  const scrollLeft = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // cargar contratistas para filtros y para alta
    contratistasService
      .listar()
      .then(setContratistas)
      .catch(() => setContratistas([]));
  }, []);

  useEffect(() => {
    // cargar asociados desde Supabase según tipo
    const cargar = async () => {
      setCargando(true);
      try {
        // Primero cargar contratistas si no están cargados
        let contratistasData = contratistas;
        if (!contratistasData || contratistasData.length === 0) {
          contratistasData = await contratistasService.listar();
          setContratistas(contratistasData);
        }

        let datos;
        if (tipo === 'activos') {
          datos = await asociadosService.obtenerAsociadosActivos();
        } else {
          datos = await asociadosService.obtenerAsociadosBaja();
        }
        
        // Helper para resolver nombre de contratista desde múltiples formas
        const porId: Record<string, string> = Object.fromEntries((contratistasData || []).map(c => [c.id, c.nombre]));
        
        const getNombreContratista = (emp: any): string => {
          const direct = emp?.contratista;
          if (typeof direct === 'string') return direct;
          if (direct && typeof direct === 'object' && direct.nombre) return direct.nombre;
          const cid = emp?.contratista_id || emp?.contratistaId || emp?.id_contratista;
          if (cid && porId[cid]) return porId[cid];
          return '';
        };
        const datosTransformados = (datos || []).map((emp: any) => ({
          ...emp,
          contratista: getNombreContratista(emp),
        }));
        
        setLista(datosTransformados);
      } catch (e) {
        console.error('Error cargando datos:', e);
        setLista([]);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [tipo, contratistasService, asociadosService]);

  // Cuando cambia la lista de contratistas, re-normalizar nombres en la lista existente
  useEffect(() => {
    if (!lista || lista.length === 0) return;
    const porId: Record<string, string> = Object.fromEntries((contratistas || []).map(c => [c.id, c.nombre]));
    const getNombreContratista = (emp: any): string => {
      const direct = emp?.contratista;
      if (typeof direct === 'string') return direct;
      if (direct && typeof direct === 'object' && direct.nombre) return direct.nombre;
      const cid = emp?.contratista_id || emp?.contratistaId || emp?.id_contratista;
      if (cid && porId[cid]) return porId[cid];
      return '';
    };
    const datosTransformados = (lista || []).map((emp: any) => ({
      ...emp,
      contratista: getNombreContratista(emp),
    }));
    setLista(datosTransformados);
  }, [contratistas]);

  const empleados = useMemo(() => {
    let base = [...lista];

    if (filtroContratista) {
      const norm = (s: string) => String(s || '').trim().toLowerCase();
      const nombreToId: Record<string, string> = Object.fromEntries(
        (contratistas || []).map(c => [norm(c.nombre), c.id])
      );
      const selectedId = nombreToId[norm(filtroContratista)];
      base = base.filter((emp: any) => {
        const nameMatch = norm(emp.contratista) === norm(filtroContratista);
        const empId = emp?.contratista_id || emp?.id_contratista || emp?.contratistaId || emp?.contratista?.id;
        const idMatch = selectedId && String(empId || '').trim().toLowerCase() === String(selectedId).trim().toLowerCase();
        return nameMatch || idMatch;
      });
    }

    if (busqueda) {
      const q = String(busqueda || '').toLowerCase();
      base = base.filter((emp) =>
        String(emp.nombre || '').toLowerCase().includes(q) ||
        String(emp.apellido || '').toLowerCase().includes(q) ||
        String(emp.dni || '').toLowerCase().includes(q) ||
        String(emp.legajo || '').toLowerCase().includes(q) ||
        String(emp.nro_socio || emp.nroSocio || '').toLowerCase().includes(q)
      );
    }

    // Ordenar alfabéticamente por nombre completo
    base.sort((a, b) => {
      const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase();
      const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase();
      return nombreA.localeCompare(nombreB, 'es');
    });

    return base as any[];
  }, [lista, filtroContratista, busqueda]);

  // Verificar botones de scroll cuando cambian los empleados
  useEffect(() => {
    // Usar setTimeout para asegurar que el DOM se haya actualizado
    const timeoutId = setTimeout(() => {
      checkScrollButtons();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [empleados]);

  // Verificar botones al montar el componente
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkScrollButtons();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const refrescar = async () => {
    try {
      // Asegurar que tenemos contratistas cargados
      let contratistasData = contratistas;
      if (!contratistasData || contratistasData.length === 0) {
        contratistasData = await contratistasService.listar();
        setContratistas(contratistasData);
      }
      
      let datos;
      if (tipo === 'activos') {
        datos = await asociadosService.obtenerAsociadosActivos();
      } else {
        datos = await asociadosService.obtenerAsociadosBaja();
      }
      
      // Normalizar contratista usando múltiples formas
      const porId: Record<string, string> = Object.fromEntries((contratistasData || []).map(c => [c.id, c.nombre]));
      
      const getNombreContratista = (emp: any): string => {
        const direct = emp?.contratista;
        if (typeof direct === 'string') return direct;
        if (direct && typeof direct === 'object' && direct.nombre) return direct.nombre;
        const cid = emp?.contratista_id || emp?.contratistaId || emp?.id_contratista;
        if (cid && porId[cid]) return porId[cid];
        return '';
      };
      const datosTransformados = (datos || []).map((emp: any) => ({
        ...emp,
        contratista: getNombreContratista(emp),
      }));
      
      setLista(datosTransformados);
    } catch (error: any) {
      console.error(`Error al refrescar lista de ${tipo}:`, error);
    }
  };

  const handleDarDeBaja = async (empleadoId: string) => {
    if (!responsableBaja.trim()) {
      setBanner({ type: 'warning', message: 'Debe ingresar el nombre del responsable de la baja' });
      return;
    }
    // Validación de fecha: requerida y no futura
    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    if (!fechaBajaManual) {
      setBanner({ type: 'warning', message: 'Debe seleccionar la fecha de baja' });
      return;
    }
    if (fechaBajaManual > hoyStr) {
      setBanner({ type: 'warning', message: 'La fecha de baja no puede ser futura' });
      return;
    }
    try {
      console.log('Iniciando proceso de baja para asociado:', empleadoId);
      // En este paso solo capturamos la fecha en UI; el servicio se ajustará en el siguiente paso
      await asociadosService.darDeBajaAsociado(empleadoId, responsableBaja.trim(), fechaBajaManual);
      console.log('Asociado dado de baja exitosamente');

      // Sincronizar estado del contexto para que /reportes refleje la baja
      try {
        darDeBajaEmpleado(empleadoId, responsableBaja.trim());
      } catch (e) {
        console.warn('No se pudo sincronizar baja en contexto, se continúa con refresco de lista.', e);
      }
      
      setEmpleadoParaBaja(null);
      setResponsableBaja('');
      setFechaBajaManual('');
      
      console.log('Refrescando lista...');
      await refrescar();
      console.log('Lista refrescada');
      
      setBanner({ type: 'success', message: 'Asociado dado de baja exitosamente. El asociado ya no aparece en la lista de activos y puede ser encontrado en la sección "Asociados de Baja".' });
    } catch (error: any) {
      console.error('Error al dar de baja el asociado:');
      console.error('- Tipo de error:', typeof error);
      console.error('- Error original:', error);
      console.error('- Error message:', error?.message);
      console.error('- Error code:', error?.code);
      console.error('- Error details:', error?.details);
      console.error('- Error hint:', error?.hint);
      console.error('- Error stack:', error?.stack);
      console.error('- Error JSON:', JSON.stringify(error, null, 2));
      
      const errorMessage = error instanceof Error ? error.message : 
                          error?.message || 
                          error?.details || 
                          error?.hint || 
                          'Error desconocido';
      
      setBanner({ type: 'error', message: `Error al dar de baja el asociado: ${errorMessage}` });
    }
  };

  const handleDarDeAlta = async (empleadoId: string) => {
    if (!responsableAlta.trim()) {
      setBanner({ type: 'warning', message: 'Debe ingresar el nombre del responsable del alta' });
      return;
    }
    if (!contratistaAlta.trim()) {
      setBanner({ type: 'warning', message: 'Debe seleccionar un contratista para el alta' });
      return;
    }
    const contratista = contratistas.find((c) => c.nombre === contratistaAlta);
    await asociadosService.darDeAltaAsociado(empleadoId, responsableAlta.trim(), contratista?.id);
    // Sincronizar en estado global para que el dashboard y reportes lo reflejen
    try {
      darDeAltaEmpleado(empleadoId, responsableAlta.trim());
    } catch (e) {}
    setEmpleadoParaAlta(null);
    setResponsableAlta('');
    setContratistaAlta('');
    await refrescar();
    setBanner({ type: 'success', message: 'Asociado dado de alta exitosamente' });
  };

  const handleEditarEmpleado = (empleado: any) => {
    setEmpleadoParaEditar(empleado as Asociado);
    setModalEditarAbierto(true);
  };

  const handleCerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setEmpleadoParaEditar(null);
  };

  const handleEditarExitoso = () => {
    // luego refrescar lista si el modal edita via Supabase
    refrescar();
  };

  const handleDescargarDni = (empleado: any) => {
    const fotoDni = empleado.foto_dni || empleado.fotoDni;
    const nombreArchivo = empleado.nombre_archivo_dni || empleado.nombreArchivoDni || 'dni.pdf';
    if (!fotoDni) {
      setBanner({ type: 'info', message: 'Este asociado no tiene una foto de DNI cargada' });
      return;
    }
    try {
      downloadBase64File(fotoDni, nombreArchivo);
    } catch (error) {
      console.error('Error al descargar foto DNI:', error);
      setBanner({ type: 'error', message: 'Error al descargar la foto del DNI' });
    }
  };

  const handleGestionarRopa = (empleado: any) => {
    setEmpleadoParaRopa(empleado as Asociado);
    setModalRopaAbierto(true);
  };

  const handleCerrarModalRopa = () => {
    setModalRopaAbierto(false);
    setEmpleadoParaRopa(null);
  };

  const handleVerHistorial = (empleado: any) => {
    setEmpleadoParaHistorial(empleado as Asociado);
    setModalHistorialAbierto(true);
  };

  const handleVerArchivos = (empleado: any) => {
    setEmpleadoParaArchivos(empleado as Asociado);
    setModalArchivosAbierto(true);
  };

  const handleCerrarModalHistorial = () => {
    setModalHistorialAbierto(false);
    setEmpleadoParaHistorial(null);
  };

  const handleCerrarModalArchivos = () => {
    setModalArchivosAbierto(false);
    setEmpleadoParaArchivos(null);
  };

  const formatearFecha = (fecha: string) => {
    if (!fecha) return '';
    const raw = String(fecha);
    // Si ya viene como YYYY-MM-DD, devolver tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    // Si es ISO con tiempo, convertir a fecha local YYYY-MM-DD
    try {
      const d = new Date(raw);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    } catch {
      return raw.split('T')[0] || raw;
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Asociados {tipo === 'activos' ? 'Activos' : 'Dados de Baja'}
        </h2>
        <div className="text-sm text-gray-600">
          Total: {empleados.length} asociados
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro por Contratista */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Contratista
            </label>
            <select
              value={filtroContratista}
              onChange={(e) => setFiltroContratista(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los contratistas</option>
              {contratistas.map(contratista => (
                <option key={contratista.id} value={contratista.nombre}>
                  {contratista.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, apellido, DNI, legajo..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botones de filtro rápido */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => {
              setFiltroContratista('');
              setBusqueda('');
            }}
            className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Lista de Asociados */}
      {banner && (
        <div className="mb-4">
          <AlertBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-gray-500">Cargando...</div>
        ) : empleados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron asociados {tipo === 'activos' ? 'activos' : 'dados de baja'} con los filtros aplicados.
          </div>
        ) : (
          <div className="relative">
            {/* Flechas de navegación horizontal fijas */}
            <div className="fixed left-4 right-4 top-1/2 transform -translate-y-1/2 z-50 pointer-events-none">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <button
                  onClick={scrollLeft}
                  disabled={!canScrollLeft}
                  className={`pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 shadow-lg ${
                    canScrollLeft
                      ? 'border-gray-400 text-gray-600 hover:bg-gray-100 hover:border-gray-500 bg-white'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <button
                  onClick={scrollRight}
                  disabled={!canScrollRight}
                  className={`pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 shadow-lg ${
                    canScrollRight
                      ? 'border-gray-400 text-gray-600 hover:bg-gray-100 hover:border-gray-500 bg-white'
                      : 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Tabla con scroll horizontal */}
            <div 
              ref={tableScrollRef}
              className="overflow-x-auto"
              onScroll={checkScrollButtons}
            >
              <table className="min-w-[1200px] divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Asociado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Documentos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Trabajo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Contratista
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    DNI
                  </th>
                  {tipo === 'baja' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Baja
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {empleados.map((empleado: any) => (
                  <tr key={empleado.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {empleado.nombre} {empleado.apellido}
                          {(empleado.legajo || empleado.nro_socio || empleado.nroSocio) && (
                            <span className="text-gray-600 font-normal">
                              {` `}
                              {empleado.legajo ? `(Legajo: ${empleado.legajo}` : ''}
                              {empleado.legajo && (empleado.nro_socio || empleado.nroSocio) ? ' · ' : ''}
                              {empleado.nro_socio || empleado.nroSocio ? `Socio: ${empleado.nro_socio || empleado.nroSocio}` : ''}
                              {empleado.legajo ? ')' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">DNI: {empleado.dni}</div>
                      <div className="text-sm text-gray-500">CUIL: {empleado.cuil}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{empleado.telefono}</div>
                      <div className="text-sm text-gray-500">{empleado.domicilio}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Ingreso: {formatearFecha(empleado.fecha_ingreso || empleado.fechaIngreso)}
                      </div>
                      {/* Se omite mostrar fecha de carga; solo se muestra el día de ingreso */}
                      <div className="text-sm text-gray-500 mt-1">
                        {empleado.monotributo ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Monotributo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Sin monotributo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {empleado?.contratista?.nombre || empleado?.contratista || ''}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {(empleado.foto_dni || empleado.fotoDni) ? (
                        <button
                          onClick={() => handleDescargarDni(empleado)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white transition-colors"
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
                          title="Descargar foto del DNI"
                        >
                          📄 Descargar DNI
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Sin foto</span>
                      )}
                    </td>
                    {tipo === 'baja' && (
                      <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatearFecha(empleado.fecha_baja_manual || empleado.fecha_baja)}
                    </div>
                        <div className="text-sm text-gray-500">
                          Responsable: {/* dado_baja_por mostrará datos si traemos join */}
                        </div>
                      </td>
                    )}

                    {/* Columna de Acciones */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        {tipo === 'activos' ? (
                          <>
                            <button
                              onClick={() => handleEditarEmpleado(empleado)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleGestionarRopa(empleado)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              👕 Ropa
                            </button>
                            <button
                              onClick={() => handleVerHistorial(empleado)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                              📋 Historial Contratistas
                            </button>
                            <button
                              onClick={() => handleVerArchivos(empleado)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              📁 Archivos
                            </button>
                            <a
                              href={`/historial-medico/${empleado.id}`}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                              🩺 Historial Médico
                            </a>
                            <button
                              onClick={() => setEmpleadoParaBaja(empleado.id)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              🗑️ Dar de Baja
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEmpleadoParaAlta(empleado.id);
                                setContratistaAlta(empleado?.contratista?.nombre || '');
                              }}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white"
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
                              ↩️ Dar de Alta
                            </button>
                            <button
                              onClick={() => handleVerHistorial(empleado)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                            >
                              📋 Historial Contratistas
                            </button>
                            <button
                              onClick={() => handleVerArchivos(empleado)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                              📁 Archivos
                            </button>
                            <a
                              href={`/historial-medico/${empleado.id}`}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                              🩺 Historial Médico
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal para dar de baja */}
      {empleadoParaBaja && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md md:max-w-lg shadow-lg rounded-md bg-white mx-4">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Baja de Asociado
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  ¿Está seguro que desea dar de baja a este asociado?<br/>
                  <span className="text-red-600 font-medium">El asociado será movido a la sección "Asociados de Baja" y ya no aparecerá en la lista de activos.</span>
                </p>
                <div className="grid grid-cols-1 gap-3 text-left">
                <input
                  type="text"
                  value={responsableBaja}
                  onChange={(e) => setResponsableBaja(e.target.value)}
                  placeholder="Nombre del responsable de la baja"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de baja
                  </label>
                  <input
                    type="date"
                    value={fechaBajaManual}
                    onChange={(e) => setFechaBajaManual(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDarDeBaja(empleadoParaBaja)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setEmpleadoParaBaja(null);
                    setResponsableBaja('');
                    setFechaBajaManual('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para dar de alta */}
      {empleadoParaAlta && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md md:max-w-lg shadow-lg rounded-md bg-white mx-4">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Alta de Asociado
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  ¿Está seguro que desea dar de alta a este asociado? Volverá a estar activo en el sistema.
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={responsableAlta}
                    onChange={(e) => setResponsableAlta(e.target.value)}
                    placeholder="Nombre del responsable del alta"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{'--tw-ring-color': '#C70CB9'}}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#C70CB9';
                      e.target.style.boxShadow = '0 0 0 3px rgba(199, 12, 185, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contratista *
                    </label>
                    <select
                      value={contratistaAlta}
                      onChange={(e) => setContratistaAlta(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{'--tw-ring-color': '#C70CB9'}}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#C70CB9';
                      e.target.style.boxShadow = '0 0 0 3px rgba(199, 12, 185, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.boxShadow = 'none';
                    }}
                    >
                      <option value="">Seleccionar contratista...</option>
                      {contratistas.map(contratista => (
                        <option key={contratista.id} value={contratista.nombre}>
                          {contratista.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => handleDarDeAlta(empleadoParaAlta)}
                  className="px-4 py-2 text-white text-base font-medium rounded-md w-24 mr-2 focus:outline-none focus:ring-2"
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
                  Confirmar
                </button>
                <button
                  onClick={() => {
                    setEmpleadoParaAlta(null);
                    setResponsableAlta('');
                    setContratistaAlta('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar asociado */}
      <ModalEditarEmpleado
        empleado={empleadoParaEditar}
        isOpen={modalEditarAbierto}
        onClose={handleCerrarModalEditar}
        onSuccess={handleEditarExitoso}
      />

      {/* Modal para gestionar ropa */}
      <GestionRopa
        empleado={empleadoParaRopa}
        isOpen={modalRopaAbierto}
        onClose={handleCerrarModalRopa}
      />

      {/* Modal para ver historial de contratistas */}
      <HistorialContratistas
        empleado={empleadoParaHistorial}
        isOpen={modalHistorialAbierto}
        onClose={handleCerrarModalHistorial}
      />

      {/* Modal para gestión de archivos */}
      {empleadoParaArchivos && (
        <GestionArchivos
          asociado={empleadoParaArchivos}
          isOpen={modalArchivosAbierto}
          onClose={handleCerrarModalArchivos}
          onUpdate={() => {}}
        />
      )}
    </div>
  );
};

export default ListaEmpleados;
