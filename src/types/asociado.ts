import { HistorialMedico } from './medico';

export interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: string; // MIME type
  tamano: number; // en bytes
  contenido: string; // Base64 string
  fecha_subida: string;
  descripcion?: string;
  categoria: 'contrato' | 'medico' | 'identificacion' | 'certificado' | 'otro';
  subido_por: string;
}

export interface Asociado {
  id: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento?: string; // Fecha de nacimiento
  estado_civil?: string; // Estado civil
  beneficio?: string; // Beneficio o plan social (texto)
  beneficio_plan_social?: string; // LEGACY: compatibilidad temporal
  cuil: string;
  dni: string;
  telefono: string;
  email?: string; // Correo electrónico
  fecha_ingreso: string;
  domicilio: string;
  barrio?: string; // Barrio
  codigo_postal?: string; // Código postal
  ciudad?: string; // Ciudad
  provincia?: string; // Provincia
  mano_habil?: 'derecha' | 'izquierda' | 'ambidiestro'; // Mano hábil
  legajo?: string;
  nro_socio?: string;
  monotributo: boolean;
  contratista: string; // Contratista actual
  contratista_id?: string; // ID del contratista (FK)
  activo: boolean;
  fecha_carga: string; // Fecha automática cuando se registra el asociado
  fecha_baja?: string;
  responsable_baja?: string;
  foto_dni?: string; // Base64 string de la imagen
  nombre_archivo_dni?: string; // Nombre original del archivo
  archivos_adjuntos: ArchivoAdjunto[]; // Nuevos archivos adjuntos
  historial_medico?: HistorialMedico; // Historial médico del asociado
}

export interface Contratista {
  id: string;
  nombre: string;
  activo: boolean;
  fecha_creacion: string;
}

export interface FiltroAsociados {
  contratista: string;
  busqueda: string;
}

export type EstadoAsociado = 'activo' | 'baja';

// Mantenemos alias para compatibilidad temporal
export type Empleado = Asociado;
export type FiltroEmpleados = FiltroAsociados;
export type EstadoEmpleado = EstadoAsociado;
