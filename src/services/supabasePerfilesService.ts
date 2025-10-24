import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface PerfilUsuario {
  id: string;
  user_id: string;
  foto_perfil?: string;
  nombre_completo?: string;
  cargo?: string;
  telefono?: string;
  email?: string;
  creado_en: string;
  actualizado_en: string;
}

const localImpl = {
  async obtenerPerfil(userId: string): Promise<PerfilUsuario | null> {
    try {
      const perfil = localStorage.getItem(`perfil_usuario_${userId}`);
      return perfil ? JSON.parse(perfil) : null;
    } catch {
      return null;
    }
  },
  async guardarPerfil(perfil: Partial<PerfilUsuario>): Promise<PerfilUsuario> {
    const perfilCompleto: PerfilUsuario = {
      id: perfil.id || `local_${Date.now()}`,
      user_id: perfil.user_id || '',
      foto_perfil: perfil.foto_perfil,
      nombre_completo: perfil.nombre_completo,
      cargo: perfil.cargo,
      telefono: perfil.telefono,
      email: perfil.email,
      creado_en: perfil.creado_en || new Date().toISOString(),
      actualizado_en: new Date().toISOString(),
    };
    
    localStorage.setItem(`perfil_usuario_${perfilCompleto.user_id}`, JSON.stringify(perfilCompleto));
    return perfilCompleto;
  },
};

const supabaseImpl = {
  async obtenerPerfil(userId: string): Promise<PerfilUsuario | null> {
    try {
      const { data, error } = await supabase
        .from('perfiles_usuario')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error obteniendo perfil:', error);
        throw error;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error en obtenerPerfil:', error);
      throw error;
    }
  },
  async guardarPerfil(perfil: Partial<PerfilUsuario>): Promise<PerfilUsuario> {
    console.log('=== INICIO guardarPerfil ===');
    console.log('Perfil recibido:', perfil);
    console.log('isSupabaseConfigured:', isSupabaseConfigured);
    console.log('supabase client:', !!supabase);
    
    try {
      const payload = {
        user_id: perfil.user_id,
        foto_perfil: perfil.foto_perfil,
        nombre_completo: perfil.nombre_completo,
        cargo: perfil.cargo,
        telefono: perfil.telefono,
        email: perfil.email,
        actualizado_en: new Date().toISOString(),
      };

      console.log('Payload a enviar:', payload);

      const { data, error } = await supabase
        .from('perfiles_usuario')
        .upsert(payload, { onConflict: 'user_id' })
        .select('*')
        .single();

      console.log('Respuesta de Supabase:', { data, error });
      console.log('Error existe?', !!error);
      console.log('Error type:', typeof error);
      console.log('Error keys:', error ? Object.keys(error) : 'no error');

      if (error) {
        console.error('Error en guardarPerfil:', error);
        console.error('Error stringified:', JSON.stringify(error, null, 2));
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      console.log('Perfil guardado exitosamente:', data);
      return data as PerfilUsuario;
    } catch (error) {
      console.error('Error en guardarPerfil (catch):', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      throw error;
    }
  },
};

export const supabasePerfilesService = isSupabaseConfigured ? supabaseImpl : localImpl;
export default supabasePerfilesService;
