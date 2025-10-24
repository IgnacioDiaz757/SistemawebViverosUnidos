import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: 'Service role no configurado' }, { status: 500 });
    const body = await req.json();

    // Columnas permitidas para evitar PGRST204
    const columnasPermitidas = new Set([
      'nombre','apellido','cuil','dni','telefono','fecha_ingreso','domicilio','barrio','codigo_postal','ciudad','provincia','fecha_nacimiento','estado_civil','mano_habil','email','legajo','nro_socio','monotributo','activo','fecha_carga','fecha_baja','responsable_baja','foto_dni','nombre_archivo_dni','contratista_id','creado_por_id','dado_baja_por_id','beneficio'
    ]);

    // Normalizar fecha_carga a solo día (YYYY-MM-DD) local
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const hoyYMD = `${y}-${m}-${d}`;

    const payload: any = { activo: true, fecha_carga: hoyYMD };
    Object.keys(body || {}).forEach((k) => {
      if (columnasPermitidas.has(k)) payload[k] = (body as any)[k];
    });

    const { data, error } = await admin.from('asociados').insert(payload).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Upsert historial médico si vino
    const hm = (body as any).historial_medico || (body as any).historialMedico;
    if (hm && data?.id) {
      await admin.from('historial_medico').upsert({ asociado_id: data.id, datos: hm }, { onConflict: 'asociado_id' });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: 500 });
  }
}


