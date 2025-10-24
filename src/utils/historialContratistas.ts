import { CambioContratista, HistorialContratista, AsignacionInicialContratista, SnapshotRopaEmpleado, SnapshotEntregaRopa } from '@/types/historialContratista';
import { Asociado, Empleado } from '@/types/asociado';
import { FichaRopa } from '@/types/ropa';
import { generarIdUnico } from '@/utils/uuid';

/**
 * Crea un snapshot de la ropa entregada a un empleado
 */
export const crearSnapshotRopaEmpleado = (empleadoId: string, contratista: string): SnapshotRopaEmpleado | null => {
  try {
    // Obtener las fichas de ropa del localStorage
    const fichasRopa = localStorage.getItem('fichasRopa');
    if (!fichasRopa) return null;

    const fichas: FichaRopa[] = JSON.parse(fichasRopa);
    const fichaEmpleado = fichas.find(f => f.empleadoId === empleadoId);
    
    if (!fichaEmpleado || fichaEmpleado.entregas.length === 0) {
      return null;
    }

    // Convertir entregas a formato snapshot
    const entregasSnapshot: SnapshotEntregaRopa[] = fichaEmpleado.entregas.map(entrega => ({
      id: entrega.id,
      elementoRopaId: entrega.elementoRopaId,
      nombreElemento: entrega.nombreElemento,
      categoria: entrega.categoria,
      talla: entrega.talla,
      cantidad: entrega.cantidad,
      fechaEntrega: entrega.fechaEntrega,
      observaciones: entrega.observaciones,
      entregadoPor: entrega.entregadoPor
    }));

    // Calcular total de elementos
    const totalElementos = entregasSnapshot.reduce((total, entrega) => total + entrega.cantidad, 0);

    return {
      fechaSnapshot: new Date().toISOString().split('T')[0],
      contratista,
      entregas: entregasSnapshot,
      totalElementos
    };
  } catch (error) {
    console.error('Error al crear snapshot de ropa:', error);
    return null;
  }
};

/**
 * Registra un cambio de contratista para un empleado
 */
export const registrarCambioContratista = (
  empleado: Empleado,
  contratistaAnterior: string,
  contratistaNuevo: string,
  responsableCambio: string,
  motivo?: string
): void => {
  if (contratistaAnterior === contratistaNuevo) {
    return; // No hay cambio real
  }

  // Crear snapshot de la ropa entregada con el contratista anterior
  const snapshotRopa = crearSnapshotRopaEmpleado(empleado.id, contratistaAnterior);

  const nuevoCambio: CambioContratista = {
    id: generarIdUnico(),
    empleadoId: empleado.id,
    contratistaAnterior,
    contratistaNuevo,
    fechaCambio: new Date().toISOString().split('T')[0],
    motivo,
    responsableCambio,
    ropaEntregadaAnterior: snapshotRopa || undefined
  };

  // Obtener historial existente
  const historialExistente = obtenerHistorialContratista(empleado.id);
  
  if (historialExistente) {
    // Agregar el nuevo cambio al historial existente
    historialExistente.cambios.push(nuevoCambio);
    historialExistente.ultimaActualizacion = new Date().toISOString();
    guardarHistorialContratista(historialExistente);
  } else {
    // Crear nuevo historial
    const nuevoHistorial: HistorialContratista = {
      empleadoId: empleado.id,
      cambios: [nuevoCambio],
      ultimaActualizacion: new Date().toISOString()
    };
    guardarHistorialContratista(nuevoHistorial);
  }
};

/**
 * Registra la asignación inicial de contratista (cuando se crea el empleado)
 */
export const registrarAsignacionInicialContratista = (empleado: Empleado): void => {
  const asignacionInicial: AsignacionInicialContratista = {
    empleadoId: empleado.id,
    contratista: empleado.contratista,
    fechaAsignacion: (empleado as any).fechaCarga || (empleado as any).fecha_carga,
    esAsignacionInicial: true
  };

  // Verificar si ya existe una asignación inicial
  const historialExistente = obtenerHistorialContratista(empleado.id);
  if (!historialExistente) {
    // Crear historial con asignación inicial
    const nuevoHistorial: HistorialContratista = {
      empleadoId: empleado.id,
      cambios: [],
      ultimaActualizacion: new Date().toISOString()
    };
    
    // Guardar tanto el historial como la asignación inicial por separado
    guardarHistorialContratista(nuevoHistorial);
    guardarAsignacionInicial(asignacionInicial);
  }
};

/**
 * Obtiene el historial completo de contratistas de un empleado
 */
export const obtenerHistorialContratista = (empleadoId: string): HistorialContratista | null => {
  const historiales = localStorage.getItem('historialContratistas');
  if (!historiales) return null;

  const historialesArray: HistorialContratista[] = JSON.parse(historiales);
  return historialesArray.find(h => h.empleadoId === empleadoId) || null;
};

/**
 * Obtiene la asignación inicial de un empleado
 */
export const obtenerAsignacionInicial = (empleadoId: string): AsignacionInicialContratista | null => {
  const asignaciones = localStorage.getItem('asignacionesIniciales');
  if (!asignaciones) return null;

  const asignacionesArray: AsignacionInicialContratista[] = JSON.parse(asignaciones);
  return asignacionesArray.find(a => a.empleadoId === empleadoId) || null;
};

/**
 * Obtiene el historial completo (asignación inicial + cambios) de un empleado
 */
export const obtenerHistorialCompleto = (empleado: Empleado): {
  asignacionInicial: AsignacionInicialContratista | null;
  cambios: CambioContratista[];
  contratistaActual: string;
} => {
  const asignacionInicial = obtenerAsignacionInicial(empleado.id);
  const historial = obtenerHistorialContratista(empleado.id);

  return {
    asignacionInicial,
    cambios: historial?.cambios || [],
    contratistaActual: empleado.contratista
  };
};

/**
 * Guarda el historial de contratistas en localStorage
 */
const guardarHistorialContratista = (historial: HistorialContratista): void => {
  const historiales = localStorage.getItem('historialContratistas');
  let historialesArray: HistorialContratista[] = historiales ? JSON.parse(historiales) : [];

  const indiceExistente = historialesArray.findIndex(h => h.empleadoId === historial.empleadoId);
  
  if (indiceExistente >= 0) {
    historialesArray[indiceExistente] = historial;
  } else {
    historialesArray.push(historial);
  }

  localStorage.setItem('historialContratistas', JSON.stringify(historialesArray));
};

/**
 * Guarda la asignación inicial en localStorage
 */
const guardarAsignacionInicial = (asignacion: AsignacionInicialContratista): void => {
  const asignaciones = localStorage.getItem('asignacionesIniciales');
  let asignacionesArray: AsignacionInicialContratista[] = asignaciones ? JSON.parse(asignaciones) : [];

  // Verificar que no exista ya una asignación para este empleado
  const existeAsignacion = asignacionesArray.some(a => a.empleadoId === asignacion.empleadoId);
  
  if (!existeAsignacion) {
    asignacionesArray.push(asignacion);
    localStorage.setItem('asignacionesIniciales', JSON.stringify(asignacionesArray));
  }
};

/**
 * Obtiene estadísticas del historial de contratistas
 */
export const obtenerEstadisticasHistorial = (empleadoId: string): {
  totalCambios: number;
  contratistasPorLosQuePaso: string[];
  ultimoCambio?: CambioContratista;
} => {
  const historial = obtenerHistorialContratista(empleadoId);
  const asignacionInicial = obtenerAsignacionInicial(empleadoId);

  if (!historial && !asignacionInicial) {
    return {
      totalCambios: 0,
      contratistasPorLosQuePaso: []
    };
  }

  const cambios = historial?.cambios || [];
  const contratistas = new Set<string>();

  // Agregar contratista inicial
  if (asignacionInicial) {
    contratistas.add(asignacionInicial.contratista);
  }

  // Agregar contratistas de los cambios
  cambios.forEach(cambio => {
    contratistas.add(cambio.contratistaAnterior);
    contratistas.add(cambio.contratistaNuevo);
  });

  return {
    totalCambios: cambios.length,
    contratistasPorLosQuePaso: Array.from(contratistas),
    ultimoCambio: cambios.length > 0 ? cambios[cambios.length - 1] : undefined
  };
};
