import { Asociado } from '@/types/asociado';

/**
 * Migra los datos existentes de asociados para incluir el campo archivosAdjuntos
 * Esta función se ejecuta automáticamente al cargar la aplicación
 */
export const migrarDatosArchivos = (): void => {
  try {
    // Verificar si ya se ejecutó la migración
    const migracionCompletada = localStorage.getItem('migracion_archivos_v1');
    if (migracionCompletada === 'true') {
      return; // Ya se migró
    }

    console.log('🔄 Iniciando migración de datos para archivos adjuntos...');

    // Migrar datos de 'asociados'
    const asociadosData = localStorage.getItem('asociados');
    if (asociadosData) {
      const asociados: Asociado[] = JSON.parse(asociadosData);
      const asociadosMigrados = asociados.map(asociado => ({
        ...asociado,
        archivos_adjuntos: Array.isArray((asociado as any).archivos_adjuntos) ? (asociado as any).archivos_adjuntos : []
      }));
      localStorage.setItem('asociados', JSON.stringify(asociadosMigrados));
      console.log(`✅ Migrados ${asociadosMigrados.length} asociados`);
    }

    // Migrar datos de 'empleados' (compatibilidad)
    const empleadosData = localStorage.getItem('empleados');
    if (empleadosData) {
      const empleados: Asociado[] = JSON.parse(empleadosData);
      const empleadosMigrados = empleados.map(empleado => ({
        ...empleado,
        archivos_adjuntos: Array.isArray((empleado as any).archivos_adjuntos) ? (empleado as any).archivos_adjuntos : []
      }));
      localStorage.setItem('empleados', JSON.stringify(empleadosMigrados));
      console.log(`✅ Migrados ${empleadosMigrados.length} empleados (compatibilidad)`);
    }

    // Marcar migración como completada
    localStorage.setItem('migracion_archivos_v1', 'true');
    console.log('✅ Migración de archivos completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la migración de archivos:', error);
    // En caso de error, no marcar como completada para que se intente nuevamente
  }
};

/**
 * Valida y corrige un objeto asociado para asegurar que tenga todos los campos requeridos
 */
export const validarYCorregirAsociado = (asociado: any): Asociado => {
  return {
    ...asociado,
    archivos_adjuntos: Array.isArray(asociado.archivos_adjuntos) ? asociado.archivos_adjuntos : []
  };
};

/**
 * Limpia y resetea todos los datos de migración (solo para desarrollo/debug)
 */
export const resetMigracion = (): void => {
  localStorage.removeItem('migracion_archivos_v1');
  console.log('🔄 Reset de migración completado');
};
