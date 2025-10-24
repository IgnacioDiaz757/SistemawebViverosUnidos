'use client';

import React, { useState, useEffect } from 'react';
import { Asociado, ArchivoAdjunto } from '@/types/asociado';
import { useAuth } from '@/context/AuthContext';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';
// Persistencia local de archivos por asociado usando localStorage

interface GestionArchivosProps {
  asociado: Asociado;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (asociadoActualizado: Asociado) => void;
}

const GestionArchivos: React.FC<GestionArchivosProps> = ({ 
  asociado, 
  isOpen,  
  onClose, 
  onUpdate 
}) => {
  const { user } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [nuevoArchivo, setNuevoArchivo] = useState({
    descripcion: '',
    categoria: 'otro' as ArchivoAdjunto['categoria']
  });
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [subiendo, setSubiendo] = useState(false);
  const [archivos, setArchivos] = useState<any[]>([]);

  const categorias = [
    { value: 'contrato', label: 'Contrato', icon: '📄', color: 'blue' },
    { value: 'medico', label: 'Médico', icon: '🏥', color: 'red' },
    { value: 'identificacion', label: 'Identificación', icon: '🆔', color: 'green' },
    { value: 'certificado', label: 'Certificado', icon: '🏆', color: 'yellow' },
    { value: 'otro', label: 'Otro', icon: '📎', color: 'gray' }
  ];

  // Helpers de storage
  const storageKey = `asociados_archivos_${asociado?.id}`;

  const readArchivos = async (): Promise<any[]> => {
    if (!asociado?.id) return [];
    if (isSupabaseConfigured) {
      // Preferir metadatos desde la tabla 'archivos' para mantener descripcion/categoria/tamaño
      try {
        const meta = await (supabaseStorageService as any).listarMetadatos('asociado', asociado.id);
        if (Array.isArray(meta) && meta.length > 0) {
          const archivos = meta.map((m: any) => ({
            id: m.path,
            asociado_id: asociado.id,
            nombre: m.nombre,
            tipo: m.tipo,
            url: m.url || supabaseStorageService.urlPublica(m.path),
            tamaño: m.tamano || m.size,
            categoria: m.categoria || 'otro',
            descripcion: m.extra?.descripcion || m.descripcion || '',
            fechaSubida: new Date(m.created_at || m.fecha_subida || Date.now()).getTime(),
            subidoPor: m.owner_id || user?.email || 'usuario',
            path: m.path,
          }));
          return archivos;
        }
        // Fallback a listar directo del bucket si aún no hay metadatos
        const carpeta = `asociados/${asociado.id}`;
        const lista = await (supabaseStorageService as any).listarCarpeta(carpeta);
        const archivos = (lista || []).map((f: any) => ({
          id: f.path,
          asociado_id: asociado.id,
          nombre: f.name,
          tipo: undefined,
          url: f.url,
          tamaño: f.size,
          categoria: 'otro',
          descripcion: '',
          fechaSubida: f.createdAt ? new Date(f.createdAt).getTime() : Date.now(),
          subidoPor: user?.email || 'usuario',
          path: f.path,
        }));
        return archivos.sort((a: any, b: any) => (b.fechaSubida || 0) - (a.fechaSubida || 0));
      } catch (e) {
        console.error('Error listando archivos de asociados', e);
        return [];
      }
    }
    // Local fallback
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
  };

  const writeArchivos = async (lista: any[]) => {
    if (!asociado?.id) return;
    if (isSupabaseConfigured) {
      // No persistimos metadatos en DB aún; se listan directo desde Storage
      return;
    }
    if (typeof window === 'undefined') return;
    localStorage.setItem(storageKey, JSON.stringify(lista));
  };

  // Cargar archivos desde localStorage
  useEffect(() => {
    if (isOpen) {
      cargarArchivos();
    }
  }, [isOpen, asociado.id]);

  const cargarArchivos = async () => {
    try {
      const data = await readArchivos();
      setArchivos(data || []);
    } catch (error) {
      console.error('Error al cargar archivos:', error);
    }
  };

  const validarFormulario = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!archivoSeleccionado) {
      nuevosErrores.archivo = 'Debe seleccionar un archivo';
    } else {
      // Validar tamaño (máximo 10MB)
      if (archivoSeleccionado.size > 10 * 1024 * 1024) {
        nuevosErrores.archivo = 'El archivo no puede superar los 10MB';
      }

      // Validar tipos permitidos
      const tiposPermitidos = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];

      if (!tiposPermitidos.includes(archivoSeleccionado.type)) {
        nuevosErrores.archivo = 'Tipo de archivo no permitido. Use PDF, imágenes, Word, Excel o texto plano';
      }
    }

    if (!nuevoArchivo.descripcion.trim()) {
      nuevosErrores.descripcion = 'La descripción es obligatoria';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const convertirArchivoABase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setSubiendo(true);

    try {
      // Convertir a base64 (data URL)
      const dataUrl = await convertirArchivoABase64(archivoSeleccionado!);

      let nuevo: any;
      if (isSupabaseConfigured) {
        // Subir a Storage y registrar metadatos en tabla 'archivos'
        const carpeta = `asociados/${asociado.id}`;
        const up = await supabaseStorageService.subirBase64(carpeta, dataUrl, archivoSeleccionado!.name);
        try {
          await (supabaseStorageService as any).registrarMetadatosArchivo({
            entidad_tipo: 'asociado',
            entidad_id: asociado.id,
            nombre: archivoSeleccionado!.name,
            path: up.path,
            url: up.publicUrl,
            tipo: archivoSeleccionado!.type,
            tamano: archivoSeleccionado!.size,
            categoria: nuevoArchivo.categoria,
            extra: { descripcion: nuevoArchivo.descripcion },
          });
        } catch {}
        nuevo = {
          id: up.path,
          asociado_id: asociado.id,
          nombre: archivoSeleccionado!.name,
          tipo: archivoSeleccionado!.type,
          url: up.publicUrl,
          tamaño: archivoSeleccionado!.size,
          categoria: nuevoArchivo.categoria,
          descripcion: nuevoArchivo.descripcion,
          fechaSubida: Date.now(),
          subidoPor: user?.email || 'usuario',
          path: up.path,
        };
      } else {
        nuevo = {
          id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
          asociado_id: asociado.id,
          nombre: archivoSeleccionado!.name,
          tipo: archivoSeleccionado!.type,
          url: dataUrl,
          tamaño: archivoSeleccionado!.size,
          categoria: nuevoArchivo.categoria,
          descripcion: nuevoArchivo.descripcion,
          fechaSubida: Date.now(),
          subidoPor: user?.email || 'usuario',
        };
      }

      const lista = isSupabaseConfigured ? [...archivos, nuevo] : [...(await readArchivos()), nuevo];
      await writeArchivos(lista);

      await cargarArchivos();

      // Resetear formulario
      setNuevoArchivo({ descripcion: '', categoria: 'otro' });
      setArchivoSeleccionado(null);
      setErrores({});
      setMostrarFormulario(false);

    } catch (error) {
      console.error('Error al procesar archivo:', error);
      setErrores({ archivo: 'Error al procesar el archivo' });
    } finally {
      setSubiendo(false);
    }
  };

  const eliminarArchivo = async (archivoId: string) => {
    if (!confirm('¿Está seguro que desea eliminar este archivo?')) return;
    try {
      if (isSupabaseConfigured) {
        // Eliminar del bucket y de la tabla 'archivos'
        const target = archivos.find((a: any) => a.id === archivoId);
        const path = target?.path || archivoId;
        try { await (supabaseStorageService as any).eliminarArchivo(path); } catch {}
        try { await (supabaseStorageService as any).eliminarMetadatosPorPath(path); } catch {}
        await cargarArchivos();
        return;
      }
      const lista = await readArchivos();
      const nueva = lista.filter((a: any) => a.id !== archivoId);
      await writeArchivos(nueva);
      await cargarArchivos();
    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      alert('Error al eliminar el archivo');
    }
  };

  const descargarArchivo = async (archivo: any) => {
    try {
      const link = document.createElement('a');
      link.href = archivo.url;
      link.download = archivo.nombre;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      alert('Error al descargar el archivo');
    }
  };

  const formatearTamaño = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const obtenerIconoCategoria = (categoria: string) => {
    const cat = categorias.find(c => c.value === categoria);
    return cat ? cat.icon : '📎';
  };

  const obtenerColorCategoria = (categoria: string) => {
    const cat = categorias.find(c => c.value === categoria);
    if (!cat) return 'gray';
    
    const colores = {
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      green: '',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    
    return colores[cat.color as keyof typeof colores];
  };

  // Validar que el asociado existe y que archivosAdjuntos sea un array
  if (!isOpen || !asociado) return null;
  
  const archivosFiltrados = filtroCategoria === 'todos' 
    ? archivos 
    : archivos.filter(archivo => archivo.categoria === filtroCategoria);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-5xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              📁 Archivos Adjuntos - {asociado.nombre} {asociado.apellido}
            </h3>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-600">
                📋 Legajo: {asociado.legajo}
              </span>
              <span className="text-sm text-gray-600">
                🏢 {asociado.contratista}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                asociado.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {asociado.activo ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Total Archivos</p>
            <p className="text-2xl font-bold text-blue-700">{archivos.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Contratos</p>
            <p className="text-2xl font-bold text-green-700">
              {archivos.filter(a => a.categoria === 'contrato').length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600 font-medium">Médicos</p>
            <p className="text-2xl font-bold text-red-700">
              {archivos.filter(a => a.categoria === 'medico').length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-600 font-medium">Certificados</p>
            <p className="text-2xl font-bold text-yellow-700">
              {archivos.filter(a => a.categoria === 'certificado').length}
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setMostrarFormulario(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            📎 Adjuntar Archivo
          </button>
          
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Lista de archivos */}
        <div className="bg-white rounded-lg border">
          {archivosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {archivos.length === 0 
                ? '📁 No hay archivos adjuntos'
                : 'No se encontraron archivos con el filtro aplicado'
              }
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {archivosFiltrados.map((archivo) => (
                <div key={archivo.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{obtenerIconoCategoria(archivo.categoria)}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate" title={archivo.nombre}>
                          {archivo.nombre}
                        </h4>
                        <p className="text-xs text-gray-500">{formatearTamaño(archivo.tamaño)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarArchivo(archivo.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Eliminar archivo"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className="mb-3">
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${obtenerColorCategoria(archivo.categoria)}`}
                      style={categorias.find(c => c.value === archivo.categoria)?.color === 'green' ? {
                        backgroundColor: '#F3E5F2',
                        color: '#C70CB9'
                      } : {}}
                    >
                      {categorias.find(c => c.value === archivo.categoria)?.label}
                    </span>
                  </div>

                  {archivo.descripcion && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {archivo.descripcion}
                    </p>
                  )}

                  <div className="text-xs text-gray-500 mb-3">
                    <p>📅 {new Date(archivo.fechaSubida).toLocaleDateString('es-ES')}</p>
                    <p>👤 {archivo.subidoPor}</p>
                  </div>

                  <button
                    onClick={() => descargarArchivo(archivo)}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    📥 Descargar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de formulario para nuevo archivo */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xl font-bold text-gray-900">📎 Adjuntar Nuevo Archivo</h4>
                <button
                  onClick={() => {
                    setMostrarFormulario(false);
                    setErrores({});
                    setNuevoArchivo({ descripcion: '', categoria: 'otro' });
                    setArchivoSeleccionado(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Archivo *
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setArchivoSeleccionado(e.target.files?.[0] || null)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.archivo ? 'border-red-500' : 'border-gray-300'
                    }`}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.txt"
                  />
                  {errores.archivo && <p className="text-red-500 text-xs mt-1">{errores.archivo}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Archivos permitidos: PDF, imágenes, Word, Excel, texto plano (máximo 10MB)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={nuevoArchivo.categoria}
                    onChange={(e) => setNuevoArchivo(prev => ({...prev, categoria: e.target.value as ArchivoAdjunto['categoria']}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    value={nuevoArchivo.descripcion}
                    onChange={(e) => setNuevoArchivo(prev => ({...prev, descripcion: e.target.value}))}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.descripcion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Describa el contenido del archivo..."
                  />
                  {errores.descripcion && <p className="text-red-500 text-xs mt-1">{errores.descripcion}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setErrores({});
                      setNuevoArchivo({ descripcion: '', categoria: 'otro' });
                      setArchivoSeleccionado(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    disabled={subiendo}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                    disabled={subiendo}
                  >
                    {subiendo ? '📤 Subiendo...' : '💾 Adjuntar Archivo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionArchivos;
