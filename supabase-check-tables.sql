-- Script para verificar qué tablas ya existen en Supabase
-- Ejecuta esto primero para ver el estado actual

SELECT 'TABLAS EXISTENTES:' as info;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

SELECT 'USUARIOS EXISTENTES:' as info;

-- Verificar si existe la tabla usuarios y mostrar contenido
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'usuarios') THEN
        RAISE NOTICE 'Tabla usuarios existe';
        PERFORM COUNT(*) FROM usuarios;
        RAISE NOTICE 'Total usuarios: %', (SELECT COUNT(*) FROM usuarios);
    ELSE
        RAISE NOTICE 'Tabla usuarios NO existe';
    END IF;
END $$;

SELECT 'CONTRATISTAS EXISTENTES:' as info;

-- Verificar si existe la tabla contratistas
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contratistas') THEN
        RAISE NOTICE 'Tabla contratistas existe';
        RAISE NOTICE 'Total contratistas: %', (SELECT COUNT(*) FROM contratistas);
    ELSE
        RAISE NOTICE 'Tabla contratistas NO existe';
    END IF;
END $$;

SELECT 'ASOCIADOS EXISTENTES:' as info;

-- Verificar si existe la tabla asociados
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'asociados') THEN
        RAISE NOTICE 'Tabla asociados existe';
        RAISE NOTICE 'Total asociados: %', (SELECT COUNT(*) FROM asociados);
    ELSE
        RAISE NOTICE 'Tabla asociados NO existe';
    END IF;
END $$;
