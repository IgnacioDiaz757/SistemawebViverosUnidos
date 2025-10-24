-- ⚠️ CUIDADO: Este script ELIMINA todas las tablas existentes
-- Solo usa esto si quieres empezar completamente desde cero

-- Deshabilitar restricciones de clave foránea temporalmente
SET session_replication_role = replica;

-- Eliminar tablas en orden (por las dependencias)
DROP TABLE IF EXISTS historial_contratistas CASCADE;
DROP TABLE IF EXISTS asociados CASCADE;
DROP TABLE IF EXISTS contratistas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

-- Habilitar restricciones de nuevo
SET session_replication_role = DEFAULT;

-- Eliminar funciones personalizadas
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

SELECT 'TODAS LAS TABLAS ELIMINADAS - Ahora puedes ejecutar el script original' as mensaje;
