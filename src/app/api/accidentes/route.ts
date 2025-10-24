import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase admin no configurado' }, { status: 500 });
  try {
    const body = await req.json();
    const insert: any = {
      nombre: body.nombre,
      apellido: body.apellido,
      dni: body.dni ?? null,
      fecha_nacimiento: body.fecha_nacimiento ?? null,
      cuil: body.cuil ?? null,
      contratista_id: body.contratista_id ?? null,
      obra_direccion: body.obra_direccion ?? null,
      nro_siniestro: body.nro_siniestro ?? null,
      descripcion: body.descripcion ?? null,
      observaciones: body.observaciones ?? null,
      tipologia: body.tipologia ?? null,
      severidad: body.severidad ?? 'leve',
      fecha_accidente: body.fecha_accidente ?? new Date().toISOString(),
      nombre_seguro: body.nombre_seguro ?? null,
      creado_por_id: body.creado_por_id ?? null,
      observaciones_diarias: [],
    };
    const { data, error } = await admin.from('accidentes').insert(insert).select('*').single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error creando accidente' }, { status: 500 });
  }
}


