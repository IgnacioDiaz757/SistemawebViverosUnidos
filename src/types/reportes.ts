import { Asociado } from './asociado';

export interface MovimientoAsociado {
  id: string;
  asociado: Asociado;
  tipo: 'alta' | 'baja' | 'cambio_contratista';
  fecha: string;
  contratista: string;
  contratistaAnterior?: string; // Para cambios de contratista
  responsable?: string; // Para bajas
  motivo?: string;
  mes: number;
  año: number;
}

export interface ResumenMensual {
  mes: number;
  año: number;
  nombreMes: string;
  contratista: string;
  altas: MovimientoAsociado[];
  bajas: MovimientoAsociado[];
  cambiosEntrada: MovimientoAsociado[]; // Asociados que llegaron de otro contratista
  cambiosSalida: MovimientoAsociado[]; // Asociados que se fueron a otro contratista
  totalAltas: number;
  totalBajas: number;
  totalCambiosEntrada: number;
  totalCambiosSalida: number;
  saldoNeto: number; // altas + cambiosEntrada - bajas - cambiosSalida
}

export interface ReporteLiquidacion {
  mes: number;
  año: number;
  nombreMes: string;
  fechaGeneracion: string;
  resumenPorContratista: ResumenMensual[];
  resumenGeneral: {
    totalAltas: number;
    totalBajas: number;
    totalCambios: number;
    asociadosActivosInicioMes: number;
    asociadosActivosFinMes: number;
  };
  movimientos: MovimientoAsociado[];
}

export interface FiltroReporte {
  año: number;
  mes?: number; // Si no se especifica, se incluyen todos los meses del año
  contratista?: string; // Si no se especifica, se incluyen todos los contratistas
  tipoMovimiento?: 'alta' | 'baja' | 'cambio_contratista' | 'todos';
  fechaDesde?: string; // Filtro por fecha de inicio (YYYY-MM-DD)
  fechaHasta?: string; // Filtro por fecha de fin (YYYY-MM-DD)
}

export const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const obtenerNombreMes = (mes: number): string => {
  return MESES_NOMBRES[mes - 1] || 'Mes inválido';
};
