import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Script para migrar datos del localStorage a la base de datos
async function migrarDatos() {
  console.log('🚀 Iniciando migración de datos...');

  try {
    // 1. Crear usuarios iniciales
    console.log('👤 Creando usuarios iniciales...');
    
    const adminPassword = await bcrypt.hash('123456', 12);

    const admin = await prisma.usuario.upsert({
      where: { email: 'admin@cooperativa.com' },
      update: {},
      create: {
        email: 'admin@cooperativa.com',
        password: adminPassword,
        nombre: 'Administrador',
        apellido: 'Principal',
        rol: 'ADMIN',
        activo: true,
      }
    });

    console.log('✅ Usuarios creados');

    // 2. Crear contratistas iniciales
    console.log('🏢 Creando contratistas iniciales...');
    
    const contratistas: string[] = [];

    for (const nombre of contratistas) {
      await prisma.contratista.upsert({
        where: { nombre },
        update: {},
        create: { nombre, activo: true }
      });
    }

    if (contratistas.length > 0) {
      console.log('✅ Contratistas creados');
    } else {
      console.log('ℹ️ No se crearon contratistas de ejemplo');
    }

    // 3. Aquí puedes agregar la migración de asociados si tienes datos existentes
    // const asociadosLocalStorage = JSON.parse(localStorage.getItem('asociados') || '[]');
    // ... lógica de migración

    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
if (require.main === module) {
  migrarDatos()
    .then(() => {
      console.log('✅ Script de migración terminado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

export { migrarDatos };

