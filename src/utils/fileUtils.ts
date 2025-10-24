/**
 * Convierte un archivo a base64
 * @param file - El archivo a convertir
 * @returns Promise con el string base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Error al convertir archivo a base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Descarga un archivo base64
 * @param base64Data - String base64 del archivo
 * @param fileName - Nombre del archivo a descargar
 */
export const downloadBase64File = (base64Data: string, fileName: string) => {
  try {
    // Crear un enlace temporal para la descarga
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    
    // Agregar el enlace al DOM, hacer clic y removerlo
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    alert('Error al descargar el archivo');
  }
};

/**
 * Valida si un archivo es una imagen válida
 * @param file - El archivo a validar
 * @returns boolean
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    alert('Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP)');
    return false;
  }

  if (file.size > maxSize) {
    alert('El archivo es demasiado grande. Tamaño máximo: 5MB');
    return false;
  }

  return true;
};

/**
 * Obtiene el nombre del archivo sin la extensión
 * @param fileName - Nombre del archivo
 * @returns Nombre sin extensión
 */
export const getFileNameWithoutExtension = (fileName: string): string => {
  return fileName.split('.').slice(0, -1).join('.');
};

/**
 * Obtiene la extensión del archivo
 * @param fileName - Nombre del archivo
 * @returns Extensión del archivo
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop() || '';
};

/**
 * Genera un nombre de archivo único para el DNI
 * @param empleado - Datos del empleado
 * @param originalFileName - Nombre original del archivo
 * @returns Nombre único para el archivo
 */
export const generateDniFileName = (dni: string, nombre: string, apellido: string, originalFileName: string): string => {
  const extension = getFileExtension(originalFileName);
  const timestamp = new Date().getTime();
  const sanitizedName = `${nombre}_${apellido}`.replace(/[^a-zA-Z0-9]/g, '_');
  return `DNI_${dni}_${sanitizedName}_${timestamp}.${extension}`;
};
