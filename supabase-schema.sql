-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios (idempotente)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'operador' CHECK (rol IN ('admin', 'operador')),
    activo BOOLEAN DEFAULT true,
    telefono VARCHAR(20),
    direccion TEXT,
    foto TEXT, -- Base64 o URL
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    creado_por UUID REFERENCES usuarios(id),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de contratistas (idempotente)
CREATE TABLE IF NOT EXISTS contratistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) UNIQUE NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asociados (idempotente)
CREATE TABLE IF NOT EXISTS asociados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cuil VARCHAR(13) UNIQUE NOT NULL,
    dni VARCHAR(10) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    fecha_ingreso DATE NOT NULL,
    domicilio TEXT,
    barrio TEXT,
    codigo_postal TEXT,
    ciudad TEXT,
    provincia TEXT,
    fecha_nacimiento DATE,
    estado_civil TEXT,
    mano_habil TEXT,
    legajo VARCHAR(20) UNIQUE NOT NULL,
    nro_socio VARCHAR(20) UNIQUE NOT NULL,
    monotributo BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    fecha_carga TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_baja TIMESTAMP WITH TIME ZONE,
    responsable_baja VARCHAR(200),
    foto_dni TEXT, -- Base64
    nombre_archivo_dni VARCHAR(255),
    contratista_id UUID NOT NULL REFERENCES contratistas(id),
    creado_por_id UUID REFERENCES usuarios(id),
    dado_baja_por_id UUID REFERENCES usuarios(id)
);

-- Tabla de historial de contratistas (idempotente)
CREATE TABLE IF NOT EXISTS historial_contratistas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN ('alta', 'baja', 'cambio_contratista', 'reactivacion')),
    contratista_anterior VARCHAR(200),
    contratista_nuevo VARCHAR(200) NOT NULL,
    responsable VARCHAR(200) NOT NULL,
    motivo TEXT,
    asociado_id UUID NOT NULL REFERENCES asociados(id),
    contratista_id UUID NOT NULL REFERENCES contratistas(id)
);

-- Índices idempotentes
CREATE INDEX IF NOT EXISTS idx_asociados_activo ON asociados(activo);
CREATE INDEX IF NOT EXISTS idx_asociados_contratista ON asociados(contratista_id);
CREATE INDEX IF NOT EXISTS idx_asociados_cuil ON asociados(cuil);
CREATE INDEX IF NOT EXISTS idx_asociados_dni ON asociados(dni);
CREATE INDEX IF NOT EXISTS idx_asociados_legajo ON asociados(legajo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_historial_asociado ON historial_contratistas(asociado_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_contratistas(fecha);

-- Triggers para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Evitar error si el trigger ya existe
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos iniciales idempotentes
INSERT INTO usuarios (email, password, nombre, apellido, rol)
VALUES 
('admin@cooperativa.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukk5U5kLm', 'Administrador', 'Principal', 'admin'),
('operador@cooperativa.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukk5U5kLm', 'Operador', 'Ejemplo', 'operador')
ON CONFLICT (email) DO NOTHING;

INSERT INTO contratistas (nombre) VALUES 
('Contratista A'),
('Contratista B'),
('Contratista C')
ON CONFLICT (nombre) DO NOTHING;

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE asociados ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_contratistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles_usuario ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas si existen y recrear (idempotente)
DROP POLICY IF EXISTS "Usuarios pueden ver todos los registros" ON usuarios;
DROP POLICY IF EXISTS "Solo admins pueden modificar usuarios" ON usuarios;
CREATE POLICY "Usuarios pueden ver todos los registros" ON usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo admins pueden modificar usuarios" ON usuarios FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Usuarios pueden ver todos los asociados" ON asociados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear asociados" ON asociados;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar asociados" ON asociados;
CREATE POLICY "Usuarios pueden ver todos los asociados" ON asociados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear asociados" ON asociados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios autenticados pueden actualizar asociados" ON asociados FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios pueden ver todos los contratistas" ON contratistas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden gestionar contratistas" ON contratistas;
CREATE POLICY "Usuarios pueden ver todos los contratistas" ON contratistas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden gestionar contratistas" ON contratistas FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Usuarios pueden ver historial" ON historial_contratistas;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear historial" ON historial_contratistas;
CREATE POLICY "Usuarios pueden ver historial" ON historial_contratistas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios autenticados pueden crear historial" ON historial_contratistas FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas para perfiles_usuario
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles" ON perfiles_usuario;
DROP POLICY IF EXISTS "Usuarios pueden gestionar sus perfiles" ON perfiles_usuario;
CREATE POLICY "Usuarios pueden ver perfiles" ON perfiles_usuario FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios pueden gestionar sus perfiles" ON perfiles_usuario FOR ALL TO authenticated USING (true);

-- Tabla de whitelist de emails
CREATE TABLE IF NOT EXISTS whitelist_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    nombre VARCHAR(100),
    apellido VARCHAR(100),
    autorizado_por VARCHAR(255),
    fecha_autorizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para whitelist_emails
CREATE INDEX IF NOT EXISTS idx_whitelist_email ON whitelist_emails(email);
CREATE INDEX IF NOT EXISTS idx_whitelist_activo ON whitelist_emails(activo);

-- RLS para whitelist_emails
ALTER TABLE whitelist_emails ENABLE ROW LEVEL SECURITY;

-- Políticas para whitelist_emails
DROP POLICY IF EXISTS "Usuarios pueden ver whitelist" ON whitelist_emails;
DROP POLICY IF EXISTS "Solo admins pueden gestionar whitelist" ON whitelist_emails;
CREATE POLICY "Usuarios pueden ver whitelist" ON whitelist_emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "Solo admins pueden gestionar whitelist" ON whitelist_emails FOR ALL TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Extensiones útiles (si no existen)
create extension if not exists "uuid-ossp";

-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS perfiles_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_completo VARCHAR(200),
    foto_perfil TEXT, -- URL o path del archivo
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de metadatos de archivos
create table if not exists public.archivos (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid null,                       -- usuario que subió (auth.uid())
  entidad_tipo text not null,               -- 'asociado' | 'accidente' | 'perfil' (o lo que uses)
  entidad_id text not null,                 -- id de la entidad (asociadoId, accidenteId, userId)
  nombre text not null,                     -- nombre original del archivo
  path text not null unique,                -- path en el bucket
  url text null,                            -- URL pública (si corresponde)
  tipo text null,                           -- mime-type
  tamano integer null,                      -- tamaño bytes
  categoria text null,                      -- contrato/medico/identificacion/certificado/otro
  extra jsonb not null default '{}'::jsonb, -- info adicional (descripcion, etc.)
  created_at timestamptz not null default now()
);

-- Índices para búsquedas
create index if not exists idx_archivos_entidad on public.archivos (entidad_tipo, entidad_id);
create index if not exists idx_archivos_created_at on public.archivos (created_at desc);

-- RLS
alter table public.archivos enable row level security;

-- Lectura: permitir a usuarios autenticados ver archivos (ajusta si quieres más restricción)
drop policy if exists archivos_select on public.archivos;
create policy archivos_select
  on public.archivos
  for select
  to authenticated
  using (true);

-- Inserción: solo permitir si el owner_id es el usuario actual
drop policy if exists archivos_insert on public.archivos;
create policy archivos_insert
  on public.archivos
  for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Update/Delete: solo el owner puede modificar/borrar
drop policy if exists archivos_update on public.archivos;
create policy archivos_update
  on public.archivos
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists archivos_delete on public.archivos;
create policy archivos_delete
  on public.archivos
  for delete
  to authenticated
  using (owner_id = auth.uid());
