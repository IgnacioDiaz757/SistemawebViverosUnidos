import { Asociado } from '@/types/asociado';
import { MovimientoAsociado, ResumenMensual, ReporteLiquidacion, FiltroReporte, obtenerNombreMes } from '@/types/reportes';

/**
 * Obtiene los movimientos de asociados basándose en las fechas de carga, ingreso y baja
 */
export const obtenerMovimientosAsociados = (
  asociados: Asociado[],
  historialContratistas?: any[]
): MovimientoAsociado[] => {
  const movimientos: MovimientoAsociado[] = [];

  asociados.forEach((asociado: any) => {
    // Movimiento de ALTA (basado en fechaCarga - día que se registró en el sistema)
    const fechaCargaSrc = asociado.fecha_carga || asociado.fechaCarga;
    if (fechaCargaSrc) {
      const fechaCarga = new Date(fechaCargaSrc);
      movimientos.push({
        id: `alta-${asociado.id}`,
        asociado: {
          ...asociado,
          // Agregamos información de fechas para el reporte
          fechaIngresoReal: asociado.fecha_ingreso || asociado.fechaIngreso, // Día que realmente empezó a trabajar
          fechaCargaReal: fechaCargaSrc      // Día que se registró en el sistema
        },
        tipo: 'alta',
        fecha: fechaCargaSrc, // Usamos fecha de carga para el movimiento administrativo
        contratista: asociado.contratista,
        mes: fechaCarga.getMonth() + 1,
        año: fechaCarga.getFullYear()
      });
    }

    // Movimiento de BAJA (si el asociado fue dado de baja)
    const fechaBajaSrc = asociado.fecha_baja || asociado.fechaBaja;
    const responsableBajaSrc = asociado.responsable_baja || asociado.responsableBaja;
    if (!asociado.activo && fechaBajaSrc && responsableBajaSrc) {
      const fechaBaja = new Date(fechaBajaSrc);
      movimientos.push({
        id: `baja-${asociado.id}`,
        asociado: {
          ...asociado,
          fechaIngresoReal: asociado.fecha_ingreso || asociado.fechaIngreso,
          fechaCargaReal: asociado.fecha_carga || asociado.fechaCarga,
          fechaBajaReal: fechaBajaSrc
        },
        tipo: 'baja',
        fecha: fechaBajaSrc,
        contratista: asociado.contratista,
        responsable: responsableBajaSrc,
        mes: fechaBaja.getMonth() + 1,
        año: fechaBaja.getFullYear()
      });
    }

    // Movimientos de CAMBIO DE CONTRATISTA (basado en historial si existe)
    // Por ahora usaremos la lógica básica, pero se puede expandir con el historial
  });

  return movimientos.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
};

/**
 * Genera un resumen mensual por contratista
 */
export const generarResumenMensual = (
  movimientos: MovimientoAsociado[],
  contratista: string,
  mes: number,
  año: number
): ResumenMensual => {
  const movimientosFiltrados = movimientos.filter(
    m => m.mes === mes && m.año === año && m.contratista === contratista
  );

  const altas = movimientosFiltrados.filter(m => m.tipo === 'alta');
  const bajas = movimientosFiltrados.filter(m => m.tipo === 'baja');
  const cambiosEntrada = movimientosFiltrados.filter(
    m => m.tipo === 'cambio_contratista' && m.contratista === contratista
  );
  const cambiosSalida = movimientosFiltrados.filter(
    m => m.tipo === 'cambio_contratista' && m.contratistaAnterior === contratista
  );

  return {
    mes,
    año,
    nombreMes: obtenerNombreMes(mes),
    contratista,
    altas,
    bajas,
    cambiosEntrada,
    cambiosSalida,
    totalAltas: altas.length,
    totalBajas: bajas.length,
    totalCambiosEntrada: cambiosEntrada.length,
    totalCambiosSalida: cambiosSalida.length,
    saldoNeto: altas.length + cambiosEntrada.length - bajas.length - cambiosSalida.length
  };
};

/**
 * Genera un reporte completo de liquidación
 */
export const generarReporteLiquidacion = (
  asociados: Asociado[],
  contratistas: { nombre: string }[],
  filtro: FiltroReporte
): ReporteLiquidacion => {
  const movimientos = obtenerMovimientosAsociados(asociados);
  
  // Filtrar movimientos según el filtro
  let movimientosFiltrados = movimientos.filter(m => m.año === filtro.año);
  
  if (filtro.mes) {
    movimientosFiltrados = movimientosFiltrados.filter(m => m.mes === filtro.mes);
  }
  
  if (filtro.contratista) {
    movimientosFiltrados = movimientosFiltrados.filter(m => m.contratista === filtro.contratista);
  }
  
  if (filtro.tipoMovimiento && filtro.tipoMovimiento !== 'todos') {
    movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === filtro.tipoMovimiento);
  }

  // Filtros por rango de fechas
  if (filtro.fechaDesde) {
    movimientosFiltrados = movimientosFiltrados.filter(m => m.fecha >= filtro.fechaDesde!);
  }
  
  if (filtro.fechaHasta) {
    movimientosFiltrados = movimientosFiltrados.filter(m => m.fecha <= filtro.fechaHasta!);
  }

  // Generar resumen por contratista
  const resumenPorContratista: ResumenMensual[] = [];
  
  contratistas.forEach(contratista => {
    if (filtro.contratista && contratista.nombre !== filtro.contratista) return;
    
    if (filtro.mes) {
      // Reporte para un mes específico
      const resumen = generarResumenMensual(movimientos, contratista.nombre, filtro.mes, filtro.año);
      if (resumen.totalAltas > 0 || resumen.totalBajas > 0 || resumen.totalCambiosEntrada > 0 || resumen.totalCambiosSalida > 0) {
        resumenPorContratista.push(resumen);
      }
    } else {
      // Reporte anual - generar para cada mes
      for (let mes = 1; mes <= 12; mes++) {
        const resumen = generarResumenMensual(movimientos, contratista.nombre, mes, filtro.año);
        if (resumen.totalAltas > 0 || resumen.totalBajas > 0 || resumen.totalCambiosEntrada > 0 || resumen.totalCambiosSalida > 0) {
          resumenPorContratista.push(resumen);
        }
      }
    }
  });

  // Calcular resumen general
  const totalAltas = movimientosFiltrados.filter(m => m.tipo === 'alta').length;
  const totalBajas = movimientosFiltrados.filter(m => m.tipo === 'baja').length;
  const totalCambios = movimientosFiltrados.filter(m => m.tipo === 'cambio_contratista').length;

  // Calcular asociados activos al inicio y fin del período
  const fechaInicio = new Date(filtro.año, filtro.mes ? filtro.mes - 1 : 0, 1);
  const fechaFin = filtro.mes 
    ? new Date(filtro.año, filtro.mes, 0) // Último día del mes
    : new Date(filtro.año, 11, 31); // 31 de diciembre

  const asociadosActivosInicioMes = asociados.filter((a: any) => {
    const fc = a.fecha_carga || a.fechaCarga;
    if (!fc) return false;
    const fechaCarga = new Date(fc);
    const fb = a.fecha_baja || a.fechaBaja;
    return fechaCarga < fechaInicio && (a.activo || !fb || new Date(fb) > fechaInicio);
  }).length;

  const asociadosActivosFinMes = asociados.filter((a: any) => {
    const fc = a.fecha_carga || a.fechaCarga;
    if (!fc) return false;
    const fechaCarga = new Date(fc);
    const fb = a.fecha_baja || a.fechaBaja;
    return fechaCarga <= fechaFin && (a.activo || !fb || new Date(fb) > fechaFin);
  }).length;

  return {
    mes: filtro.mes || 0,
    año: filtro.año,
    nombreMes: filtro.mes ? obtenerNombreMes(filtro.mes) : 'Todo el año',
    fechaGeneracion: new Date().toISOString().split('T')[0],
    resumenPorContratista,
    resumenGeneral: {
      totalAltas,
      totalBajas,
      totalCambios,
      asociadosActivosInicioMes,
      asociadosActivosFinMes
    },
    movimientos: movimientosFiltrados
  };
};

/**
 * Convierte un reporte a formato CSV
 */
export const exportarReporteCSV = (reporte: ReporteLiquidacion): string => {
  // CSV simplificado con 6 columnas:
  // A: Nombre, B: Apellido, C: DNI, D: Legajo, E: Contratista, F: Monotributo
  const lineas: string[] = [];
  lineas.push('Nombre,Apellido,DNI,Legajo,Contratista,Monotributo');

  // Tomar asociados únicos presentes en los movimientos filtrados
  const vistos = new Set<string>();
  reporte.movimientos.forEach((mov) => {
    const id = String((mov.asociado as any).id || `${mov.asociado.nombre}-${mov.asociado.dni}`);
    if (vistos.has(id)) return;
    vistos.add(id);

    const nombre = (mov.asociado as any).nombre || '';
    const apellido = (mov.asociado as any).apellido || '';
    const dni = (mov.asociado as any).dni || '';
    const legajo = (mov.asociado as any).legajo || '';
    const contratista = mov.contratista || (mov.asociado as any).contratista || '';
    const monotributoBool = (mov.asociado as any).monotributo === true;
    const monotributo = monotributoBool ? 'SI' : 'NO';

    // Escapar comas básicas si aparecieran en el nombre/contratista
    const safe = (v: string) => String(v).replace(/,/g, ' ');
    lineas.push([
      safe(nombre),
      safe(apellido),
      safe(dni),
      safe(legajo),
      safe(contratista),
      monotributo
    ].join(','));
  });

  return lineas.join('\n');
};

/**
 * Descarga un archivo CSV
 */
export const descargarCSV = (contenido: string, nombreArchivo: string) => {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
