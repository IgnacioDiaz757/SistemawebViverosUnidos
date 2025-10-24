import bcrypt from 'bcryptjs';
import { UsuarioAdmin } from '@/types/auth';
import { ADMIN_GENERAL_EMAIL, ADMIN_GENERAL_PASSWORD } from '@/config/admin';

const usuariosIniciales: Omit<UsuarioAdmin, 'password'>[] = [
  {
    id: '1',
    email: 'admin@cooperativa.com',
    nombre: 'Administrador',
    apellido: 'Principal',
    rol: 'admin',
    activo: true,
    fechaCreacion: new Date().toISOString(),
  },
];

export const inicializarUsuariosEjemplo = () => {
  if (typeof window === 'undefined') return; // Solo ejecutar en el cliente

  const usuariosExistentes = localStorage.getItem('usuarios_admin');
  const lista: (UsuarioAdmin & { password: string })[] = usuariosExistentes ? JSON.parse(usuariosExistentes) : [];

  const safeRandomUUID = (): string => {
    const g: any = (globalThis as any).crypto || (window as any).crypto;
    if (g && typeof g.randomUUID === 'function') return g.randomUUID();
    if (g && typeof g.getRandomValues === 'function') {
      const bytes = new Uint8Array(16);
      g.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      const b = Array.from(bytes, toHex).join('');
      return `${b.slice(0, 8)}-${b.slice(8, 12)}-${b.slice(12, 16)}-${b.slice(16, 20)}-${b.slice(20)}`;
    }
    // Fallback Math.random (no-crypto)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Asegurar admin demo
  if (!lista.find(u => u.email === 'admin@cooperativa.com')) {
    lista.push({
      ...usuariosIniciales[0],
      password: '123456',
    } as any);
  }

  // Asegurar admin general con contraseña definida
  const existingGeneral = lista.find(u => u.email && u.email.toLowerCase() === ADMIN_GENERAL_EMAIL.toLowerCase());
  if (!existingGeneral) {
    lista.push({
      id: safeRandomUUID(),
      email: ADMIN_GENERAL_EMAIL,
      nombre: 'Admin',
      apellido: 'General',
      rol: 'admin',
      activo: true,
      fechaCreacion: new Date().toISOString(),
      password: ADMIN_GENERAL_PASSWORD,
    } as any);
  } else if (!(existingGeneral as any).password) {
    (existingGeneral as any).password = ADMIN_GENERAL_PASSWORD;
  }

  localStorage.setItem('usuarios_admin', JSON.stringify(lista));
};

// Función para obtener usuarios (solo para uso en el cliente)
export const obtenerUsuarios = (): (UsuarioAdmin & { password: string })[] => {
  if (typeof window === 'undefined') return [];
  
  const usuarios = localStorage.getItem('usuarios_admin');
  return usuarios ? JSON.parse(usuarios) : [];
};

// Función para buscar usuario por email
export const buscarUsuarioPorEmail = (email: string): (UsuarioAdmin & { password: string }) | null => {
  const usuarios = obtenerUsuarios();
  return usuarios.find(user => user.email === email) || null;
};

// Función para guardar usuarios
export const guardarUsuarios = (usuarios: (UsuarioAdmin & { password: string })[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('usuarios_admin', JSON.stringify(usuarios));
};
