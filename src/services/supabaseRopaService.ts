import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface EntregaRopa {
  id?: string;
  asociado_id: string;
  // Preferido por BD
  elemento_id?: string;
  // Compatibilidad previa (no usar si elemento_id existe)
  elemento?: string;
  talla?: string | null;
  cantidad: number;
  fecha_entrega: string; // ISO
  entregado_por?: string | null;
  observaciones?: string | null;
}

// Local fallback en localStorage
const STORAGE_KEY = 'entregas_ropa';

function readLocal(): EntregaRopa[] {
  if (typeof window === 'undefined') return [] as EntregaRopa[];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(data: EntregaRopa[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const localImpl = {
  async listarPorAsociado(asociadoId: string): Promise<EntregaRopa[]> {
    return readLocal().filter((e) => e.asociado_id === asociadoId);
  },
  async registrar(entrega: EntregaRopa): Promise<EntregaRopa> {
    const nuevo: EntregaRopa = {
      ...entrega,
      id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
    };
    const lista = readLocal();
    lista.push(nuevo);
    writeLocal(lista);
    return nuevo;
  },
  async eliminar(id: string) {
    const nueva = readLocal().filter((e) => e.id !== id);
    writeLocal(nueva);
  },
};

const supabaseImpl = {
  async listarPorAsociado(asociadoId: string): Promise<EntregaRopa[]> {
    const { data, error } = await supabase
      .from('entregas_ropa')
      .select('*')
      .eq('asociado_id', asociadoId)
      .order('fecha_entrega', { ascending: false });
    if (error) throw error;
    return (data || []) as EntregaRopa[];
  },
  async registrar(entrega: EntregaRopa): Promise<EntregaRopa> {
    // Forzar uso de elemento_id si existe; remover 'elemento' para evitar errores de columna
    const payload: any = { ...entrega };
    if (payload.elemento_id) delete payload.elemento;
    const { data, error } = await supabase
      .from('entregas_ropa')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data as EntregaRopa;
  },
  async eliminar(id: string) {
    const { error } = await supabase.from('entregas_ropa').delete().eq('id', id);
    if (error) throw error;
  },
};

export const supabaseRopaService = isSupabaseConfigured ? supabaseImpl : localImpl;
export default supabaseRopaService;


