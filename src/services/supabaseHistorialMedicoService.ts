import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { HistorialMedico } from '@/types/medico';

const STORAGE_PREFIX = 'historial_medico_';

function readLocal(id: string): HistorialMedico | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(id: string, data: HistorialMedico) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(data));
}

const localImpl = {
  async obtener(asociadoId: string): Promise<HistorialMedico | null> {
    return readLocal(asociadoId);
  },
  async guardar(asociadoId: string, hm: HistorialMedico) {
    writeLocal(asociadoId, hm);
    return hm;
  },
};

const supabaseImpl = {
  async obtener(asociadoId: string): Promise<HistorialMedico | null> {
    const { data, error } = await supabase
      .from('historial_medico')
      .select('datos')
      .eq('asociado_id', asociadoId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // no rows
    return (data?.datos as HistorialMedico) || null;
  },
  async guardar(asociadoId: string, hm: HistorialMedico) {
    // upsert por asociado_id
    const { data, error } = await supabase
      .from('historial_medico')
      .upsert({ asociado_id: asociadoId, datos: hm }, { onConflict: 'asociado_id' })
      .select('datos')
      .single();
    if (error) throw error;
    return (data?.datos as HistorialMedico) || hm;
  },
};

export const supabaseHistorialMedicoService = isSupabaseConfigured ? supabaseImpl : localImpl;
export default supabaseHistorialMedicoService;


