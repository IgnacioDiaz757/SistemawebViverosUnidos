import { isSupabaseConfigured, supabase } from '@/lib/supabase';

// Mocks de validación en memoria/localStorage para UI sin backend
const STORAGE_ASOCIADOS = 'asociados';

function readAsociados(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const primario = localStorage.getItem(STORAGE_ASOCIADOS);
    if (primario) return JSON.parse(primario);
    const legacy = localStorage.getItem('asociados_mock');
    return legacy ? JSON.parse(legacy) : [];
  } catch {
    return [];
  }
}

// Implementación Supabase
const supabaseImpl = {
  async crearAsociado(data: any) {
    // Enviar al endpoint server para evitar RLS (usa service_role)
    const res = await fetch('/api/asociados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Error creando asociado');
    }
    return await res.json();
  },
  async actualizarAsociado(id: string, update: any) {
    const { error } = await supabase.from('asociados').update(update).eq('id', id);
    if (error) throw error;
    return true;
  },
  async validarCuilUnico(cuil: string, excludeId?: string) {
    if (!cuil) return { esValido: false, mensaje: 'CUIL requerido' };
    let q = supabase.from('asociados').select('id', { count: 'exact', head: true }).eq('cuil', cuil);
    if (excludeId) q = q.neq('id', excludeId);
    const { count, error } = await q;
    if (error) return { esValido: false, mensaje: 'Error validando CUIL' };
    return { esValido: (count || 0) === 0, mensaje: (count || 0) > 0 ? 'El CUIL ya está registrado' : undefined };
  },
  async validarDniUnico(dni: string, excludeId?: string) {
    if (!dni) return { esValido: false, mensaje: 'DNI requerido' };
    let q = supabase.from('asociados').select('id', { count: 'exact', head: true }).eq('dni', dni);
    if (excludeId) q = q.neq('id', excludeId);
    const { count, error } = await q;
    if (error) return { esValido: false, mensaje: 'Error validando DNI' };
    return { esValido: (count || 0) === 0, mensaje: (count || 0) > 0 ? 'El DNI ya está registrado' : undefined };
  },
  async validarLegajoUnico(legajo: string, excludeId?: string) {
    let q = supabase.from('asociados').select('id', { count: 'exact', head: true }).eq('legajo', legajo);
    if (excludeId) q = q.neq('id', excludeId);
    const { count, error } = await q;
    if (error) return { esValido: false, mensaje: 'Error validando legajo' };
    return { esValido: (count || 0) === 0, mensaje: (count || 0) > 0 ? 'El legajo ya está registrado' : undefined };
  },
  async validarNroSocioUnico(nroSocio: string, excludeId?: string) {
    let q = supabase.from('asociados').select('id', { count: 'exact', head: true }).eq('nro_socio', nroSocio);
    if (excludeId) q = q.neq('id', excludeId);
    const { count, error } = await q;
    if (error) return { esValido: false, mensaje: 'Error validando número de socio' };
    return { esValido: (count || 0) === 0, mensaje: (count || 0) > 0 ? 'El número de socio ya está registrado' : undefined };
  },
  async obtenerAsociadosActivos() {
    // Consulta sin JOIN para evitar errores por relaciones no detectadas o políticas
    const { data, error } = await supabase
      .from('asociados')
      .select('*')
      .neq('activo', false)
      .order('nombre', { ascending: true }); // Agregar ordenamiento en Supabase
    if (error) throw error;
    console.log('🔍 Supabase - Asociados activos obtenidos:', data?.length || 0);
    return data || [];
  },
  async obtenerAsociadosBaja() {
    const { data, error } = await supabase
      .from('asociados')
      .select('*')
      .eq('activo', false)
      .order('nombre', { ascending: true }); // Agregar ordenamiento en Supabase
    if (error) throw error;
    console.log('🔍 Supabase - Asociados de baja obtenidos:', data?.length || 0);
    return data || [];
  },
  async darDeBajaAsociado(empleadoId: string, responsableNombre?: string, fechaBajaManual?: string) {
    // Obtener estado actual para registrar historial (contratista actual)
    let contratistaActual: string | null = null;
    try {
      const { data: current } = await supabase.from('asociados').select('contratista_id').eq('id', empleadoId).single();
      contratistaActual = (current as any)?.contratista_id ?? null;
    } catch {}
    const updatePayload: any = {
      activo: false,
      fecha_baja: new Date().toISOString(),
      responsable_baja: responsableNombre || null,
    };
    if (fechaBajaManual) {
      // Guardar fecha manual en formato YYYY-MM-DD
      updatePayload.fecha_baja_manual = fechaBajaManual;
    }
    const { error } = await supabase.from('asociados').update(updatePayload).eq('id', empleadoId);
    if (error) throw error;
    // Registrar movimiento en historial (via API service_role)
    try {
      await fetch('/api/historial-contratistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asociado_id: empleadoId,
          tipo_movimiento: 'baja',
          contratista_anterior: contratistaActual,
          contratista_nuevo: contratistaActual, // Para bajas, usar el mismo contratista
          responsable: responsableNombre || null,
          contratista_id: contratistaActual,
          motivo: 'Baja de asociado',
          fecha: new Date().toISOString(),
        }),
      });
    } catch {}
  },
  async darDeAltaAsociado(empleadoId: string, responsableNombre?: string, contratistaId?: string) {
    // Obtener estado actual para detectar cambio de contratista
    let contratistaAnterior: string | null = null;
    try {
      const { data: current } = await supabase.from('asociados').select('contratista_id, activo').eq('id', empleadoId).single();
      contratistaAnterior = (current as any)?.contratista_id ?? null;
    } catch {}
    const update: any = {
      activo: true,
      fecha_baja: null,
      responsable_baja: null,
    };
    if (contratistaId) update.contratista_id = contratistaId;
    const { error } = await supabase.from('asociados').update(update).eq('id', empleadoId);
    if (error) throw error;
    // Registrar alta en historial y, si aplica, cambio de contratista
    try {
      // Alta
      await fetch('/api/historial-contratistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asociado_id: empleadoId,
          tipo_movimiento: 'alta',
          contratista_anterior: contratistaAnterior,
          contratista_nuevo: contratistaId ?? contratistaAnterior,
          responsable: responsableNombre || null,
          contratista_id: contratistaId ?? contratistaAnterior,
          motivo: 'Alta de asociado',
          fecha: new Date().toISOString(),
        }),
      });
      // Cambio de contratista explícito
      if (contratistaId && contratistaId !== contratistaAnterior) {
        await fetch('/api/historial-contratistas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asociado_id: empleadoId,
            tipo_movimiento: 'cambio_contratista',
            contratista_anterior: contratistaAnterior,
            contratista_nuevo: contratistaId,
            responsable: responsableNombre || null,
            contratista_id: contratistaId,
            motivo: 'Cambio de contratista al dar de alta',
            fecha: new Date().toISOString(),
          }),
        });
      }
    } catch {}
  },
};

// Implementación Local (actual)
const localImpl = {
  async crearAsociado(data: any) {
    const lista = readAsociados();
    const nuevo = {
      id: (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string,
      activo: true,
      fecha_carga: new Date().toISOString().split('T')[0],
      ...data,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_ASOCIADOS, JSON.stringify([...lista, nuevo]));
    }
    return nuevo;
  },
  async actualizarAsociado(id: string, update: any) {
    const lista = readAsociados();
    const idx = lista.findIndex(a => a.id === id);
    if (idx >= 0) {
      lista[idx] = { ...lista[idx], ...update };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ASOCIADOS, JSON.stringify(lista));
      }
      return true;
    }
    return false;
  },
  async validarCuilUnico(cuil: string, excludeId?: string) {
    if (!cuil) return { esValido: false, mensaje: 'CUIL requerido' };
    const existe = readAsociados().some(a => a.cuil === cuil && (!excludeId || a.id !== excludeId));
    return { esValido: !existe, mensaje: existe ? 'El CUIL ya está registrado' : undefined };
  },
  async validarDniUnico(dni: string, excludeId?: string) {
    if (!dni) return { esValido: false, mensaje: 'DNI requerido' };
    const existe = readAsociados().some(a => a.dni === dni && (!excludeId || a.id !== excludeId));
    return { esValido: !existe, mensaje: existe ? 'El DNI ya está registrado' : undefined };
  },
  async validarLegajoUnico(legajo: string, excludeId?: string) {
    const existe = readAsociados().some(a => a.legajo === legajo && (!excludeId || a.id !== excludeId));
    return { esValido: !existe, mensaje: existe ? 'El legajo ya está registrado' : undefined };
  },
  async validarNroSocioUnico(nroSocio: string, excludeId?: string) {
    const existe = readAsociados().some(a => a.nro_socio === nroSocio && (!excludeId || a.id !== excludeId));
    return { esValido: !existe, mensaje: existe ? 'El número de socio ya está registrado' : undefined };
  },
  async obtenerAsociadosActivos() {
    return readAsociados().filter(a => a.activo !== false);
  },
  async obtenerAsociadosBaja() {
    return readAsociados().filter(a => a.activo === false);
  },
  async darDeBajaAsociado(empleadoId: string, responsableId?: string) {
    const lista = readAsociados();
    const idx = lista.findIndex(a => a.id === empleadoId);
    if (idx >= 0) {
      lista[idx] = {
        ...lista[idx],
        activo: false,
        fecha_baja: new Date().toISOString(),
        responsable_baja: responsableId || null,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ASOCIADOS, JSON.stringify(lista));
      }
    }
  },
  async darDeAltaAsociado(empleadoId: string, responsableId?: string, contratistaId?: string) {
    const lista = readAsociados();
    const idx = lista.findIndex(a => a.id === empleadoId);
    if (idx >= 0) {
      lista[idx] = {
        ...lista[idx],
        activo: true,
        fecha_baja: null,
        responsable_baja: null,
        contratista: contratistaId ? { id: contratistaId, nombre: lista[idx]?.contratista?.nombre || lista[idx]?.contratista || '' } : lista[idx].contratista,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ASOCIADOS, JSON.stringify(lista));
      }
    }
  },
};

export const supabaseAsociadosService = isSupabaseConfigured ? supabaseImpl : localImpl;
export default supabaseAsociadosService;


