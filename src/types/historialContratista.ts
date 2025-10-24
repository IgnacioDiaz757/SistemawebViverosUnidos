export interface CambioContratista {
  id: string;
  empleadoId: string;
  contratistaAnterior: string;
  contratistaNuevo: string;
  fechaCambio: string;
  motivo?: string;
  responsableCambio: string; // Quien realizó el cambio
  ropaEntregadaAnterior?: SnapshotRopaEmpleado; // Ropa que tenía con el contratista anterior
}

export interface SnapshotRopaEmpleado {
  fechaSnapshot: string;
  contratista: string;
  entregas: SnapshotEntregaRopa[];
  totalElementos: number;
}

export interface SnapshotEntregaRopa {
  id: string;
  elementoRopaId: string;
  nombreElemento: string;
  categoria: string;
  talla?: string;
  cantidad: number;
  fechaEntrega: string;
  observaciones?: string;
  entregadoPor: string;
}

export interface HistorialContratista {
  empleadoId: string;
  cambios: CambioContratista[];
  ultimaActualizacion: string;
}

export interface AsignacionInicialContratista {
  empleadoId: string;
  contratista: string;
  fechaAsignacion: string; // Fecha de carga del empleado
  esAsignacionInicial: true;
}
