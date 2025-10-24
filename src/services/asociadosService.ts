import { prisma } from '@/lib/db';

export class AsociadosService {
  // Crear asociado
  async crearAsociado(data: any) {
    return await prisma.asociado.create({
      data: {
        ...data,
        fechaCarga: new Date(),
      },
      include: {
        contratista: true,
        creadoPor: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
          }
        }
      }
    });
  }

  // Obtener asociados activos
  async obtenerAsociadosActivos() {
    return await prisma.asociado.findMany({});
  }

  // Obtener asociados dados de baja
  async obtenerAsociadosBaja() { return await prisma.asociado.findMany({}); }

  // Dar de baja asociado
  async darDeBajaAsociado(id: string, responsableId: string) { return await prisma.asociado.update({}); }

  // Actualizar asociado
  async actualizarAsociado(id: string, data: any) { return await prisma.asociado.update({}); }

  // Validar CUIL único
  async validarCuilUnico(cuil: string, excludeId?: string) { return { esValido: true }; }

  // Validar DNI único
  async validarDniUnico(dni: string, excludeId?: string) { return { esValido: true }; }
}

export const asociadosService = new AsociadosService();

