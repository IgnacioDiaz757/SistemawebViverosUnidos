import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface AdminUsuario {
  id?: string;
  email: string;
  nombre?: string | null;
  apellido?: string | null;
  rol: 'admin';
  activo: boolean;
}

export interface WhitelistEntry {
  id?: string;
  email: string;
  nombre?: string | null;
  apellido?: string | null;
  autorizado_por?: string | null;
  fecha_autorizacion?: string | null;
  activo: boolean;
}

// Local fallbacks
const STORAGE_USERS = 'usuarios_admin';
const STORAGE_WL = 'whitelist_emails';

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
}
function writeLocal<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

const localImpl = {
  async listarUsuarios(): Promise<AdminUsuario[]> {
    return readLocal<AdminUsuario[]>(STORAGE_USERS, []);
  },
  async upsertUsuario(user: AdminUsuario): Promise<AdminUsuario> {
    const lista = readLocal<AdminUsuario[]>(STORAGE_USERS, []);
    const idx = lista.findIndex(u => u.email === user.email);
    if (idx >= 0) lista[idx] = { ...lista[idx], ...user };
    else lista.push({ ...user, id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string });
    writeLocal(STORAGE_USERS, lista);
    return user;
  },
  async listarWhitelist(): Promise<WhitelistEntry[]> {
    return readLocal<WhitelistEntry[]>(STORAGE_WL, []);
  },
  async agregarWhitelist(entry: WhitelistEntry): Promise<WhitelistEntry> {
    const lista = readLocal<WhitelistEntry[]>(STORAGE_WL, []);
    const nuevo = { ...entry, id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string };
    lista.push(nuevo);
    writeLocal(STORAGE_WL, lista);
    return nuevo;
  },
  async eliminarWhitelist(id: string) {
    const lista = readLocal<WhitelistEntry[]>(STORAGE_WL, []);
    writeLocal(STORAGE_WL, lista.filter(w => w.id !== id));
  },
};

const supabaseImpl = {
  async listarUsuarios(): Promise<AdminUsuario[]> {
    const { data, error } = await supabase.from('usuarios_admin').select('*').order('email');
    if (error) throw error;
    return (data || []) as AdminUsuario[];
  },
  async upsertUsuario(user: AdminUsuario): Promise<AdminUsuario> {
    const { data, error } = await supabase.from('usuarios_admin').upsert(user, { onConflict: 'email' }).select('*').single();
    if (error) throw error;
    return data as AdminUsuario;
  },
  async listarWhitelist(): Promise<WhitelistEntry[]> {
    const { data, error } = await supabase.from('whitelist_emails').select('*').order('email');
    if (error) throw error;
    return (data || []) as WhitelistEntry[];
  },
  async agregarWhitelist(entry: WhitelistEntry): Promise<WhitelistEntry> {
    const { data, error } = await supabase.from('whitelist_emails').insert(entry).select('*').single();
    if (error) throw error;
    return data as WhitelistEntry;
  },
  async eliminarWhitelist(id: string) {
    const { error } = await supabase.from('whitelist_emails').delete().eq('id', id);
    if (error) throw error;
  },
};

export const supabaseAuthAdminService = isSupabaseConfigured ? supabaseImpl : localImpl;
export default supabaseAuthAdminService;