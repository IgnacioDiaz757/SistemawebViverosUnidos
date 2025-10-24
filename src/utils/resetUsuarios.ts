import { inicializarUsuariosEjemplo } from './inicializarUsuarios';

export const resetearUsuarios = () => {
  if (typeof window === 'undefined') return;
  
  // Limpiar usuarios existentes
  localStorage.removeItem('usuarios_admin');
  
  // Recrear usuarios predeterminados
  inicializarUsuariosEjemplo();
  
  console.log('Usuarios reseteados exitosamente:');
  console.log('Admin: admin@cooperativa.com / 123456');
};

// Función para debug - mostrar usuarios actuales
export const mostrarUsuarios = () => {
  if (typeof window === 'undefined') return;
  
  const usuarios = localStorage.getItem('usuarios_admin');
  if (usuarios) {
    console.log('Usuarios actuales:', JSON.parse(usuarios));
  } else {
    console.log('No hay usuarios en localStorage');
  }
};
