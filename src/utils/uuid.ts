/**
 * Genera un UUID v4 válido
 * @returns string UUID v4
 */
export function generarUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Genera un ID único simple (no UUID) para uso local
 * @returns string ID único
 */
export function generarIdUnico(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2);
}
