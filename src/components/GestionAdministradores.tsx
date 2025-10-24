'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { obtenerUsuariosAutorizados, autorizarNuevoEmail, desautorizarEmail } from '@/utils/whitelist';

interface GestionAdministradoresProps {
  onClose: () => void;
}

const GestionAdministradores: React.FC<GestionAdministradoresProps> = ({ onClose }) => {
  const [usuariosAutorizados, setUsuariosAutorizados] = useState<any[]>([]);
  const [usuariosRegistrados, setUsuariosRegistrados] = useState<any[]>([]);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellido, setNuevoApellido] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarUsuariosRegistrados, setMostrarUsuariosRegistrados] = useState(false);
  const { user } = useAuth();
  const esAdminPrincipal = (user?.email || '').toLowerCase() === 'admin@cooperativa.com';

  useEffect(() => {
    cargarUsuariosRegistrados();
    cargarUsuariosAutorizados();
  }, []);

  const cargarUsuariosRegistrados = async () => {
    setCargando(true);
    try {
      const usuarios = JSON.parse(localStorage.getItem('usuarios_admin') || '[]');
      setUsuariosRegistrados(usuarios);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setMensaje('Error al cargar usuarios registrados');
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuariosAutorizados = async () => {
    try {
      const usuarios = await obtenerUsuariosAutorizados();
      setUsuariosAutorizados(usuarios);
    } catch (error) {
      console.error('Error al cargar usuarios autorizados:', error);
    }
  };

  const handleAutorizar = async () => {
    if (!nuevoEmail || !nuevoNombre || !nuevoApellido) {
      setMensaje('Por favor completa todos los campos');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoEmail)) {
      setMensaje('Por favor ingresa un email válido');
      return;
    }

    setCargando(true);
    try {
      const exito = await autorizarNuevoEmail(
        nuevoEmail,
        nuevoNombre,
        nuevoApellido,
        user?.email || 'admin@cooperativa.com'
      );

      if (exito) {
        await cargarUsuariosAutorizados();
        setNuevoEmail('');
        setNuevoNombre('');
        setNuevoApellido('');
        setMostrarFormulario(false);
        setMensaje('Usuario autorizado exitosamente');
      } else {
        setMensaje('El email ya está autorizado o hubo un error');
      }
    } catch (error) {
      console.error('Error al autorizar usuario:', error);
      setMensaje('Error al autorizar el usuario');
    } finally {
      setCargando(false);
    }
  };

  const handleDesautorizar = async (email: string) => {
    if (email === 'admin@cooperativa.com') {
      setMensaje('No puedes desautorizar al administrador principal');
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres desautorizar a ${email}?`)) {
      setCargando(true);
      try {
        const exito = await desautorizarEmail(email, user?.email || '');
        if (exito) {
          await cargarUsuariosAutorizados();
          setMensaje('Usuario desautorizado exitosamente');
        } else {
          setMensaje('No autorizado para desautorizar usuarios');
        }
      } catch (error) {
        console.error('Error al desautorizar usuario:', error);
        setMensaje('Error al desautorizar el usuario');
      } finally {
        setCargando(false);
      }
    }
  };

  const handleCambiarEstadoUsuario = async (usuarioId: string, activo: boolean) => {
    const lista = JSON.parse(localStorage.getItem('usuarios_admin') || '[]');
    const idx = lista.findIndex((u: any) => u.id === usuarioId);
    if (idx >= 0) {
      lista[idx].activo = activo;
      lista[idx].fecha_actualizacion = new Date().toISOString();
      localStorage.setItem('usuarios_admin', JSON.stringify(lista));
      await cargarUsuariosRegistrados();
      setMensaje(`Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`);
    }
  };

  const handleEliminarUsuario = async (usuarioId: string, email: string) => {
    if (email === 'admin@cooperativa.com') {
      setMensaje('No puedes eliminar al administrador principal');
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${email}?`)) {
      const lista = JSON.parse(localStorage.getItem('usuarios_admin') || '[]');
      const nueva = lista.filter((u: any) => u.id !== usuarioId);
      localStorage.setItem('usuarios_admin', JSON.stringify(nueva));
      await cargarUsuariosRegistrados();
      setMensaje('Usuario eliminado');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Administradores</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {mensaje && (
          <div className={`mb-4 p-3 rounded-md ${
            mensaje.includes('exitosamente') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensaje}
          </div>
        )}

        {/* Lista de administradores autorizados */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Administradores Autorizados</h3>
          <div className="space-y-2">
            {usuariosAutorizados.map((usuario, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{usuario.nombre} {usuario.apellido}</div>
                  <div className="text-sm text-gray-600">{usuario.email}</div>
                  <div className="text-xs text-gray-500">
                    Autorizado por: {usuario.autorizadoPor} - {new Date(usuario.fechaAutorizacion).toLocaleDateString()}
                  </div>
                </div>
                {usuario.email !== 'admin@cooperativa.com' && esAdminPrincipal && (
                  <button
                    onClick={() => handleDesautorizar(usuario.email)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Desautorizar
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Usuarios registrados */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Usuarios Registrados en el Sistema</h3>
            <button
              onClick={() => setMostrarUsuariosRegistrados(!mostrarUsuariosRegistrados)}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              {mostrarUsuariosRegistrados ? 'Ocultar' : 'Ver Usuarios Registrados'}
            </button>
          </div>

          {mostrarUsuariosRegistrados && (
            <div className="space-y-2">
              {cargando ? (
                <div className="text-center py-4 text-gray-500">Cargando usuarios...</div>
              ) : usuariosRegistrados.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No hay usuarios registrados</div>
              ) : (
                usuariosRegistrados.map((usuario) => (
                  <div key={usuario.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{usuario.nombre} {usuario.apellido}</div>
                      <div className="text-sm text-gray-600">{usuario.email}</div>
                      <div className="text-xs text-gray-500">
                        Registrado: {new Date(usuario.fecha_creacion).toLocaleDateString()}
                        {usuario.fecha_actualizacion && (
                          <span> • Actualizado: {new Date(usuario.fecha_actualizacion).toLocaleDateString()}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          usuario.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {usuario.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {usuario.rol}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCambiarEstadoUsuario(usuario.id, !usuario.activo)}
                        className={`px-3 py-1 text-sm rounded ${
                          usuario.activo 
                            ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {usuario.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      {usuario.email !== 'admin@cooperativa.com' && (
                        <button
                          onClick={() => handleEliminarUsuario(usuario.id, usuario.email)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Formulario para autorizar nuevo administrador */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Autorizar Nuevo Administrador</h3>
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {mostrarFormulario ? 'Cancelar' : 'Agregar Administrador'}
            </button>
          </div>

          {mostrarFormulario && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="nuevo.admin@cooperativa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Apellido *
                </label>
                <input
                  type="text"
                  value={nuevoApellido}
                  onChange={(e) => setNuevoApellido(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apellido"
                />
              </div>
              <div className="md:col-span-3 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setMostrarFormulario(false);
                    setNuevoEmail('');
                    setNuevoNombre('');
                    setNuevoApellido('');
                    setMensaje('');
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAutorizar}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Autorizar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Información importante */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Información Importante</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Solo los emails en esta lista pueden registrarse en el sistema</li>
            <li>• Los administradores autorizados tendrán acceso completo al sistema</li>
            <li>• No se puede desautorizar al administrador principal</li>
            <li>• Los cambios se aplican inmediatamente</li>
          </ul>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionAdministradores;
