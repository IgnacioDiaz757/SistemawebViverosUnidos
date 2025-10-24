import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// Mock local de contratistas usando localStorage
const STORAGE_KEY = 'contratistas';

function readContratistas(): { id: string; nombre: string }[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeContratistas(data: { id: string; nombre: string }[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const supabaseImpl = {
  async listar() {
    const { data, error } = await supabase
      .from('contratistas')
      .select('id,nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data || [];
  },
  async crear(nombre: string) {
    const norm = (nombre || '').trim();
    // 1) Intentar reactivar si existe con el mismo nombre (baja lógica)
    const { data: reactivated } = await supabase
      .from('contratistas')
      .update({ activo: true })
      .eq('nombre', norm)
      .select('id,nombre')
      .single();
    if (reactivated) return reactivated as { id: string; nombre: string };

    // 2) Insertar nuevo
    const { data, error } = await supabase
      .from('contratistas')
      .insert({ nombre: norm, activo: true })
      .select('id,nombre')
      .single();

    // 3) Si hay conflicto por unique (por mayúsculas/minúsculas), buscar y reactivar
    if (error && (error as any).code === '23505') {
      const { data: existing } = await supabase
        .from('contratistas')
        .select('id,nombre,activo')
        .ilike('nombre', norm)
        .single();
      if (existing) {
        if ((existing as any).activo === false) {
          await supabase.from('contratistas').update({ activo: true }).eq('id', (existing as any).id);
          return { id: (existing as any).id, nombre: (existing as any).nombre } as { id: string; nombre: string };
        }
        return { id: (existing as any).id, nombre: (existing as any).nombre } as { id: string; nombre: string };
      }
    }

    if (error) throw error;
    return data as { id: string; nombre: string };
  },
  async puedeEliminar(id: string): Promise<{ puede: boolean; cantidad: number }> {
    const { count, error } = await supabase
      .from('asociados')
      .select('id', { count: 'exact', head: true })
      .eq('contratista_id', id)
      .neq('activo', false);
    if (error) throw error;
    const cant = count || 0;
    return { puede: cant === 0, cantidad: cant };
  },
  async eliminar(id: string) {
    const { error } = await supabase
      .from('contratistas')
      .update({ activo: false })
      .eq('id', id);
    if (error) throw error;
  },
};

const localImpl = {
  async listar() {
    return readContratistas().sort((a, b) => a.nombre.localeCompare(b.nombre));
  },
  async crear(nombre: string) {
    const nuevo = { id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string, nombre };
    const lista = readContratistas();
    lista.push(nuevo);
    writeContratistas(lista);
    return nuevo;
  },
  async puedeEliminar(_id: string): Promise<{ puede: boolean; cantidad: number }> {
    // Sin asociar a empleados en local; permitir
    return { puede: true, cantidad: 0 };
  },
  async eliminar(id: string) {
    const lista = readContratistas().filter(c => c.id !== id);
    writeContratistas(lista);
  },
};

export const supabaseContratistasService = isSupabaseConfigured ? supabaseImpl : localImpl;
export default supabaseContratistasService;


