import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { supabaseStorageService } from '@/services/supabaseStorageService';

// Función para migrar datos del localStorage a Supabase
export async function migrarDatosASupabase() {
  console.log('🚀 Iniciando migración a Supabase...');

  try {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase no está configurado. Definí las variables de entorno y reiniciá.');
    }

    // 1. Migrar contratistas
    console.log('📋 Migrando contratistas...');
    const contratistasLocal = JSON.parse(localStorage.getItem('contratistas') || '[]');
    
    for (const contratista of contratistasLocal) {
      const { error } = await supabase
        .from('contratistas')
        .insert({
          nombre: contratista.nombre,
          activo: true,
        });
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('Error migrando contratista:', contratista.nombre, error);
      }
    }

    // 2. Obtener IDs de contratistas de Supabase
    const { data: contratistasSupabase } = await supabase
      .from('contratistas')
      .select('id, nombre');

    const contratistaMap = new Map();
    contratistasSupabase?.forEach((c: any) => {
      contratistaMap.set(c.nombre, c.id);
    });

    // 3. Migrar asociados
    console.log('👥 Migrando asociados...');
    const asociadosLocal = JSON.parse(localStorage.getItem('asociados') || localStorage.getItem('empleados') || '[]');

    for (const asociado of asociadosLocal) {
      const contratistaId = contratistaMap.get(asociado.contratista);
      
      if (!contratistaId) {
        console.warn(`Contratista no encontrado para asociado ${asociado.nombre}: ${asociado.contratista}`);
        continue;
      }

      const { error } = await supabase
        .from('asociados')
        .insert({
          nombre: asociado.nombre,
          apellido: asociado.apellido,
          cuil: asociado.cuil,
          dni: asociado.dni,
          telefono: asociado.telefono || null,
          fecha_ingreso: asociado.fecha_ingreso || asociado.fechaIngreso,
          domicilio: asociado.domicilio || null,
          legajo: asociado.legajo,
          nro_socio: asociado.nroSocio,
          monotributo: asociado.monotributo || false,
          activo: asociado.activo,
          fecha_carga: asociado.fecha_carga || asociado.fechaCarga || new Date().toISOString(),
          fecha_baja: asociado.fecha_baja || asociado.fechaBaja || null,
          responsable_baja: asociado.responsable_baja || asociado.responsableBaja || null,
          foto_dni: asociado.foto_dni || asociado.fotoDni || null,
          nombre_archivo_dni: asociado.nombre_archivo_dni || asociado.nombreArchivoDni || null,
          contratista_id: contratistaId,
        });

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error migrando asociado:', asociado.nombre, error);
      }
    }

    // 4. Actualizar foto DNI a Storage cuando venga en base64 y setear URL pública
    console.log('🖼️ Subiendo fotos de DNI a Storage (si existen en base64)...');
    const { data: asociadosDb } = await supabase.from('asociados').select('id, foto_dni, nombre, apellido');
    for (const aDb of asociadosDb || []) {
      try {
        // Buscar en local por coincidencia de nombre+apellido y/o por dni
        const match = asociadosLocal.find((al: any) => (
          (al.nombre === aDb.nombre && al.apellido === aDb.apellido) || al.id === aDb.id
        ));
        const base64 = match?.foto_dni || match?.fotoDni;
        if (base64 && /^data:\w+\/.+;base64,/.test(base64)) {
          const up = await supabaseStorageService.subirBase64(`asociados/${aDb.id}/dni`, base64, `${aDb.nombre || 'dni'}.jpg`);
          await supabase.from('asociados').update({ foto_dni: up.publicUrl || null, nombre_archivo_dni: `${aDb.nombre || 'dni'}.jpg` }).eq('id', aDb.id);
        }
      } catch (e) {
        console.warn('No se pudo subir foto DNI de asociado', aDb?.id);
      }
    }

    // 5. Migrar archivos adjuntos de asociados desde localStorage a Storage
    console.log('📎 Migrando adjuntos de asociados a Storage...');
    for (const aDb of asociadosDb || []) {
      try {
        const key = `asociados_archivos_${aDb.id}`;
        const archivosLocal = JSON.parse(localStorage.getItem(key) || '[]');
        for (const f of archivosLocal) {
          const dataUrl = f.url || f.contenido;
          if (dataUrl && typeof dataUrl === 'string') {
            await supabaseStorageService.subirBase64(`asociados/${aDb.id}/legacy`, dataUrl, f.nombre || 'archivo');
          }
        }
      } catch (_) {}
    }

    // 6. Migrar historial de contratistas
    console.log('📝 Migrando historial de contratistas...');
    for (const aDb of asociadosDb || []) {
      const histKey = `historial_contratistas_${aDb.id}`;
      const movimientos = JSON.parse(localStorage.getItem(histKey) || '[]');
      for (const mov of movimientos) {
        try {
          await supabase.from('historial_contratistas').insert({
            asociado_id: aDb.id,
            tipo: mov.tipo || 'cambio_contratista',
            contratista_anterior: mov.contratista_anterior || null,
            contratista_nuevo: mov.contratista_nuevo || null,
            responsable: mov.responsable || null,
            motivo: mov.motivo || null,
            fecha_movimiento: mov.fecha_movimiento || mov.fecha || new Date().toISOString(),
          });
        } catch (e) {}
      }
    }

    // 7. Migrar entregas de ropa
    console.log('👕 Migrando entregas de ropa...');
    const entregasLocal = JSON.parse(localStorage.getItem('entregas_ropa') || '[]');
    for (const ent of entregasLocal) {
      try {
        await supabase.from('entregas_ropa').insert({
          asociado_id: ent.asociado_id,
          elemento: ent.elemento?.nombre || ent.elemento || 'desconocido',
          talla: ent.talla || null,
          cantidad: ent.cantidad || 1,
          fecha_entrega: ent.fecha_entrega || new Date().toISOString(),
          entregado_por: ent.entregado_por || null,
          observaciones: ent.observaciones || null,
        });
      } catch (e) {}
    }

    // 8. Migrar accidentes y sus archivos (si hubiera en local)
    console.log('⛑️ Migrando accidentes...');
    const accidentesLocal = JSON.parse(localStorage.getItem('accidentes') || '[]');
    for (const acc of accidentesLocal) {
      try {
        const { data: inserted, error } = await supabase.from('accidentes').insert({
          nombre: acc.nombre,
          apellido: acc.apellido,
          dni: acc.dni || null,
          descripcion: acc.descripcion || '',
          observaciones: acc.observaciones || '',
          tipologia: acc.tipologia || null,
          severidad: acc.severidad || acc.tipoAccidente || 'leve',
          fecha_accidente: acc.fecha_accidente || acc.fechaAccidente || new Date().toISOString(),
          nombre_seguro: acc.nombre_seguro || acc.nombreSeguro || null,
          observaciones_diarias: acc.observaciones_diarias || acc.observacionesDiarias || [],
        }).select('id').single();
        if (!error && inserted?.id && Array.isArray(acc.archivos)) {
          for (const f of acc.archivos) {
            const dataUrl = f.contenido || f.url;
            if (dataUrl) {
              const up = await supabaseStorageService.subirBase64(`accidentes/${inserted.id}`, dataUrl, f.nombre || 'archivo');
              // append metadata en campo archivos (array json)
              const { data: cur } = await supabase.from('accidentes').select('archivos').eq('id', inserted.id).single();
              const lista = Array.isArray(cur?.archivos) ? cur.archivos : [];
              lista.push({ id: up.path, nombre: f.nombre || 'archivo', path: up.path, url: up.publicUrl, fecha_subida: new Date().toISOString() });
              await supabase.from('accidentes').update({ archivos: lista }).eq('id', inserted.id);
            }
          }
        }
      } catch (e) {}
    }

    // 9. Migrar whitelist local (si existe) a tabla
    console.log('✅ Migrando whitelist (si existe)...');
    const wlLocal = JSON.parse(localStorage.getItem('whitelist_emails') || '[]');
    for (const email of wlLocal) {
      try { await supabase.from('whitelist_emails').insert({ email, activo: true }); } catch (_) {}
    }

    console.log('✅ Migración completada exitosamente');
    return { success: true, message: 'Datos migrados correctamente a Supabase' };

  } catch (error) {
    console.error('❌ Error en migración:', error);
    return { success: false, message: `Error en migración: ${error}` };
  }
}

// Función para verificar la migración
export async function verificarMigracion() {
  try {
    const { data: contratistas } = await supabase.from('contratistas').select('count');
    const { data: asociados } = await supabase.from('asociados').select('count');
    const { data: usuarios } = await supabase.from('usuarios').select('count');

    console.log('📊 Estado de la base de datos:');
    console.log(`- Contratistas: ${contratistas?.[0]?.count || 0}`);
    console.log(`- Asociados: ${asociados?.[0]?.count || 0}`);
    console.log(`- Usuarios: ${usuarios?.[0]?.count || 0}`);

    return {
      contratistas: contratistas?.[0]?.count || 0,
      asociados: asociados?.[0]?.count || 0,
      usuarios: usuarios?.[0]?.count || 0,
    };
  } catch (error) {
    console.error('Error verificando migración:', error);
    return null;
  }
}
