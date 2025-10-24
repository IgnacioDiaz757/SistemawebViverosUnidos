import { Asociado } from '@/types/asociado';
import { historialMedicoDefault } from '@/types/medico';

/**
 * Migra los datos existentes para agregar historial médico por defecto
 * a los asociados que no lo tengan
 */
export const migrarHistorialMedico = (): void => {
  try {
    // Intentar cargar desde 'asociados' primero, luego 'empleados' para compatibilidad
    const asociadosData = localStorage.getItem('asociados') || localStorage.getItem('empleados');
    
    if (!asociadosData) {
      console.log('🏥 [MIGRACIÓN-MÉDICA] No hay datos para migrar');
      return;
    }

    const asociados: Asociado[] = JSON.parse(asociadosData);
    let migrados = 0;

    const asociadosMigrados = asociados.map(asociado => {
      // Si el asociado no tiene historial médico, agregarlo
      if (!(asociado as any).historial_medico) {
        migrados++;
        return {
          ...asociado,
          historial_medico: historialMedicoDefault
        };
      }
      
      return asociado;
    });

    // Si se migraron datos, guardar de vuelta
    if (migrados > 0) {
      localStorage.setItem('asociados', JSON.stringify(asociadosMigrados));
      localStorage.setItem('empleados', JSON.stringify(asociadosMigrados)); // Mantener compatibilidad
      
      console.log(`🏥 [MIGRACIÓN-MÉDICA] Se migraron ${migrados} asociados con historial médico por defecto`);
    } else {
      console.log('🏥 [MIGRACIÓN-MÉDICA] Todos los asociados ya tienen historial médico');
    }

  } catch (error) {
    console.error('❌ [MIGRACIÓN-MÉDICA] Error durante la migración:', error);
  }
};

/**
 * Valida y corrige un asociado para asegurar que tenga historial médico
 */
export const validarYCorregirHistorialMedico = (asociado: Asociado): Asociado => {
  const asociadoCorregido = { ...asociado } as any;
  
  // Agregar historial médico si no existe
  if (!asociadoCorregido.historial_medico) {
    asociadoCorregido.historial_medico = historialMedicoDefault;
  }
  
  // Agregar beneficio o plan social si no existe
  if (asociadoCorregido.beneficio_plan_social === undefined) {
    asociadoCorregido.beneficio_plan_social = '';
  }
  
  return asociadoCorregido as Asociado;
};
