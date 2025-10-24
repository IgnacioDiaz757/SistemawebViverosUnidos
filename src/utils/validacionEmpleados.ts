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
 * Valida si un DNI ya existe en la lista de empleados
 * @param dni - DNI a validar
 * @param empleados - Lista de empleados existentes
 * @param empleadoActualId - ID del empleado actual (para edición, opcional)
 * @returns objeto con resultado de validación
 */
export const validarDniDuplicado = (
  dni: string, 
  empleados: Empleado[], 
  empleadoActualId?: string
): { esValido: boolean; mensaje?: string; empleadoExistente?: Empleado } => {
  if (!dni.trim()) {
    return { esValido: true };
  }

  const dniLimpio = dni.trim();
  const empleadoExistente = empleados.find(emp => 
    emp.dni.trim() === dniLimpio && emp.id !== empleadoActualId
  );

  if (empleadoExistente) {
    return {
      esValido: false,
      mensaje: `El DNI ${dni} ya está registrado para ${empleadoExistente.nombre} ${empleadoExistente.apellido}${empleadoExistente.activo ? '' : ' (dado de baja)'}`,
      empleadoExistente
    };
  }

  return { esValido: true };
};

/**
 * Valida si un legajo ya existe en la lista de empleados
 * @param legajo - Legajo a validar
 * @param empleados - Lista de empleados existentes
 * @param empleadoActualId - ID del empleado actual (para edición, opcional)
 * @returns objeto con resultado de validación
 */
export const validarLegajoDuplicado = (
  legajo: string, 
  empleados: Empleado[], 
  empleadoActualId?: string
): { esValido: boolean; mensaje?: string; empleadoExistente?: Empleado } => {
  if (!legajo.trim()) {
    return { esValido: true };
  }

  const legajoLimpio = legajo.trim().toUpperCase();
  const empleadoExistente = empleados.find(emp => 
    String(emp.legajo || '').trim().toUpperCase() === legajoLimpio && emp.id !== empleadoActualId
  );

  if (empleadoExistente) {
    return {
      esValido: false,
      mensaje: `El legajo ${legajo} ya está registrado para ${empleadoExistente.nombre} ${empleadoExistente.apellido}${empleadoExistente.activo ? '' : ' (dado de baja)'}`,
      empleadoExistente
    };
  }

  return { esValido: true };
};

/**
 * Valida si un número de socio ya existe en la lista de empleados
 * @param nroSocio - Número de socio a validar
 * @param empleados - Lista de empleados existentes
 * @param empleadoActualId - ID del empleado actual (para edición, opcional)
 * @returns objeto con resultado de validación
 */
export const validarNroSocioDuplicado = (
  nroSocio: string, 
  empleados: Empleado[], 
  empleadoActualId?: string
): { esValido: boolean; mensaje?: string; empleadoExistente?: Empleado } => {
  if (!nroSocio.trim()) {
    return { esValido: true };
  }

  const nroSocioLimpio = nroSocio.trim().toUpperCase();
  const empleadoExistente = empleados.find(emp => 
    String((emp as any).nro_socio || '').trim().toUpperCase() === nroSocioLimpio && emp.id !== empleadoActualId
  );

  if (empleadoExistente) {
    return {
      esValido: false,
      mensaje: `El número de socio ${nroSocio} ya está registrado para ${empleadoExistente.nombre} ${empleadoExistente.apellido}${empleadoExistente.activo ? '' : ' (dado de baja)'}`,
      empleadoExistente
    };
  }

  return { esValido: true };
};

/**
 * Valida todos los campos únicos de un empleado
 * @param empleadoData - Datos del empleado a validar
 * @param empleados - Lista de empleados existentes
 * @param empleadoActualId - ID del empleado actual (para edición, opcional)
 * @returns objeto con todos los errores de validación
 */
export const validarEmpleadoDuplicado = (
  empleadoData: { cuil: string; dni: string; legajo: string; nroSocio: string },
  empleados: Empleado[],
  empleadoActualId?: string
): Record<string, string> => {
  const errores: Record<string, string> = {};

  // Validar CUIL
  const validacionCuil = validarCuilDuplicado(empleadoData.cuil, empleados, empleadoActualId);
  if (!validacionCuil.esValido && validacionCuil.mensaje) {
    errores.cuil = validacionCuil.mensaje;
  }

  // Validar DNI
  const validacionDni = validarDniDuplicado(empleadoData.dni, empleados, empleadoActualId);
  if (!validacionDni.esValido && validacionDni.mensaje) {
    errores.dni = validacionDni.mensaje;
  }

  // Validar Legajo
  const validacionLegajo = validarLegajoDuplicado(empleadoData.legajo, empleados, empleadoActualId);
  if (!validacionLegajo.esValido && validacionLegajo.mensaje) {
    errores.legajo = validacionLegajo.mensaje;
  }

  // Validar Número de Socio
  const validacionNroSocio = validarNroSocioDuplicado(empleadoData.nroSocio, empleados, empleadoActualId);
  if (!validacionNroSocio.esValido && validacionNroSocio.mensaje) {
    errores.nroSocio = validacionNroSocio.mensaje;
  }

  return errores;
};
