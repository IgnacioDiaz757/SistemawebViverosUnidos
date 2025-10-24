'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Asociado, Contratista, Empleado } from '@/types/asociado';
import { historialMedicoDefault } from '@/types/medico';
import { generarUUID } from '@/utils/uuid';
import { registrarAsignacionInicialContratista, registrarCambioContratista } from '@/utils/historialContratistas';
import { migrarDatosArchivos, validarYCorregirAsociado } from '@/utils/migracionArchivos';
import { migrarHistorialMedico, validarYCorregirHistorialMedico } from '@/utils/migracionHistorialMedico';

interface AsociadosState {
  asociados: Asociado[];
  contratistas: Contratista[];
}

// Alias para compatibilidad
type EmpleadosState = AsociadosState;

type AsociadosAction = 
  | { type: 'SET_ASOCIADOS'; payload: Asociado[] }
  | { type: 'ADD_ASOCIADO'; payload: Asociado }
  | { type: 'UPDATE_ASOCIADO'; payload: Asociado }
  | { type: 'BAJA_ASOCIADO'; payload: { id: string; responsable: string } }
  | { type: 'ALTA_ASOCIADO'; payload: { id: string; responsable: string } }
  | { type: 'SET_CONTRATISTAS'; payload: Contratista[] }
  | { type: 'ADD_CONTRATISTA'; payload: Contratista }
  | { type: 'DELETE_CONTRATISTA'; payload: string }
  // Alias para compatibilidad temporal
  | { type: 'SET_EMPLEADOS'; payload: Empleado[] }
  | { type: 'ADD_EMPLEADO'; payload: Empleado }
  | { type: 'UPDATE_EMPLEADO'; payload: Empleado }
  | { type: 'BAJA_EMPLEADO'; payload: { id: string; responsable: string } };

// Alias para compatibilidad
type EmpleadosAction = AsociadosAction;

interface AsociadosContextType {
  state: AsociadosState;
  agregarAsociado: (asociado: Omit<Asociado, 'id' | 'activo' | 'fechaCarga'>) => void;
  editarAsociado: (asociado: Asociado) => void;
  editarAsociadoConCambioContratista: (asociado: Asociado, responsableCambio: string, motivo?: string) => void;
  darDeBajaAsociado: (id: string, responsable: string) => void;
  darDeAltaAsociado: (id: string, responsable: string) => void;
  obtenerAsociadosActivos: () => Asociado[];
  obtenerAsociadosDeBaja: () => Asociado[];
  obtenerAsociadosPorContratista: (contratista: string) => Asociado[];
  agregarContratista: (nombre: string) => void;
  eliminarContratista: (id: string) => { success: boolean; message: string };
  // Alias para compatibilidad temporal
  agregarEmpleado: (empleado: Omit<Empleado, 'id' | 'activo' | 'fechaCarga'>) => void;
  editarEmpleado: (empleado: Empleado) => void;
  editarEmpleadoConCambioContratista: (empleado: Empleado, responsableCambio: string, motivo?: string) => void;
  darDeBajaEmpleado: (id: string, responsable: string) => void;
  darDeAltaEmpleado: (id: string, responsable: string) => void;
  obtenerEmpleadosActivos: () => Empleado[];
  obtenerEmpleadosDeBaja: () => Empleado[];
  obtenerEmpleadosPorContratista: (contratista: string) => Empleado[];
}

// Alias para compatibilidad
type EmpleadosContextType = AsociadosContextType;

const AsociadosContext = createContext<AsociadosContextType | undefined>(undefined);

// Alias para compatibilidad
const EmpleadosContext = AsociadosContext;

const asociadosReducer = (state: AsociadosState, action: AsociadosAction): AsociadosState => {
  switch (action.type) {
    case 'SET_ASOCIADOS':
    case 'SET_EMPLEADOS': // Compatibilidad
      return { ...state, asociados: action.payload };
    case 'ADD_ASOCIADO':
    case 'ADD_EMPLEADO': // Compatibilidad
      const nuevosAsociados = [...state.asociados, action.payload];
      localStorage.setItem('asociados', JSON.stringify(nuevosAsociados));
      // Mantener también en 'empleados' para compatibilidad
      localStorage.setItem('empleados', JSON.stringify(nuevosAsociados));
      return { ...state, asociados: nuevosAsociados };
    case 'UPDATE_ASOCIADO':
    case 'UPDATE_EMPLEADO': // Compatibilidad
      const asociadosActualizados = state.asociados.map(emp => 
        emp.id === action.payload.id ? action.payload : emp
      );
      localStorage.setItem('asociados', JSON.stringify(asociadosActualizados));
      localStorage.setItem('empleados', JSON.stringify(asociadosActualizados));
      return { ...state, asociados: asociadosActualizados };
    case 'BAJA_ASOCIADO':
    case 'BAJA_EMPLEADO': // Compatibilidad
      const asociadosConBaja = state.asociados.map(emp => 
        emp.id === action.payload.id 
          ? { ...emp, activo: false, fechaBaja: new Date().toISOString().split('T')[0], responsableBaja: action.payload.responsable }
          : emp
      );
      localStorage.setItem('asociados', JSON.stringify(asociadosConBaja));
      localStorage.setItem('empleados', JSON.stringify(asociadosConBaja));
      return { ...state, asociados: asociadosConBaja };
    case 'ALTA_ASOCIADO':
      const asociadosConAlta = state.asociados.map(emp => 
        emp.id === action.payload.id 
          ? { ...emp, activo: true, fechaBaja: undefined, responsableBaja: undefined }
          : emp
      );
      localStorage.setItem('asociados', JSON.stringify(asociadosConAlta));
      localStorage.setItem('empleados', JSON.stringify(asociadosConAlta));
      return { ...state, asociados: asociadosConAlta };
    case 'SET_CONTRATISTAS':
      return { ...state, contratistas: action.payload };
    case 'ADD_CONTRATISTA':
      const nuevosContratistas = [...state.contratistas, action.payload];
      localStorage.setItem('contratistas', JSON.stringify(nuevosContratistas));
      return { ...state, contratistas: nuevosContratistas };
    case 'DELETE_CONTRATISTA':
      const contratistasActualizados = state.contratistas.filter(c => c.id !== action.payload);
      localStorage.setItem('contratistas', JSON.stringify(contratistasActualizados));
      return { ...state, contratistas: contratistasActualizados };
    default:
      return state;
  }
};

// Alias para compatibilidad
const empleadosReducer = asociadosReducer;

export const AsociadosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(asociadosReducer, {
    asociados: [],
    contratistas: [] // Empezar sin contratistas, se cargarán desde Supabase o localStorage
  });

  useEffect(() => {
    // Ejecutar migración de datos para archivos adjuntos
    migrarDatosArchivos();
    
    // Ejecutar migración para historial médico
    migrarHistorialMedico();
    
    // Datos de ejemplo removidos para producción
    
    // Cargar datos del localStorage al inicializar
    // Primero intentar cargar como 'asociados', luego como 'empleados' o 'asociados_mock' (compatibilidad)
    const asociadosGuardados = localStorage.getItem('asociados')
      || localStorage.getItem('empleados')
      || localStorage.getItem('asociados_mock');
    const contratistasGuardados = localStorage.getItem('contratistas');
    
    if (asociadosGuardados) {
      const asociadosData = JSON.parse(asociadosGuardados);
      // Validar y corregir cada asociado (archivos y historial médico)
      const asociadosValidados = asociadosData
        .map(validarYCorregirAsociado)
        .map(validarYCorregirHistorialMedico);
      dispatch({ type: 'SET_ASOCIADOS', payload: asociadosValidados });
    }
    
    if (contratistasGuardados) {
      dispatch({ type: 'SET_CONTRATISTAS', payload: JSON.parse(contratistasGuardados) });
    }
  }, []);


  const asegurarContratista = (nombre: string) => {
    const norm = (s: string) => (s || '').trim().toLowerCase();
    if (!nombre || !nombre.trim()) return;
    const existe = state.contratistas.some(c => norm(c.nombre) === norm(nombre));
    if (!existe) {
      const nuevoContratista: Contratista = {
        id: generarUUID(),
        nombre: nombre.trim(),
        activo: true,
        fecha_creacion: new Date().toISOString().split('T')[0],
      };
      dispatch({ type: 'ADD_CONTRATISTA', payload: nuevoContratista });
    }
  };

  const agregarAsociado = (asociadoData: Omit<Asociado, 'id' | 'activo' | 'fechaCarga'>) => {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaIngresoDetectada = (asociadoData as any).fecha_ingreso || (asociadoData as any).fechaIngreso || hoy;
    const nuevoAsociado: Asociado = {
      ...asociadoData,
      id: generarUUID(),
      activo: true,
      fecha_carga: hoy, // Fecha actual en formato YYYY-MM-DD
      // Campos espejo para máxima compatibilidad entre componentes antiguos/nuevos
      // (algunos usan snake_case, otros camelCase)
      ...(typeof (asociadoData as any).fecha_carga === 'undefined' ? { fecha_carga: hoy } : {}),
      ...(typeof (asociadoData as any).fechaIngreso === 'undefined' ? { fechaIngreso: fechaIngresoDetectada } : {}),
      ...(typeof (asociadoData as any).fecha_ingreso === 'undefined' ? { fecha_ingreso: fechaIngresoDetectada } : {}),
      archivos_adjuntos: (asociadoData as any).archivos_adjuntos || [], // Asegurar que existe el campo
      historial_medico: (asociadoData as any).historial_medico || historialMedicoDefault // Inicializar historial médico
    };
    
    // Asegurar que el contratista exista en el catálogo
    if (nuevoAsociado.contratista) {
      asegurarContratista(nuevoAsociado.contratista as unknown as string);
    }

    // Registrar asignación inicial de contratista
    registrarAsignacionInicialContratista(nuevoAsociado);
    
    dispatch({ type: 'ADD_ASOCIADO', payload: nuevoAsociado });
  };

  // Alias para compatibilidad
  const agregarEmpleado = agregarAsociado;

  const editarAsociado = (asociado: Asociado) => {
    dispatch({ type: 'UPDATE_ASOCIADO', payload: asociado });
  };

  // Alias para compatibilidad
  const editarEmpleado = editarAsociado;

  const editarAsociadoConCambioContratista = (asociado: Asociado, responsableCambio: string, motivo?: string) => {
    // Buscar el asociado anterior para comparar contratistas
    const asociadoAnterior = state.asociados.find(emp => emp.id === asociado.id);
    
    if (asociadoAnterior && asociadoAnterior.contratista !== asociado.contratista) {
      // Asegurar que el nuevo contratista exista en el catálogo
      if (asociado.contratista) {
        asegurarContratista(asociado.contratista as unknown as string);
      }
      // Registrar el cambio de contratista
      registrarCambioContratista(
        asociado,
        asociadoAnterior.contratista,
        asociado.contratista,
        responsableCambio,
        motivo
      );
    }
    
    dispatch({ type: 'UPDATE_ASOCIADO', payload: asociado });
  };

  // Alias para compatibilidad
  const editarEmpleadoConCambioContratista = editarAsociadoConCambioContratista;

  const darDeBajaAsociado = (id: string, responsable: string) => {
    dispatch({ type: 'BAJA_ASOCIADO', payload: { id, responsable } });
  };

  const darDeAltaAsociado = (id: string, responsable: string) => {
    dispatch({ type: 'ALTA_ASOCIADO', payload: { id, responsable } });
  };

  // Alias para compatibilidad
  const darDeBajaEmpleado = darDeBajaAsociado;
  const darDeAltaEmpleado = darDeAltaAsociado;

  const obtenerAsociadosActivos = () => {
    return state.asociados
      .filter(emp => emp.activo)
      .sort((a, b) => {
        const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase();
        const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
      });
  };

  // Alias para compatibilidad
  const obtenerEmpleadosActivos = obtenerAsociadosActivos;

  const obtenerAsociadosDeBaja = () => {
    return state.asociados
      .filter(emp => !emp.activo)
      .sort((a, b) => {
        const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase();
        const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase();
        return nombreA.localeCompare(nombreB, 'es');
      });
  };

  // Alias para compatibilidad
  const obtenerEmpleadosDeBaja = obtenerAsociadosDeBaja;

  const obtenerAsociadosPorContratista = (contratista: string) => {
    const asociadosFiltrados = !contratista 
      ? state.asociados 
      : state.asociados.filter(emp => emp.contratista === contratista);
    
    return asociadosFiltrados.sort((a, b) => {
      const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase();
      const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase();
      return nombreA.localeCompare(nombreB, 'es');
    });
  };

  // Alias para compatibilidad
  const obtenerEmpleadosPorContratista = obtenerAsociadosPorContratista;

  const agregarContratista = (nombre: string) => {
    const nuevoContratista: Contratista = {
      id: Date.now().toString(),
      nombre,
      activo: true,
      fecha_creacion: new Date().toISOString().split('T')[0],
    };
    dispatch({ type: 'ADD_CONTRATISTA', payload: nuevoContratista });
  };

  const eliminarContratista = (id: string): { success: boolean; message: string } => {
    // Buscar el contratista
    const contratista = state.contratistas.find(c => c.id === id);
    if (!contratista) {
      return { success: false, message: 'Contratista no encontrado' };
    }

    // Verificar si hay asociados activos asignados a este contratista
    const asociadosAsignados = state.asociados.filter(
      asociado => asociado.contratista === contratista.nombre && asociado.activo
    );

    if (asociadosAsignados.length > 0) {
      return { 
        success: false, 
        message: `No se puede eliminar el contratista "${contratista.nombre}" porque tiene ${asociadosAsignados.length} asociado(s) activo(s) asignado(s). Primero debe reasignar o dar de baja a estos asociados.` 
      };
    }

    // Si no hay asociados activos, proceder con la eliminación
    dispatch({ type: 'DELETE_CONTRATISTA', payload: id });
    return { 
      success: true, 
      message: `Contratista "${contratista.nombre}" eliminado exitosamente` 
    };
  };

  return (
    <AsociadosContext.Provider value={{
      state,
      agregarAsociado,
      editarAsociado,
      editarAsociadoConCambioContratista,
      darDeBajaAsociado,
      darDeAltaAsociado,
      obtenerAsociadosActivos,
      obtenerAsociadosDeBaja,
      obtenerAsociadosPorContratista,
      agregarContratista,
      eliminarContratista,
      // Aliases para compatibilidad
      agregarEmpleado,
      editarEmpleado,
      editarEmpleadoConCambioContratista,
      darDeBajaEmpleado,
      darDeAltaEmpleado,
      obtenerEmpleadosActivos,
      obtenerEmpleadosDeBaja,
      obtenerEmpleadosPorContratista
    }}>
      {children}
    </AsociadosContext.Provider>
  );
};

export const useAsociados = () => {
  const context = useContext(AsociadosContext);
  if (context === undefined) {
    throw new Error('useAsociados debe ser usado dentro de un AsociadosProvider');
  }
  return context;
};

// Alias para compatibilidad
export const useEmpleados = () => {
  const context = useContext(EmpleadosContext);
  if (context === undefined) {
    throw new Error('useEmpleados debe ser usado dentro de un EmpleadosProvider o AsociadosProvider');
  }
  return context;
};

// Alias para compatibilidad
export const EmpleadosProvider = AsociadosProvider;
