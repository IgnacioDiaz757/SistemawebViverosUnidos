import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type UploadResult = { path: string; publicUrl?: string };

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(',');
  const isBase64 = /;base64$/i.test(meta);
  const contentTypeMatch = /data:([^;]+)/i.exec(meta || '');
  const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
  if (isBase64) {
    const byteCharacters = typeof atob === 'function' ? atob(data) : Buffer.from(data, 'base64').toString('binary');
    const byteArrays: (Uint8Array | string)[] = [];
    const chunkSize = 1024;
    for (let offset = 0; offset < byteCharacters.length; offset += chunkSize) {
      const slice = byteCharacters.slice(offset, offset + chunkSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays as BlobPart[], { type: contentType });
  }
  // Fallback: tratar como texto plano
  return new Blob([data], { type: contentType });
}

// Bucket por defecto; puedes sobrescribir pasando un bucket explícito a los métodos *_En
const DEFAULT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'AdjuntarArchivosAsociadosViveros';

const localImpl = {
  async subirBase64(_carpeta: string, _dataUrl: string, filename: string): Promise<UploadResult> {
    // En modo local no subimos nada; devolvemos un data URL como path virtual
    return { path: `local://${filename}`, publicUrl: _dataUrl };
  },
  async subirBase64En(_bucket: string, _carpeta: string, _dataUrl: string, filename: string): Promise<UploadResult> {
    return { path: `local://${filename}`, publicUrl: _dataUrl };
  },
  async eliminarArchivo(_path: string): Promise<void> {
    return;
  },
  async listarMetadatos(_entidad_tipo: string, _entidad_id: string): Promise<any[]> {
    return [];
  },
  async eliminarMetadatosPorPath(_path: string): Promise<void> {
    return;
  },
  urlPublica(path: string | null | undefined): string | undefined {
    if (!path) return undefined;
    return String(path);
  },
  async registrarMetadatosArchivo(_meta: {
    entidad_tipo: string;
    entidad_id: string;
    nombre: string;
    path: string;
    url?: string;
    tipo?: string;
    tamano?: number;
    categoria?: string;
    extra?: Record<string, any>;
  }): Promise<void> { return; },
};

const supabaseImpl = {
  async subirBase64(carpeta: string, dataUrl: string, filename: string): Promise<UploadResult> {
    return this.subirBase64En(DEFAULT_BUCKET, carpeta, dataUrl, filename);
  },
  async subirBase64En(bucket: string, carpeta: string, dataUrl: string, filename: string): Promise<UploadResult> {
    const blob = dataUrlToBlob(dataUrl);
    const ext = (filename.split('.').pop() || 'bin').toLowerCase();
    const safeName = `${Date.now()}-${(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))}.${ext}`;
    const path = `${carpeta}/${safeName}`;
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: false,
      contentType: (blob as any).type || 'application/octet-stream',
    });
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { path, publicUrl: data?.publicUrl };
  },
  async listarCarpeta(carpeta: string): Promise<Array<{ name: string; path: string; url?: string; size?: number; createdAt?: string }>> {
    return this.listarCarpetaEn(DEFAULT_BUCKET, carpeta);
  },
  async listarCarpetaEn(bucket: string, carpeta: string): Promise<Array<{ name: string; path: string; url?: string; size?: number; createdAt?: string }>> {
    const { data, error } = await supabase.storage.from(bucket).list(carpeta, { limit: 1000 });
    if (error) throw error;
    const items = (data || []).map((f: any) => {
      const path = `${carpeta}/${f.name}`;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      return {
        name: f.name,
        path,
        url: pub?.publicUrl,
        size: (f as any)?.metadata?.size || (f as any)?.size,
        createdAt: (f as any)?.created_at,
      };
    });
    return items;
  },
  async eliminarArchivo(path: string): Promise<void> {
    if (!path) return;
    const { error } = await supabase.storage.from(DEFAULT_BUCKET).remove([path]);
    if (error) throw error;
  },
  async listarMetadatos(entidad_tipo: string, entidad_id: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('archivos')
      .select('*')
      .eq('entidad_tipo', entidad_tipo)
      .eq('entidad_id', entidad_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  async eliminarMetadatosPorPath(path: string): Promise<void> {
    if (!path) return;
    const { error } = await supabase
      .from('archivos')
      .delete()
      .eq('path', path);
    if (error) throw error;
  },
  urlPublica(path: string | null | undefined): string | undefined {
    if (!path) return undefined;
    const { data } = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(path);
    return data?.publicUrl;
  },
  async registrarMetadatosArchivo(meta: {
    entidad_tipo: string;
    entidad_id: string;
    nombre: string;
    path: string;
    url?: string;
    tipo?: string;
    tamano?: number;
    categoria?: string;
    extra?: Record<string, any>;
  }): Promise<void> {
    try {
      console.log('📝 Registrando metadatos:', meta);
      let ownerId: string | null = null;
      try {
        const { data: authData } = await (supabase as any).auth.getUser();
        ownerId = authData?.user?.id || null;
        console.log('👤 Owner ID obtenido:', ownerId);
        
        // Si tenemos un usuario autenticado, asegurar que existe en la tabla usuarios
        if (ownerId) {
          try {
            await supabase.from('usuarios').upsert({
              id: ownerId,
              email: authData.user.email || 'usuario@ejemplo.com',
              nombre: authData.user.user_metadata?.nombre || 'Usuario',
              apellido: authData.user.user_metadata?.apellido || '',
              rol: authData.user.user_metadata?.rol || 'operador',
              activo: true
            }, { onConflict: 'id' });
            console.log('✅ Usuario verificado/creado en tabla usuarios');
          } catch (upsertErr) {
            console.log('⚠️ Error creando/verificando usuario:', upsertErr);
          }
        }
      } catch (authErr) {
        console.log('⚠️ Error obteniendo owner ID:', authErr);
      }

      const payload: any = {
        owner_id: ownerId, // Ahora siempre incluimos owner_id porque lo creamos si no existe
        entidad_tipo: meta.entidad_tipo,
        entidad_id: meta.entidad_id,
        nombre: meta.nombre,
        path: meta.path,
        url: meta.url || null,
        tipo: meta.tipo || null,
        tamano: meta.tamano || null,
        categoria: meta.categoria || null,
        extra: meta.extra || {},
      };
      console.log('📦 Payload para insertar:', payload);
      const { data, error } = await supabase.from('archivos').insert(payload).select();
      if (error) {
        console.error('❌ Error insertando metadatos:', error);
        console.error('❌ Código de error:', error.code);
        console.error('❌ Mensaje de error:', error.message);
        console.error('❌ Detalles del error:', error.details);
        console.error('❌ Hint del error:', error.hint);
        console.error('❌ Payload que causó el error:', JSON.stringify(payload, null, 2));
        
        // Si es error de FK, intentar sin owner_id
        if (error.code === '23503' && payload.owner_id) {
          console.log('🔄 Reintentando sin owner_id...');
          const payloadSinOwner = { ...payload };
          delete payloadSinOwner.owner_id;
          const { data: retryData, error: retryError } = await supabase.from('archivos').insert(payloadSinOwner).select();
          if (retryError) {
            console.error('❌ Error en reintento:', retryError);
            console.error('❌ Código de error en reintento:', retryError.code);
            console.error('❌ Mensaje de error en reintento:', retryError.message);
            throw retryError;
          }
          console.log('✅ Metadatos insertados en reintento:', retryData);
          return;
        }
        
        // Si es error de constraint único (path duplicado)
        if (error.code === '23505') {
          console.log('⚠️ Archivo ya existe, actualizando metadatos...');
          const { data: updateData, error: updateError } = await supabase
            .from('archivos')
            .update(payload)
            .eq('path', payload.path)
            .select();
          if (updateError) {
            console.error('❌ Error actualizando metadatos:', updateError);
            throw updateError;
          }
          console.log('✅ Metadatos actualizados:', updateData);
          return;
        }
        
        throw error;
      }
      console.log('✅ Metadatos insertados correctamente:', data);
    } catch (e) {
      console.error('❌ Error completo en registrarMetadatosArchivo:', e);
      // no interrumpir flujo de UI si falla metadato
    }
  },
};

export const supabaseStorageService = isSupabaseConfigured ? supabaseImpl : localImpl;
export default supabaseStorageService;



