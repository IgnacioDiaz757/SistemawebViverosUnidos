'use client';

import { useState, useRef, useEffect } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { supabasePerfilesService } from '@/services/supabasePerfilesService';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import { isSupabaseConfigured } from '@/lib/supabase';

interface DatosPersonales {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
}

interface CambioPassword {
  passwordActual: string;
  passwordNueva: string;
  confirmarPassword: string;
}

export default function PerfilAdministrativa() {
  const { user } = useSupabaseAuth();
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  
  const inputFileRef = useRef<HTMLInputElement>(null);

  const [datosPersonales, setDatosPersonales] = useState<DatosPersonales>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: ''
  });

  const [cambioPassword, setCambioPassword] = useState<CambioPassword>({
    passwordActual: '',
    passwordNueva: '',
    confirmarPassword: ''
  });

  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  };

  const handleCambiarFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      mostrarMensaje('error', 'Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      mostrarMensaje('error', 'La imagen debe ser menor a 2MB');
      return;
    }

    setLoading(true);
    try {
      // Convertir a base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        if (!base64Data) return;

        try {
          // Debug: Verificar autenticación
          console.log('=== DEBUG UPLOAD ===');
          console.log('User:', user);
          console.log('User ID:', user?.id);
          console.log('Is Supabase configured:', isSupabaseConfigured);
          
          // Subir a Storage
          const carpeta = `perfiles/${user.id}`;
          const fileName = `foto_perfil_${Date.now()}.jpg`;
          console.log('Carpeta:', carpeta);
          console.log('FileName:', fileName);
          
          const uploadResult = await supabaseStorageService.subirBase64(carpeta, base64Data, fileName);
          
          // Guardar en base de datos
          await supabasePerfilesService.guardarPerfil({
            user_id: user.id,
            foto_perfil: uploadResult.publicUrl,
            nombre_completo: `${datosPersonales.nombre} ${datosPersonales.apellido}`.trim(),
            email: datosPersonales.email,
            telefono: datosPersonales.telefono,
          });

          setFotoUrl(uploadResult.publicUrl || base64Data);
          
          // Disparar evento personalizado para actualizar navbar
          window.dispatchEvent(new CustomEvent('perfilUpdated'));
          
          mostrarMensaje('success', 'Foto actualizada correctamente');
        } catch (error) {
          console.error('Error subiendo foto:', error);
          mostrarMensaje('error', 'Error al subir la foto');
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error procesando foto:', error);
      mostrarMensaje('error', 'Error al procesar la imagen');
      setLoading(false);
    }
  };

  const handleGuardarDatos = async () => {
    console.log('=== INICIO handleGuardarDatos ===');
    console.log('User:', user);
    console.log('Datos personales:', datosPersonales);
    
    if (!user?.id) {
      console.error('No hay user.id');
      mostrarMensaje('error', 'No se pudo identificar al usuario');
      return;
    }
    
    setLoading(true);
    
    try {
      // Validaciones
      if (!datosPersonales.nombre.trim() || !datosPersonales.apellido.trim()) {
        mostrarMensaje('error', 'Nombre y apellido son requeridos');
        return;
      }

      if (!datosPersonales.email.trim()) {
        mostrarMensaje('error', 'Email es requerido');
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      console.log('Validando email:', datosPersonales.email, 'Resultado:', emailRegex.test(datosPersonales.email));
      if (!emailRegex.test(datosPersonales.email)) {
        mostrarMensaje('error', 'Formato de email inválido');
        return;
      }

      console.log('Llamando a guardarPerfil...');
      // Guardar en base de datos
      await supabasePerfilesService.guardarPerfil({
        user_id: user.id,
        nombre_completo: `${datosPersonales.nombre} ${datosPersonales.apellido}`.trim(),
        email: datosPersonales.email,
        telefono: datosPersonales.telefono,
        cargo: 'Administradora',
      });

      console.log('Perfil guardado exitosamente');
      // Disparar evento personalizado para actualizar navbar
      window.dispatchEvent(new CustomEvent('perfilUpdated'));

      setEditandoDatos(false);
      mostrarMensaje('success', 'Datos personales actualizados correctamente');
    } catch (error) {
      console.error('Error guardando datos:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error stringified:', JSON.stringify(error, null, 2));
      console.error('Error details:', {
        message: (error as any)?.message,
        code: (error as any)?.code,
        details: (error as any)?.details,
        hint: (error as any)?.hint
      });
      mostrarMensaje('error', (error as any)?.message || 'Error al actualizar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarPassword = async () => {
    setLoading(true);

    try {
      // Validaciones
      if (!cambioPassword.passwordActual || !cambioPassword.passwordNueva || !cambioPassword.confirmarPassword) {
        mostrarMensaje('error', 'Todos los campos de contraseña son requeridos');
        return;
      }

      if (cambioPassword.passwordNueva.length < 6) {
        mostrarMensaje('error', 'La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }

      if (cambioPassword.passwordNueva !== cambioPassword.confirmarPassword) {
        mostrarMensaje('error', 'Las contraseñas nuevas no coinciden');
        return;
      }

      // Verificar contraseña actual (simulado para desarrollo)
      if (cambioPassword.passwordActual !== '123456') {
        mostrarMensaje('error', 'La contraseña actual es incorrecta');
        return;
      }

      // En un sistema real, aquí harías la llamada a la API
      // Por ahora, solo simulamos el cambio
      mostrarMensaje('success', 'Contraseña cambiada correctamente');
      setCambioPassword({
        passwordActual: '',
        passwordNueva: '',
        confirmarPassword: ''
      });
      setCambiandoPassword(false);
    } catch (error) {
      mostrarMensaje('error', 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos del perfil al montar el componente
  useEffect(() => {
    const cargarPerfil = async () => {
      if (!user?.id) return;

      try {
        // Cargar desde base de datos
        const perfil = await supabasePerfilesService.obtenerPerfil(user.id);
        
        if (perfil) {
          // Cargar foto
          if (perfil.foto_perfil) {
            setFotoUrl(perfil.foto_perfil);
          }
          
          // Actualizar datos personales
          const nombreCompleto = perfil.nombre_completo?.split(' ') || [];
          setDatosPersonales({
            nombre: nombreCompleto[0] || user?.user_metadata?.nombre || '',
            apellido: nombreCompleto.slice(1).join(' ') || user?.user_metadata?.apellido || '',
            email: perfil.email || user?.email || '',
            telefono: perfil.telefono || '',
            direccion: '' // No tenemos campo direccion en la BD
          });
        } else {
          // Fallback a datos de sesión
          setDatosPersonales({
            nombre: user?.user_metadata?.nombre || '',
            apellido: user?.user_metadata?.apellido || '',
            email: user?.email || '',
            telefono: '',
            direccion: ''
          });
        }
      } catch (error) {
        console.error('Error cargando perfil:', error);
        // Fallback a datos de sesión
        setDatosPersonales({
          nombre: user?.user_metadata?.nombre || '',
          apellido: user?.user_metadata?.apellido || '',
          email: user?.email || '',
          telefono: '',
          direccion: ''
        });
      }
    };

    cargarPerfil();
  }, [user?.id, user?.email, user?.user_metadata]);

  return (
    <div className="space-y-6">
      {/* Mensaje de estado */}
      {mensaje && (
        <div 
          className={`p-4 rounded-md ${
            mensaje.tipo === 'success' 
              ? 'border' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
          style={mensaje.tipo === 'success' ? {
            backgroundColor: '#F3E5F2',
            borderColor: '#C70CB9',
            color: '#C70CB9'
          } : {}}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {mensaje.tipo === 'success' ? '✅' : '❌'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{mensaje.texto}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sección de Foto de Perfil */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📸 Foto de Perfil</h3>
        
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt="Foto de perfil"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold border-4 border-gray-200">
                {(user?.user_metadata?.nombre || user?.email || '').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Cambiar foto de perfil
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              Sube una imagen JPG, PNG o GIF. Máximo 2MB.
            </p>
            <input
              type="file"
              ref={inputFileRef}
              onChange={handleCambiarFoto}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => inputFileRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              📁 Seleccionar Imagen
            </button>
          </div>
        </div>
      </div>

      {/* Sección de Datos Personales */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">👤 Datos Personales</h3>
          <button
            onClick={() => setEditandoDatos(!editandoDatos)}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {editandoDatos ? '❌ Cancelar' : '✏️ Editar'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            {editandoDatos ? (
              <input
                type="text"
                value={datosPersonales.nombre}
                onChange={(e) => setDatosPersonales(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {datosPersonales.nombre}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido
            </label>
            {editandoDatos ? (
              <input
                type="text"
                value={datosPersonales.apellido}
                onChange={(e) => setDatosPersonales(prev => ({ ...prev, apellido: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {datosPersonales.apellido}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            {editandoDatos ? (
              <input
                type="email"
                value={datosPersonales.email}
                onChange={(e) => setDatosPersonales(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {datosPersonales.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            {editandoDatos ? (
              <input
                type="tel"
                value={datosPersonales.telefono || ''}
                onChange={(e) => setDatosPersonales(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: +54 11 1234-5678"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {datosPersonales.telefono || 'No especificado'}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            {editandoDatos ? (
              <input
                type="text"
                value={datosPersonales.direccion || ''}
                onChange={(e) => setDatosPersonales(prev => ({ ...prev, direccion: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Av. Corrientes 1234, CABA"
              />
            ) : (
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {datosPersonales.direccion || 'No especificada'}
              </p>
            )}
          </div>
        </div>

        {editandoDatos && (
          <div className="mt-4 flex justify-end space-x-3">
            <button
              onClick={() => setEditandoDatos(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardarDatos}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 transition-colors"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        )}
      </div>

      {/* Sección de Cambio de Contraseña */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🔒 Seguridad</h3>
          <button
            onClick={() => setCambiandoPassword(!cambiandoPassword)}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {cambiandoPassword ? '❌ Cancelar' : '🔑 Cambiar Contraseña'}
          </button>
        </div>

        {!cambiandoPassword ? (
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-600">
              Tu contraseña está protegida. Haz clic en "Cambiar Contraseña" para actualizarla.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Última actualización: No disponible
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={cambioPassword.passwordActual}
                onChange={(e) => setCambioPassword(prev => ({ ...prev, passwordActual: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={cambioPassword.passwordNueva}
                onChange={(e) => setCambioPassword(prev => ({ ...prev, passwordNueva: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={cambioPassword.confirmarPassword}
                onChange={(e) => setCambioPassword(prev => ({ ...prev, confirmarPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCambiandoPassword(false);
                  setCambioPassword({ passwordActual: '', passwordNueva: '', confirmarPassword: '' });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCambiarPassword}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-red-300 transition-colors"
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
