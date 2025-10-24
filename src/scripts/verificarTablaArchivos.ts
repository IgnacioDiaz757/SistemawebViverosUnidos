// Script para verificar la tabla archivos en Supabase
import { supabase } from '@/lib/supabase';

export async function verificarTablaArchivos() {
  try {
    console.log('🔍 Verificando tabla archivos...');
    
    // 1. Verificar si la tabla existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'archivos');
    
    if (tablesError) {
      console.error('❌ Error verificando tablas:', tablesError);
      return;
    }
    
    if (!tables || tables.length === 0) {
      console.error('❌ La tabla "archivos" no existe');
      return;
    }
    
    console.log('✅ La tabla "archivos" existe');
    
    // 2. Verificar la estructura de la tabla
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'archivos')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error verificando columnas:', columnsError);
      return;
    }
    
    console.log('📋 Estructura de la tabla archivos:');
    columns?.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 3. Verificar políticas RLS
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'archivos');
    
    if (policiesError) {
      console.log('⚠️ No se pudieron verificar las políticas RLS');
    } else {
      console.log('🔒 Políticas RLS:');
      policies?.forEach((policy: any) => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
      });
    }
    
    // 4. Intentar una inserción de prueba
    console.log('🧪 Probando inserción...');
    const testPayload = {
      entidad_tipo: 'test',
      entidad_id: 'test-id',
      nombre: 'test-file.jpg',
      path: `test/${Date.now()}-test.jpg`,
      url: 'https://example.com/test.jpg',
      tipo: 'image/jpeg',
      tamano: 1000,
      categoria: 'test',
      extra: {}
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('archivos')
      .insert(testPayload)
      .select();
    
    if (insertError) {
      console.error('❌ Error en inserción de prueba:', insertError);
      console.error('❌ Código:', insertError.code);
      console.error('❌ Mensaje:', insertError.message);
      console.error('❌ Detalles:', insertError.details);
    } else {
      console.log('✅ Inserción de prueba exitosa:', insertData);
      
      // Limpiar el registro de prueba
      await supabase
        .from('archivos')
        .delete()
        .eq('path', testPayload.path);
      console.log('🧹 Registro de prueba eliminado');
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (typeof window !== 'undefined') {
  (window as any).verificarTablaArchivos = verificarTablaArchivos;
}
