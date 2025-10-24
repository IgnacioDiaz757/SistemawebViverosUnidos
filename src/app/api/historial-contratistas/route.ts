import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Service role no configurado' }, { status: 500 });
    }

    const body = await req.json();
    const { asociado_id, tipo_movimiento, contratista_anterior, contratista_nuevo, responsable, motivo, fecha, contratista_id } = body;

    // Validaciones básicas
    if (!asociado_id || !tipo_movimiento) {
      return NextResponse.json({ error: 'asociado_id y tipo_movimiento son requeridos' }, { status: 400 });
    }

    // Preparar payload para insertar
    const payload: any = {
      asociado_id,
      tipo_movimiento,
      responsable: responsable || null,
      motivo: motivo || null,
      fecha: fecha || new Date().toISOString(),
    };

    // Para contratistas, usar nombres en lugar de IDs
    if (contratista_anterior) {
      payload.contratista_anterior = contratista_anterior;
    }
    
    // contratista_nuevo es NOT NULL, así que siempre debe tener un valor
    if (contratista_nuevo) {
      payload.contratista_nuevo = contratista_nuevo;
    } else if (tipo_movimiento === 'baja') {
      // Para bajas, usar el contratista anterior como nuevo (mismo contratista)
      payload.contratista_nuevo = contratista_anterior || 'Sin asignar';
    } else {
      // Para otros casos, usar un valor por defecto
      payload.contratista_nuevo = 'Sin asignar';
    }

    // Si hay contratista_id, usarlo como FK
    if (contratista_id) {
      payload.contratista_id = contratista_id;
    }

    const { data, error } = await admin
      .from('historial_contratistas')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      console.error('Error insertando historial:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error('Error en historial-contratistas:', e);
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}
