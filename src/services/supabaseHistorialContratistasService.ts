import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface MovimientoContratista {
  id?: string;
  asociado_id: string;
  tipo: 'cambio_contratista' | 'alta' | 'baja' | 'reactivacion';
  contratista_anterior?: string | null;
  contratista_nuevo?: string | null;
  responsable?: string | null;
  motivo?: string | null;
  fecha?: string; // ISO (nombre de tu tabla)
  fecha_movimiento?: string; // compatibilidad
  contratista_id?: string | null; // FK nuevo contratista
}

const STORAGE_PREFIX = 'historial_contratistas_';

function readLocal(asociadoId: string): MovimientoContratista[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + asociadoId) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(asociadoId: string, data: MovimientoContratista[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PREFIX + asociadoId, JSON.stringify(data));
}

const localImpl = {
  async listar(asociadoId: string): Promise<MovimientoContratista[]> {
    return readLocal(asociadoId);
  },
  async registrar(asociadoId: string, mov: MovimientoContratista) {
    const lista = readLocal(asociadoId);
    const nuevo = { ...mov, id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string };
    writeLocal(asociadoId, [...lista, nuevo]);
    return nuevo;
  },
};

const supabaseImpl = {
  async listar(asociadoId: string): Promise<MovimientoContratista[]> {
    const { data, error } = await supabase
      .from('historial_contratistas')
      .select('*')
      .eq('asociado_id', asociadoId)
      .order('fecha', { ascending: true });
    if (error) throw error;
    return (data || []) as MovimientoContratista[];
  },
  async registrar(_asociadoId: string, mov: MovimientoContratista) {
    const payload: any = { ...mov };
    if (!payload.fecha) payload.fecha = new Date().toISOString();
    if (payload.tipo && !payload.tipo_movimiento) payload.tipo_movimiento = payload.tipo;
    const { data, error } = await supabase
      .from('historial_contratistas')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data as MovimientoContratista;
  },
};

function withCreate(impl: any) {
  return {
    ...impl,
    async crearMovimiento(mov: MovimientoContratista) {
      const asociadoId = mov.asociado_id;
      return impl.registrar(asociadoId, mov);
    },
  };
}

export const supabaseHistorialContratistasService = withCreate(isSupabaseConfigured ? supabaseImpl : localImpl);
export default supabaseHistorialContratistasService;


