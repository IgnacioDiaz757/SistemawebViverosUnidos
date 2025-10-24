import { Asociado, Empleado } from '@/types/asociado';

/**
 * Valida si un CUIL ya existe en la lista de asociados
 * @param cuil - CUIL a validar
 * @param asociados - Lista de asociados existentes
 * @param asociadoActualId - ID del asociado actual (para edición, opcional)
 * @returns objeto con resultado de validación
 */
export const validarCuilDuplicado = (
  cuil: string, 
  asociados: Asociado[], 
  asociadoActualId?: string
): { esValido: boolean; mensaje?: string; asociadoExistente?: Asociado } => {
  if (!cuil.trim()) {
    return { esValido: true };
  }

  const cuilLimpio = cuil.trim().toUpperCase();
  const asociadoExistente = asociados.find(emp => 
    emp.cuil.trim().toUpperCase() === cuilLimpio && emp.id !== asociadoActualId
  );

  if (asociadoExistente) {
    return {
      esValido: false,
      mensaje: `El CUIL ${cuil} ya está registrado para ${asociadoExistente.nombre} ${asociadoExistente.apellido}${asociadoExistente.activo ? '' : ' (dado de baja)'}`,
      asociadoExistente
    };
  }

  return { esValido: true };
};

/**
 * Valida si un DNI ya existe en la lista de asociados
 * @param dni - DNI a validar
 * @param asociados - Lista de asociados existentes
 * @param asociadoActualId - ID del asociado actual (para edición, opcional)
 * @returns objeto con resultado de validación
 */
export const validarDniDuplicado = (
  dni: string, 
  asociados: Asociado[], 
  asociadoActualId?: string
): { esValido: boolean; mensaje?: string; asociadoExistente?: Asociado } => {
  if (!dni.trim()) {
    return { esValido: true };
  }

  const dniLimpio = dni.trim();
  const asociadoExistente = asociados.find(emp => 
    emp.dni.trim() === dniLimpio && emp.id !== asociadoActualId
  );

  if (asociadoExistente) {
    return {
      esValido: false,
      mensaje: `El DNI ${dni} ya está registrado para ${asociadoExistente.nombre} ${asociadoExistente.apellido}${asociadoExistente.activo ? '' : ' (dado de baja)'}`,
      asociadoExistente
    };
  }

  return { esValido: true };
};

/**
 * Valida si un legajo ya existe en la lista de asociados
 * @param legajo - Legajo a validar
 * @param asociados - Lista de asociados existentes
 * @param asociadoActualId - ID del asociado actual (para edición, opcional)
 * @returns objeto con resultado de validación
 */
export const validarLegajoDuplicado = (
  legajo: string, 
  asociados: Asociado[], 
  asociadoActualId?: string
): { esValido: boolean; mensaje?: string; asociadoExistente?: Asociado } => {
  if (!legajo.trim()) {
    return { esValido: true };
  }

  const legajoLimpio = legajo.trim().toUpperCase();
  const asociadoExistente = asociados.find(emp => 
    String(emp.legajo || '').trim().toUpperCase() === legajoLimpio && emp.id !== asociadoActualId
  );

  if (asociadoExistente) {
    return {
      esValido: false,
      mensaje: `El legajo ${legajo} ya está registrado para ${asociadoExistente.nombre} ${asociadoExistente.apellido}${asociadoExistente.activo ? '' : ' (dado de baja)'}`,
      asociadoExistente
    };
  }

  return { esValido: true };
};

/**
 * Valida si un número de socio ya existe en la lista de asociados
 * @param nroSocio - Número de socio a validar
 * @param asociados - Lista de asociados existentes
 * @param asociadoActualId - ID del asociado actual (para edición, opcional)
 * @returns objeto con resultado de validación
 */
export const validarNroSocioDuplicado = (
  nroSocio: string, 
  asociados: Asociado[], 
  asociadoActualId?: string
): { esValido: boolean; mensaje?: string; asociadoExistente?: Asociado } => {
  if (!nroSocio.trim()) {
    return { esValido: true };
  }

  const nroSocioLimpio = nroSocio.trim().toUpperCase();
  const asociadoExistente = asociados.find(emp => 
    String((emp as any).nro_socio || '').trim().toUpperCase() === nroSocioLimpio && emp.id !== asociadoActualId
  );

  if (asociadoExistente) {
    return {
      esValido: false,
      mensaje: `El número de socio ${nroSocio} ya está registrado para ${asociadoExistente.nombre} ${asociadoExistente.apellido}${asociadoExistente.activo ? '' : ' (dado de baja)'}`,
      asociadoExistente
    };
  }

  return { esValido: true };
};

/**
 * Valida todos los campos únicos de un asociado
 * @param asociadoData - Datos del asociado a validar
 * @param asociados - Lista de asociados existentes
 * @param asociadoActualId - ID del asociado actual (para edición, opcional)
 * @returns objeto con todos los errores de validación
 */
export const validarAsociadoDuplicado = (
  asociadoData: { cuil: string; dni: string; legajo: string; nroSocio: string },
  asociados: Asociado[],
  asociadoActualId?: string
): Record<string, string> => {
  const errores: Record<string, string> = {};

  // Validar CUIL
  const validacionCuil = validarCuilDuplicado(asociadoData.cuil, asociados, asociadoActualId);
  if (!validacionCuil.esValido && validacionCuil.mensaje) {
    errores.cuil = validacionCuil.mensaje;
  }

  // Validar DNI
  const validacionDni = validarDniDuplicado(asociadoData.dni, asociados, asociadoActualId);
  if (!validacionDni.esValido && validacionDni.mensaje) {
    errores.dni = validacionDni.mensaje;
  }

  // Validar Legajo
  const validacionLegajo = validarLegajoDuplicado(asociadoData.legajo, asociados, asociadoActualId);
  if (!validacionLegajo.esValido && validacionLegajo.mensaje) {
    errores.legajo = validacionLegajo.mensaje;
  }

  // Validar Número de Socio
  const validacionNroSocio = validarNroSocioDuplicado(asociadoData.nroSocio, asociados, asociadoActualId);
  if (!validacionNroSocio.esValido && validacionNroSocio.mensaje) {
    errores.nroSocio = validacionNroSocio.mensaje;
  }

  return errores;
};

// Aliases para compatibilidad temporal
export const validarEmpleadoDuplicado = validarAsociadoDuplicado;
