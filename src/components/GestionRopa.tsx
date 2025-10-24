'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Asociado } from '@/types/asociado';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';
import { supabaseRopaService } from '@/services/supabaseRopaService';

interface GestionRopaProps {
  empleado: Asociado | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ElementoRopa {
  id: string;
  nombre: string;
  categoria: 'proteccion' | 'uniformes' | 'calzado' | 'accesorios' | 'otros';
  requiere_talla: boolean;
  activo: boolean;
}

interface EntregaRopa {
  id: string;
  asociado_id: string;
  elemento_id: string;
  cantidad: number;
  talla: string | null;
  fecha_entrega: string;
  observaciones: string | null;
  entregado_por: string;
}

// Elementos de ropa por defecto
const ELEMENTOS_ROPA_DEFAULT: ElementoRopa[] = [
  // Protección Personal
  { id: 'casco', nombre: 'Casco', categoria: 'proteccion', requiere_talla: false, activo: true },
  { id: 'arnes', nombre: 'Arnés', categoria: 'proteccion', requiere_talla: false, activo: true },
  { id: 'chaleco', nombre: 'Chaleco', categoria: 'proteccion', requiere_talla: false, activo: true },
  { id: 'guantes', nombre: 'Guantes', categoria: 'proteccion', requiere_talla: false, activo: true },
  { id: 'lentes', nombre: 'Lentes', categoria: 'proteccion', requiere_talla: false, activo: true },
  { id: 'sordina', nombre: 'Sordina', categoria: 'proteccion', requiere_talla: false, activo: true },
  { id: 'barbijo', nombre: 'Barbijo', categoria: 'proteccion', requiere_talla: false, activo: true },
  { id: 'faja', nombre: 'Faja', categoria: 'proteccion', requiere_talla: false, activo: true },
  
  // Uniformes
  { id: 'pantalon', nombre: 'Pantalón', categoria: 'uniformes', requiere_talla: true, activo: true },
  { id: 'remera', nombre: 'Remera', categoria: 'uniformes', requiere_talla: true, activo: true },
  { id: 'campera', nombre: 'Campera', categoria: 'uniformes', requiere_talla: true, activo: true },
  { id: 'camisa', nombre: 'Camisa', categoria: 'uniformes', requiere_talla: true, activo: true },
  { id: 'buzo', nombre: 'Buzo', categoria: 'uniformes', requiere_talla: true, activo: true },
  
  // Calzado
  { id: 'botas', nombre: 'Botas', categoria: 'calzado', requiere_talla: true, activo: true },
  { id: 'zapatillas', nombre: 'Zapatillas', categoria: 'calzado', requiere_talla: true, activo: true },
  { id: 'zapatos', nombre: 'Zapatos', categoria: 'calzado', requiere_talla: true, activo: true },
  { id: 'borcegos', nombre: 'Borcegos', categoria: 'calzado', requiere_talla: true, activo: true },
  
  // Accesorios
  { id: 'gorra', nombre: 'Gorra', categoria: 'accesorios', requiere_talla: false, activo: true },
  { id: 'cinturon', nombre: 'Cinturón', categoria: 'accesorios', requiere_talla: true, activo: true },
  { id: 'medias', nombre: 'Medias', categoria: 'accesorios', requiere_talla: true, activo: true },
];

const CATEGORIAS_ROPA = [
  { value: 'proteccion', label: 'Protección', color: 'bg-red-50 border-red-200' },
  { value: 'uniformes', label: 'Uniformes', color: 'bg-blue-50 border-blue-200' },
  { value: 'calzado', label: 'Calzado', color: 'bg-green-50 border-green-200' },
  { value: 'accesorios', label: 'Accesorios', color: 'bg-yellow-50 border-yellow-200' },
  { value: 'otros', label: 'Otros', color: 'bg-gray-50 border-gray-200' },
];

const TALLAS_DISPONIBLES: Record<string, string[]> = {
  proteccion: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  uniformes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  calzado: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'],
  accesorios: ['Única'],
  otros: ['Única'],
};

// Talles de pantalón 38 a 60
const TALLAS_PANTALON: string[] = Array.from({ length: 60 - 38 + 1 }, (_, i) => String(38 + i));

export default function GestionRopa({ empleado, isOpen, onClose }: GestionRopaProps) {
  const [elementosRopa, setElementosRopa] = useState<ElementoRopa[]>([]);
  const [entregasRopa, setEntregasRopa] = useState<EntregaRopa[]>([]);
  const [elementosSeleccionados, setElementosSeleccionados] = useState<{ [key: string]: { cantidad: number; talla: string } }>({});
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [cargando, setCargando] = useState(false);
  const [planillas, setPlanillas] = useState<Array<{ id: string; nombre: string; dataUrl: string; fecha: string; size?: number; path?: string }>>([]);
  const [entregadoPor, setEntregadoPor] = useState<string>('');

  const { user } = useAuth();

  // Devuelve fecha local en formato YYYY-MM-DD (sin desfase por zona horaria)
  const getLocalYmd = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Normaliza cualquier entrada a YYYY-MM-DD
  const normalizeYmd = (value: string): string => {
    if (!value) return '';
    const raw = String(value);
    const ymd = raw.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return getLocalYmd(d);
    return ymd;
  };

  // Formatea YYYY-MM-DD a dd/mm/yyyy sin crear Date (evita TZ)
  const formatYmdEs = (ymd: string): string => {
    if (!ymd) return '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
    const [y, m, d] = ymd.split('-');
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    if (isOpen && empleado) {
      cargarDatos();
    }
  }, [isOpen, empleado]);

  // Debug: mostrar información de elementos de ropa
  useEffect(() => {
    console.log('🔍 Total elementos de ropa:', elementosRopa.length);
    console.log('🔍 Elementos activos:', elementosRopa.filter(e => e.activo).length);
    console.log('🔍 Elementos por categoría:');
    CATEGORIAS_ROPA.forEach(categoria => {
      const elementosCategoria = elementosRopa.filter(
        elemento => elemento.categoria === categoria.value && elemento.activo
      );
      console.log(`  ${categoria.value}:`, elementosCategoria.length, 'elementos');
    });
  }, [elementosRopa]);

  const cargarDatos = async () => {
    try {
      console.log('🔍 Cargando datos de ropa...');
      
      // Limpiar localStorage para forzar recarga con elementos completos
      localStorage.removeItem('elementos_ropa');
      console.log('🧹 localStorage limpiado, forzando recarga de elementos');
      
      const normalizar = (lista: ElementoRopa[]): ElementoRopa[] => {
        return (lista || []).map((e) => {
          if (e.id === 'chaleco' || e.id === 'guantes' || e.id === 'faja') {
            return { ...e, requiere_talla: false };
          }
          return e;
        });
      };

      // Inicializar con elementos por defecto (lista completa)
      const normalizados = normalizar(ELEMENTOS_ROPA_DEFAULT);
      console.log('🆕 Elementos inicializados por defecto:', normalizados);
      setElementosRopa(normalizados);
      localStorage.setItem('elementos_ropa', JSON.stringify(normalizados));

      // Cargar entregas de ropa (Supabase primero, localStorage como fallback)
      if (empleado?.id) {
        if (isSupabaseConfigured) {
          try {
            const data = await supabaseRopaService.listarPorAsociado(empleado.id as string);
            // Adaptar a la forma local si la tabla usa 'elemento' en lugar de 'elemento_id'
            const normalizadas = (data || []).map((e: any) => ({
              id: e.id,
              asociado_id: e.asociado_id,
              elemento_id: e.elemento_id || 'otros',
              cantidad: e.cantidad,
              talla: e.talla ?? null,
              fecha_entrega: e.fecha_entrega,
              observaciones: e.observaciones ?? null,
              entregado_por: e.entregado_por || ''
            }));
            setEntregasRopa(normalizadas as any);
          } catch {
            const entregasGuardadas = localStorage.getItem('entregas_ropa');
            if (entregasGuardadas) {
              const todasLasEntregas = JSON.parse(entregasGuardadas);
              const entregasDelEmpleado = todasLasEntregas.filter(
                (entrega: EntregaRopa) => entrega.asociado_id === empleado?.id
              );
              setEntregasRopa(entregasDelEmpleado);
            }
          }
        } else {
          const entregasGuardadas = localStorage.getItem('entregas_ropa');
          if (entregasGuardadas) {
            const todasLasEntregas = JSON.parse(entregasGuardadas);
            const entregasDelEmpleado = todasLasEntregas.filter(
              (entrega: EntregaRopa) => entrega.asociado_id === empleado?.id
            );
            setEntregasRopa(entregasDelEmpleado);
          }
        }
      }

      // Inicializar fecha de entrega con la fecha actual (local, sin desfase TZ)
      setFechaEntrega(getLocalYmd(new Date()));
      // Inicializar entregado por con el usuario actual si está disponible (nombre y apellido)
      const nombreCompleto = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();
      setEntregadoPor(nombreCompleto || user?.email || '');

      // Cargar planillas (imágenes) asociadas
      if (empleado?.id) {
        if (isSupabaseConfigured) {
          try {
            console.log('🔍 Cargando planillas para asociado:', empleado.id, 'tipo:', typeof empleado.id);
            const filas = await supabaseStorageService.listarMetadatos('ropa_planilla', String(empleado.id));
            console.log('📋 Metadatos obtenidos:', filas);
            
            // También probar con el ID como número si es string
            if (filas.length === 0 && typeof empleado.id === 'string' && !isNaN(Number(empleado.id))) {
              console.log('🔄 Probando con ID numérico:', Number(empleado.id));
              const filasNum = await supabaseStorageService.listarMetadatos('ropa_planilla', String(Number(empleado.id)));
              console.log('📋 Metadatos con ID numérico:', filasNum);
              if (filasNum.length > 0) {
                filas.push(...filasNum);
              }
            }
            
            // Debug: consulta directa para ver qué hay en la tabla
            try {
              const { data: debugData, error: debugError } = await (supabase as any)
                .from('archivos')
                .select('*')
                .eq('entidad_tipo', 'ropa_planilla');
              console.log('🔍 Debug - Todos los registros de ropa_planilla:', debugData);
              console.log('🔍 Debug - Error:', debugError);
              
              // Debug específico para este asociado
              const { data: debugAsociado, error: debugAsociadoError } = await (supabase as any)
                .from('archivos')
                .select('*')
                .eq('entidad_tipo', 'ropa_planilla')
                .eq('entidad_id', String(empleado.id));
              console.log('🔍 Debug - Registros para asociado específico:', debugAsociado);
              console.log('🔍 Debug - Error asociado específico:', debugAsociadoError);
            } catch (debugErr) {
              console.log('🔍 Debug - Error en consulta directa:', debugErr);
            }
            const items = (filas || []).map((f: any) => {
              const url = supabaseStorageService.urlPublica(f.path) || f.url;
              console.log('🖼️ Procesando archivo:', f.nombre, 'URL:', url);
              return {
                id: f.path, // usamos path como id único
                nombre: f.nombre || f.path?.split('/').pop() || 'planilla.jpg',
                dataUrl: url,
                fecha: f.created_at || f.creado_en || new Date().toISOString(),
                size: f.tamano,
                path: f.path,
              };
            });
            console.log('✅ Planillas procesadas:', items);
            setPlanillas(items);
          } catch (error) {
            console.error('❌ Error cargando planillas:', error);
            // fallback local si falla
            const key = `planillas_ropa_${empleado.id}`;
            const guardadas = localStorage.getItem(key);
            if (guardadas) {
              setPlanillas(JSON.parse(guardadas));
            } else {
              setPlanillas([]);
            }
          }
        } else {
          const key = `planillas_ropa_${empleado.id}`;
          const guardadas = localStorage.getItem(key);
          if (guardadas) {
            setPlanillas(JSON.parse(guardadas));
          } else {
            setPlanillas([]);
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleElementoChange = (elementoId: string, checked: boolean) => {
    if (checked) {
      setElementosSeleccionados(prev => ({
        ...prev,
        [elementoId]: { cantidad: 1, talla: '' }
      }));
    } else {
      setElementosSeleccionados(prev => {
        const nuevos = { ...prev };
        delete nuevos[elementoId];
        return nuevos;
      });
    }
  };

  const handleCantidadChange = (elementoId: string, cantidad: number) => {
    setElementosSeleccionados(prev => ({
      ...prev,
      [elementoId]: { ...prev[elementoId], cantidad }
    }));
  };

  const handleTallaChange = (elementoId: string, talla: string) => {
    setElementosSeleccionados(prev => ({
      ...prev,
      [elementoId]: { ...prev[elementoId], talla }
    }));
  };

  const validarFormulario = () => {
    if (Object.keys(elementosSeleccionados).length === 0) {
      alert('Debe seleccionar al menos un elemento de ropa');
      return false;
    }

    if (!fechaEntrega) {
      alert('Debe seleccionar una fecha de entrega');
      return false;
    }

    if (!entregadoPor.trim()) {
      alert('Debe indicar quién entrega la ropa');
      return false;
    }

    // Validar que los elementos que requieren talla tengan talla seleccionada
    for (const [elementoId, datos] of Object.entries(elementosSeleccionados)) {
      const elemento = elementosRopa.find(e => e.id === elementoId);
      if (elemento?.requiere_talla && !datos.talla) {
        alert(`Debe seleccionar una talla para ${elemento.nombre}`);
        return false;
      }
    }

    return true;
  };

  const handleAgregarEntrega = async () => {
    if (!empleado || !validarFormulario()) return;

    setCargando(true);
    try {
      const nuevasEntregas: EntregaRopa[] = [] as any;
      const entregasExistentes = JSON.parse(localStorage.getItem('entregas_ropa') || '[]');

      for (const [elementoId, datos] of Object.entries(elementosSeleccionados)) {
        const baseEntrega = {
          asociado_id: empleado.id,
          cantidad: (datos as any).cantidad,
          talla: (datos as any).talla || null,
          fecha_entrega: fechaEntrega,
          observaciones: observaciones || null,
          entregado_por: entregadoPor.trim(),
        } as any;

        if (isSupabaseConfigured) {
          // Insertar en Supabase usando elemento_id (preferido)
          console.log('💾 Guardando entrega en Supabase:', {
            ...baseEntrega,
            elemento_id: elementoId,
          });
          
          const created = await (supabaseRopaService as any).registrar({
            ...baseEntrega,
            elemento_id: elementoId,
          });
          
          console.log('✅ Entrega guardada en Supabase:', created);
          
          nuevasEntregas.push({
            id: created.id,
            asociado_id: created.asociado_id,
            elemento_id: created.elemento_id || elementoId,
            cantidad: created.cantidad,
            talla: created.talla ?? null,
            fecha_entrega: normalizeYmd(created.fecha_entrega),
            observaciones: created.observaciones ?? null,
            entregado_por: created.entregado_por || entregadoPor.trim(),
          } as any);
        } else {
          const nuevaEntrega: EntregaRopa = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            elemento_id: elementoId,
            ...baseEntrega,
          } as any;
          nuevasEntregas.push(nuevaEntrega);
          entregasExistentes.push(nuevaEntrega);
        }
      }

      if (!isSupabaseConfigured) {
        // Guardar en localStorage
        localStorage.setItem('entregas_ropa', JSON.stringify(entregasExistentes));
      }

      // Actualizar estado local
      setEntregasRopa(prev => [...prev, ...nuevasEntregas]);

      // Limpiar formulario
      setElementosSeleccionados({});
      setObservaciones('');
      setFechaEntrega(getLocalYmd(new Date()));

      alert('Entregas registradas correctamente');
    } catch (error) {
      console.error('Error al registrar entregas:', error);
      alert('Error al registrar las entregas');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminarEntrega = async (entregaId: string) => {
    try {
      if (isSupabaseConfigured) {
        try { await supabaseRopaService.eliminar(entregaId); } catch {}
      }
      const entregasExistentes = JSON.parse(localStorage.getItem('entregas_ropa') || '[]');
      const entregasActualizadas = entregasExistentes.filter(
        (entrega: EntregaRopa) => entrega.id !== entregaId
      );
      
      localStorage.setItem('entregas_ropa', JSON.stringify(entregasActualizadas));
      setEntregasRopa(prev => prev.filter(entrega => entrega.id !== entregaId));
    } catch (error) {
      console.error('Error al eliminar entrega:', error);
      alert('Error al eliminar la entrega');
    }
  };

  const obtenerNombreElemento = (elementoId: string) => {
    const elemento = elementosRopa.find(e => e.id === elementoId);
    return elemento?.nombre || 'Elemento desconocido';
  };

  const obtenerCategoriaElemento = (elementoId: string) => {
    const elemento = elementosRopa.find(e => e.id === elementoId);
    return elemento?.categoria || 'otros';
  };

  // --- Gestión de Planillas (imágenes) ---
  const keyPlanillas = empleado ? `planillas_ropa_${empleado.id}` : '';

  const handleSubirPlanillas = async (files: FileList | null) => {
    if (!files || !empleado) return;
    const nuevas: Array<{ id: string; nombre: string; dataUrl: string; fecha: string; size?: number; path?: string }> = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (isSupabaseConfigured) {
        try {
          console.log('📤 Subiendo archivo:', file.name, 'para asociado:', empleado.id);
          const carpeta = `ropa/planillas/${empleado.id}`;
          const subida = await supabaseStorageService.subirBase64(carpeta, dataUrl, file.name);
          console.log('✅ Archivo subido:', subida);
          await supabaseStorageService.registrarMetadatosArchivo({
            entidad_tipo: 'ropa_planilla',
            entidad_id: String(empleado.id),
            nombre: file.name,
            path: subida.path,
            url: subida.publicUrl,
            tipo: file.type,
            tamano: file.size,
          });
          console.log('✅ Metadatos registrados para:', file.name);
          nuevas.push({
            id: subida.path,
            nombre: file.name,
            dataUrl: subida.publicUrl || dataUrl,
            fecha: new Date().toISOString(),
            size: file.size,
            path: subida.path,
          });
        } catch (e) {
          console.error('❌ Error subiendo archivo:', e);
          // Si falla, caer a local para no perder la UI
          nuevas.push({ id: Date.now().toString() + Math.random().toString(36).slice(2), nombre: file.name, dataUrl, fecha: new Date().toISOString(), size: file.size });
        }
      } else {
        nuevas.push({ id: Date.now().toString() + Math.random().toString(36).slice(2), nombre: file.name, dataUrl, fecha: new Date().toISOString(), size: file.size });
      }
    }
    const actualizadas = [...planillas, ...nuevas];
    setPlanillas(actualizadas);
    if (!isSupabaseConfigured && keyPlanillas) localStorage.setItem(keyPlanillas, JSON.stringify(actualizadas));
  };

  const eliminarPlanilla = async (id: string) => {
    try {
      if (isSupabaseConfigured) {
        const item = planillas.find(p => p.id === id);
        const path = item?.path || id;
        try { await supabaseStorageService.eliminarMetadatosPorPath(String(path)); } catch {}
        try { await supabaseStorageService.eliminarArchivo(String(path)); } catch {}
      }
    } catch {}
    const actualizadas = planillas.filter(p => p.id !== id);
    setPlanillas(actualizadas);
    if (!isSupabaseConfigured && keyPlanillas) localStorage.setItem(keyPlanillas, JSON.stringify(actualizadas));
  };

  const descargarPlanilla = (p: { nombre: string; dataUrl: string }) => {
    const a = document.createElement('a');
    a.href = p.dataUrl;
    a.download = p.nombre || 'planilla.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen || !empleado) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Gestión de Ropa - {empleado.nombre} {empleado.apellido}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Cerrar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario de entrega */}
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-700">Nueva Entrega</h4>
              
              {/* Filtro por categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por categoría
                </label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {CATEGORIAS_ROPA.map(categoria => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de elementos de ropa */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {CATEGORIAS_ROPA.map(categoria => {
                  const elementosCategoria = elementosRopa.filter(
                    elemento => elemento.categoria === categoria.value && elemento.activo
                  );
                  
                  if (elementosCategoria.length === 0) return null;
                  if (filtroCategoria && categoria.value !== filtroCategoria) return null;

                  return (
                    <div key={categoria.value} className={`p-3 rounded-lg border ${categoria.color}`}>
                      <h5 className="font-medium text-gray-800 mb-2">{categoria.label}</h5>
                      <div className="space-y-2">
                        {elementosCategoria.map(elemento => (
                          <div key={elemento.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={elemento.id}
                              checked={!!elementosSeleccionados[elemento.id]}
                              onChange={(e) => handleElementoChange(elemento.id, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor={elemento.id} className="flex-1 text-sm text-gray-700">
                              {elemento.nombre}
                            </label>
                            
                            {elementosSeleccionados[elemento.id] && (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={elementosSeleccionados[elemento.id].cantidad}
                                  onChange={(e) => handleCantidadChange(elemento.id, parseInt(e.target.value))}
                                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                
                                {elemento.requiere_talla && (
                                  <select
                                    value={elementosSeleccionados[elemento.id].talla}
                                    onChange={(e) => handleTallaChange(elemento.id, e.target.value)}
                                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="">Talla</option>
                                    <option value="S/T">S/T (sin talle)</option>
                                    {(elemento.id === 'pantalon' ? TALLAS_PANTALON : TALLAS_DISPONIBLES[elemento.categoria]).map(talla => (
                                      <option key={talla} value={talla}>{talla}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fecha de entrega */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de entrega
                </label>
                <input
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              {/* Entregado por */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entregado por (responsable)
                </label>
                <input
                  type="text"
                  value={entregadoPor}
                  onChange={(e) => setEntregadoPor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre o email del responsable"
                />
              </div>

              {/* Botón de guardar */}
              <button
                onClick={handleAgregarEntrega}
                disabled={cargando}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {cargando ? 'Registrando...' : 'Registrar Entrega'}
              </button>
            </div>

            <div className="space-y-6">
              {/* Historial de entregas */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700">Historial de Entregas</h4>
                {entregasRopa.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay entregas registradas</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {entregasRopa.map(entrega => (
                      <div key={entrega.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-800">
                                {obtenerNombreElemento(entrega.elemento_id)}
                              </span>
                              <span className="text-sm text-gray-500">
                                x{entrega.cantidad}
                              </span>
                              {entrega.talla && (
                                <span className="text-sm text-gray-500">
                                  Talla: {entrega.talla}
                                </span>
                              )}
                            </div>
                          <div className="text-sm text-gray-600">
                            {formatYmdEs(normalizeYmd(entrega.fecha_entrega as any))} • Entregada por: <span className="font-medium text-gray-800">{entrega.entregado_por}</span>
                          </div>
                            {entrega.observaciones && (
                              <div className="text-sm text-gray-500 mt-1">
                                {entrega.observaciones}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleEliminarEntrega(entrega.id)}
                            className="text-red-600 hover:text-red-800 ml-2"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Planillas de entrega (imágenes) */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-gray-700">Planillas de Entrega (imágenes)</h4>
                <div className="p-3 bg-gray-50 border rounded">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleSubirPlanillas(e.target.files)}
                    className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <p className="text-xs text-gray-500 mt-2">Formatos: JPG, PNG, GIF. Máx 2-5MB por imagen recomendado.</p>
                </div>

                {planillas.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay planillas cargadas</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                    {planillas.map((p) => (
                      <div key={p.id} className="border rounded p-2 bg-white">
                        <img src={p.dataUrl} alt={p.nombre} className="w-full h-28 object-cover rounded" />
                        <div className="mt-2 text-xs text-gray-600 truncate" title={p.nombre}>{p.nombre}</div>
                        <div className="flex justify-between mt-2">
                          <button
                            onClick={() => descargarPlanilla(p)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Descargar
                          </button>
                          <button
                            onClick={() => eliminarPlanilla(p.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}