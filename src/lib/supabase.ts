// Cliente Supabase con bandera de activación segura
// Activalo con: NEXT_PUBLIC_SUPABASE_ENABLED=true y define URL/ANON en .env.local

type SupabaseClientLike = any;

const ENABLED = process.env.NEXT_PUBLIC_SUPABASE_ENABLED === 'true';
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClientLike = null;
// Consideramos "configurado" si las env están presentes; el cliente puede fallar si falta el paquete
let configured = Boolean(ENABLED && URL && ANON);

if (configured) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createClient } = require('@supabase/supabase-js');
    client = createClient(URL as string, ANON as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (_e) {
    if (typeof console !== 'undefined') {
      console.warn('[Supabase] @supabase/supabase-js no está instalado. Ejecuta: npm i @supabase/supabase-js');
    }
  }
}

export const supabase: SupabaseClientLike = client;
export const isSupabaseConfigured = configured;
export default supabase;

if (typeof window !== 'undefined') {
  (window as any).sb = supabase;
  (window as any).sbConfigured = isSupabaseConfigured;
  }
