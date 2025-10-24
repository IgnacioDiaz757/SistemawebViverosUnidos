export interface UsuarioAdmin {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'admin';
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
  creadoPor?: string;
}

export interface CredencialesLogin {
  email: string;
  password: string;
}

export interface DatosRegistro {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: 'admin';
}

export interface SesionUsuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'admin';
}

export type RolUsuario = 'admin';

export const ROLES_DESCRIPCION = {
  admin: 'Administrador - Acceso completo al sistema'
} as const;
