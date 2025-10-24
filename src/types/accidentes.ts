export interface ObservacionDiaria {
  id: string;
  fecha: string;
  observacion: string;
  creadoPor: string;
  fechaCreacion: string;
}

export interface Accidente {
  id: string;
  nombre: string;
  apellido: string;
  dni?: string;
  fechaNacimiento?: string;
  cuil?: string;
  contratista?: string;
  fechaAccidente: string;
  nroSiniestro?: string;
  obraDireccion?: string;
  descripcion: string;
  nombreSeguro: string;
  tipoAccidente: 'leve' | 'grave' | 'muy_grave';
  tipologiaAccidente?: TipologiaAccidente;
  estado: 'reportado' | 'en_tratamiento' | 'resuelto';
  observaciones?: string;
  observacionesDiarias: ObservacionDiaria[]; // Nuevas observaciones diarias
  fechaCreacion: string;
  creadoPor: string;
  asociadoId?: string; // Si el accidentado es un asociado registrado
}

export interface FiltroAccidentes {
  estado: 'todos' | 'reportado' | 'en_tratamiento' | 'resuelto';
  tipoAccidente: 'todos' | 'leve' | 'moderado' | 'grave';
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda: string;
}

export type EstadoAccidente = 'reportado' | 'en_tratamiento' | 'resuelto';
export type TipoAccidente = 'leve' | 'grave' | 'muy_grave';

// Tipología específica del accidente (categorías solicitadas)
export type TipologiaAccidente =
  | 'caida_de_altura'
  | 'accidentes_con_maquinas'
  | 'golpes_por_objetos'
  | 'atrapamientos'
  | 'lesiones_herramientas_manuales'
  | 'exposicion_sustancias_peligrosas'
  | 'accidentes_por_andamios_inseguros'
  | 'electrocuciones'
  | 'sobreesfuerzo'
  | 'fatiga'
  | 'otros';
