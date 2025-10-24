import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';

// Implementación mock en localStorage
export interface AccidenteInsert {
  nombre: string;
  apellido: string;
  dni?: string | null;
  fecha_nacimiento?: string | null;
  cuil?: string | null;
  contratista_id?: string | null;
  obra_direccion?: string | null;
  nro_siniestro?: string | null;
  descripcion?: string | null;
  observaciones?: string | null;
  tipologia?: string | null;
  severidad?: string | null;
  fecha_accidente?: string | null;
  nombre_seguro?: string | null;
  creado_por_id?: string | null;
}

export interface AccidenteUpdate {
  [key: string]: any;
}

const STORAGE_KEY = 'accidentes';

function readAccidentes(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeAccidentes(data: any[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const localImpl = {
  async obtenerAccidentes() {
    const data = readAccidentes();
    const normalizados = data.map((a: any) => ({
      ...a,
      // Claves camelCase para la UI
      fechaAccidente: a.fechaAccidente || a.fecha_accidente,
      tipoAccidente: a.tipoAccidente || a.severidad || 'leve',
      nombreSeguro: a.nombreSeguro || a.nombre_seguro || '',
      observacionesDiarias: a.observacionesDiarias || a.observaciones_diarias || [],
    }));
    return normalizados.sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0));
  },
  async obtenerAccidente(id: string) {
    const lista = readAccidentes();
    const a = lista.find((x: any) => x.id === id);
    if (!a) return null;
    return {
      ...a,
      fechaAccidente: a.fechaAccidente || a.fecha_accidente,
      tipoAccidente: a.tipoAccidente || a.severidad || 'leve',
      nombreSeguro: a.nombreSeguro || a.nombre_seguro || '',
      observacionesDiarias: a.observacionesDiarias || a.observaciones_diarias || [],
    };
  },

  async crearAccidente(payload: AccidenteInsert) {
    const lista = readAccidentes();
    const nuevo = {
      id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
      nombre: payload.nombre,
      apellido: payload.apellido,
      dni: payload.dni ?? null,
      fecha_accidente: payload.fecha_accidente ?? new Date().toISOString(),
      fechaAccidente: payload.fecha_accidente ?? new Date().toISOString(),
      severidad: payload.severidad ?? 'leve',
      tipoAccidente: payload.severidad ?? 'leve',
      estado: 'reportado',
      nombre_seguro: payload.nombre_seguro ?? '',
      nombreSeguro: payload.nombre_seguro ?? '',
      descripcion: payload.descripcion ?? '',
      observaciones: payload.observaciones ?? '',
      observaciones_diarias: [],
      observacionesDiarias: [],
      created_at: Date.now(),
    };
    lista.push(nuevo);
    writeAccidentes(lista);
  },

  async actualizarAccidente(id: string, update: AccidenteUpdate) {
    const lista = readAccidentes();
    const idx = lista.findIndex((a: any) => a.id === id);
    if (idx >= 0) {
      const merged = { ...lista[idx], ...update };
      // Mantener ambas formas de claves coherentes
      if (merged.fechaAccidente && !merged.fecha_accidente) merged.fecha_accidente = merged.fechaAccidente;
      if (merged.fecha_accidente && !merged.fechaAccidente) merged.fechaAccidente = merged.fecha_accidente;
      if (merged.tipoAccidente && !merged.severidad) merged.severidad = merged.tipoAccidente;
      if (merged.severidad && !merged.tipoAccidente) merged.tipoAccidente = merged.severidad;
      if (merged.nombreSeguro && !merged.nombre_seguro) merged.nombre_seguro = merged.nombreSeguro;
      if (merged.nombre_seguro && !merged.nombreSeguro) merged.nombreSeguro = merged.nombre_seguro;
      if (merged.observacionesDiarias && !merged.observaciones_diarias) merged.observaciones_diarias = merged.observacionesDiarias;
      if (merged.observaciones_diarias && !merged.observacionesDiarias) merged.observacionesDiarias = merged.observaciones_diarias;
      lista[idx] = merged;
      writeAccidentes(lista);
    }
  },

  async eliminarAccidente(id: string) {
    const lista = readAccidentes();
    const nueva = lista.filter((a: any) => a.id !== id);
    writeAccidentes(nueva);
  },

  async agregarArchivo(id: string, archivo: { nombre: string; contenido: string; tipo?: string; tamano?: number; categoria?: string }) {
    const lista = readAccidentes();
    const idx = lista.findIndex((a: any) => a.id === id);
    if (idx >= 0) {
      const acc = lista[idx];
      const adj = acc.archivos || [];
      const nuevo = {
        id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
        nombre: archivo.nombre,
        contenido: archivo.contenido,
        tipo: archivo.tipo || 'image',
        tamano: archivo.tamano || archivo.contenido?.length || 0,
        categoria: archivo.categoria || 'documento',
        fecha_subida: new Date().toISOString(),
      };
      const actualizado = { ...acc, archivos: [...adj, nuevo] };
      lista[idx] = actualizado;
      writeAccidentes(lista);
      return nuevo;
    }
  },

  async eliminarArchivo(id: string, archivoId: string) {
    const lista = readAccidentes();
    const idx = lista.findIndex((a: any) => a.id === id);
    if (idx >= 0) {
      const acc = lista[idx];
      const adj = (acc.archivos || []).filter((f: any) => f.id !== archivoId);
      lista[idx] = { ...acc, archivos: adj };
      writeAccidentes(lista);
    }
  },
  async agregarObservacionDiaria(id: string, observacion: any) {
    const lista = readAccidentes();
    const idx = lista.findIndex((a: any) => a.id === id);
    if (idx >= 0) {
      const acc = lista[idx];
      const arr = Array.isArray(acc.observacionesDiarias) ? acc.observacionesDiarias : [];
      const updated = { ...acc, observacionesDiarias: [...arr, observacion], observaciones_diarias: [...(acc.observaciones_diarias || []), observacion] };
      lista[idx] = updated;
      writeAccidentes(lista);
      return updated;
    }
  },
};

// Implementación Supabase (CRUD básico). Archivos se migrarán con Storage en una tarea aparte
const supabaseImpl = {
  async obtenerAccidentes() {
    const { data, error } = await supabase
      .from('accidentes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const normalizados = (data || []).map((a: any) => ({
      ...a,
      fechaAccidente: a.fechaAccidente || a.fecha_accidente,
      tipoAccidente: a.tipoAccidente || a.severidad || 'leve',
      nombreSeguro: a.nombreSeguro || a.nombre_seguro || '',
      observacionesDiarias: a.observacionesDiarias || a.observaciones_diarias || [],
    }));
    return normalizados;
  },
  async obtenerAccidente(id: string) {
    const { data, error } = await supabase
      .from('accidentes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    if (!data) return null;
    const a: any = data;
    return {
      ...a,
      fechaAccidente: a.fechaAccidente || a.fecha_accidente,
      tipoAccidente: a.tipoAccidente || a.severidad || 'leve',
      nombreSeguro: a.nombreSeguro || a.nombre_seguro || '',
      observacionesDiarias: a.observacionesDiarias || a.observaciones_diarias || [],
    };
  },
  async crearAccidente(payload: AccidenteInsert) {
    // Obtener usuario autenticado para asociar creado_por_id si falta
    let userId: string | null = null;
    try {
      const { data: authData } = await (supabase as any).auth.getUser();
      userId = authData?.user?.id || null;
    } catch {}

    // Normalizar payload y defaults para evitar errores 400 por tipos o NOT NULL
    const insert = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      dni: payload.dni ?? null,
      fecha_nacimiento: payload.fecha_nacimiento ?? null,
      cuil: payload.cuil ?? null,
      contratista_id: payload.contratista_id ?? null,
      obra_direccion: payload.obra_direccion ?? null,
      nro_siniestro: payload.nro_siniestro ?? null,
      descripcion: payload.descripcion ?? null,
      observaciones: payload.observaciones ?? null,
      tipologia: payload.tipologia ?? null,
      severidad: payload.severidad ?? 'leve',
      fecha_accidente: payload.fecha_accidente ?? new Date().toISOString(),
      nombre_seguro: payload.nombre_seguro ?? null,
      creado_por_id: payload.creado_por_id ?? userId,
      observaciones_diarias: [],
    } as any;
    const { data, error } = await supabase.from('accidentes').insert(insert).select('*').single();
    if (error) throw error;
    return data;
  },
  async actualizarAccidente(id: string, update: AccidenteUpdate) {
    // Mapear camelCase -> snake_case y filtrar sólo columnas válidas para evitar PGRST204
    const src: any = { ...update };
    const mapped: Record<string, any> = {};
    // Mapeos específicos
    if (src.fechaAccidente != null) mapped.fecha_accidente = src.fechaAccidente;
    if (src.tipoAccidente != null) mapped.severidad = src.tipoAccidente;
    if (src.nombreSeguro != null) mapped.nombre_seguro = src.nombreSeguro;
    if (src.observacionesDiarias != null) mapped.observaciones_diarias = src.observacionesDiarias;
    // Copiar campos snake_case si vinieran ya en ese formato
    const passthroughKeys = [
      'nombre','apellido','dni','fecha_nacimiento','cuil','contratista_id','obra_direccion','descripcion',
      'observaciones','tipologia','severidad','fecha_accidente','nombre_seguro','creado_por_id',
      'observaciones_diarias','estado','archivos','asociado_id'
    ];
    for (const k of passthroughKeys) {
      if (src[k] !== undefined) mapped[k] = src[k];
    }
    // Ejecutar update sólo con columnas válidas
    const { error } = await supabase.from('accidentes').update(mapped).eq('id', id);
    if (error) throw error;
  },
  async eliminarAccidente(id: string) {
    const { error } = await supabase.from('accidentes').delete().eq('id', id);
    if (error) throw error;
  },
  async agregarArchivo(id: string, archivo: { nombre: string; contenido: string; tipo?: string; tamano?: number; categoria?: string }) {
    // Subir a Storage
    const carpeta = `accidentes/${id}`;
    const up = await supabaseStorageService.subirBase64(carpeta, archivo.contenido, archivo.nombre);
    // Construir metadatos
    const nuevo = {
      id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
      nombre: archivo.nombre,
      path: up.path,
      url: up.publicUrl,
      tipo: archivo.tipo || 'image',
      tamano: archivo.tamano || archivo.contenido?.length || null,
      categoria: archivo.categoria || 'documento',
      fecha_subida: new Date().toISOString(),
    } as any;
    // Leer archivos actuales y actualizar fila
    const { data: current, error: errSel } = await supabase
      .from('accidentes')
      .select('archivos')
      .eq('id', id)
      .single();
    if (errSel) throw errSel;
    const lista = Array.isArray(current?.archivos) ? current.archivos : [];
    const updated = [...lista, nuevo];
    const { error: errUpd } = await supabase.from('accidentes').update({ archivos: updated }).eq('id', id);
    if (errUpd) throw errUpd;
    try {
      // Registrar metadatos en tabla 'archivos' (no bloquear si falla)
      await supabaseStorageService.registrarMetadatosArchivo({
        entidad_tipo: 'accidente',
        entidad_id: id,
        nombre: archivo.nombre,
        path: up.path,
        url: up.publicUrl,
        tipo: archivo.tipo || undefined,
        tamano: archivo.tamano || undefined,
        categoria: archivo.categoria || 'documento',
        extra: { fuente: 'gestion-accidentes' },
      });
    } catch {}
    return nuevo;
  },
  async eliminarArchivo(id: string, archivoId: string) {
    // Obtener archivos actuales
    const { data: current, error: errSel } = await supabase
      .from('accidentes')
      .select('archivos')
      .eq('id', id)
      .single();
    if (errSel) throw errSel;
    const lista = Array.isArray(current?.archivos) ? current.archivos : [];
    const target = lista.find((f: any) => f.id === archivoId);
    const remaining = lista.filter((f: any) => f.id !== archivoId);
    // Borrar en Storage si hay path
    if (target?.path) {
      try { await supabaseStorageService.eliminarArchivo(target.path); } catch (_) {}
    }
    const { error: errUpd } = await supabase.from('accidentes').update({ archivos: remaining }).eq('id', id);
    if (errUpd) throw errUpd;
  },
  async agregarObservacionDiaria(id: string, observacion: any) {
    // Leer actuales
    const { data: current, error: selErr } = await supabase
      .from('accidentes')
      .select('observaciones_diarias')
      .eq('id', id)
      .single();
    if (selErr) throw selErr;
    const arr = Array.isArray(current?.observaciones_diarias) ? current.observaciones_diarias : [];
    const updated = [...arr, observacion];
    const { error: updErr } = await supabase
      .from('accidentes')
      .update({ observaciones_diarias: updated })
      .eq('id', id);
    if (updErr) throw updErr;
    return updated;
  },
};

export const supabaseAccidentesService = isSupabaseConfigured ? supabaseImpl : localImpl;
export default supabaseAccidentesService;
