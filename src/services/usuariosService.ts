import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export class UsuariosService {
  // Crear usuario
  async crearUsuario(data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    rol: 'ADMIN' | 'OPERADOR';
    telefono?: string;
    direccion?: string;
    creadoPor?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 12);
    
    return await prisma.usuario.create({
      data: {
        ...data,
        password: passwordHash,
        fechaCreacion: new Date(),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        telefono: true,
        direccion: true,
        fechaCreacion: true,
      }
    });
  }

  // Buscar usuario por email
  async buscarPorEmail(email: string) {
    return await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        ultimoAcceso: true,
      }
    });
  }

  // Actualizar último acceso
  async actualizarUltimoAcceso(id: string) {
    return await prisma.usuario.update({
      where: { id },
      data: {
        ultimoAcceso: new Date(),
      }
    });
  }

  // Obtener todos los usuarios (para administración)
  async obtenerUsuarios() {
    return await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        telefono: true,
        direccion: true,
        fechaCreacion: true,
        ultimoAcceso: true,
      },
      orderBy: [
        { rol: 'asc' },
        { apellido: 'asc' },
        { nombre: 'asc' }
      ]
    });
  }

  // Actualizar perfil de usuario
  async actualizarPerfil(id: string, data: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
    foto?: string;
  }) {
    return await prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        fechaActualizacion: new Date(),
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        direccion: true,
        foto: true,
      }
    });
  }

  // Cambiar contraseña
  async cambiarPassword(id: string, passwordActual: string, passwordNueva: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { password: true }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
    if (!passwordValida) {
      throw new Error('Contraseña actual incorrecta');
    }

    const passwordHash = await bcrypt.hash(passwordNueva, 12);

    return await prisma.usuario.update({
      where: { id },
      data: {
        password: passwordHash,
        fechaActualizacion: new Date(),
      }
    });
  }

  // Activar/desactivar usuario
  async toggleActivo(id: string) {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { activo: true }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    return await prisma.usuario.update({
      where: { id },
      data: {
        activo: !usuario.activo,
        fechaActualizacion: new Date(),
      }
    });
  }

  // Eliminar usuario
  async eliminarUsuario(id: string) {
    return await prisma.usuario.delete({
      where: { id }
    });
  }
}

export const usuariosService = new UsuariosService();

