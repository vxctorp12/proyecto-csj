-- =============================================================================
-- ESQUEMA DE BASE DE DATOS: SISTEMA DE GESTIÓN DE MULTIFUNCIONALES (CONTRATO 27-)
-- PostgreSQL / Supabase
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función genérica de auditoría para updated_at
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. TABLA USUARIOS (Catálogo de técnicos + vínculo opcional con Supabase Auth)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    email VARCHAR(150) UNIQUE NULL,
    nombre_completo VARCHAR(120) NOT NULL UNIQUE,
    rol VARCHAR(30) NOT NULL DEFAULT 'tecnico',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    updated_by UUID NULL
);

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 2. TABLA EQUIPOS (Inventario precargado Contrato 27-)
CREATE TABLE IF NOT EXISTS equipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_activo VARCHAR(50) NOT NULL UNIQUE,
    marca VARCHAR(80) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    serie VARCHAR(100) NULL,
    ubicacion TEXT NOT NULL,
    zona VARCHAR(100) NOT NULL,
    contrato_prefijo VARCHAR(10) NOT NULL DEFAULT '27',
    estado_actual VARCHAR(40) NOT NULL DEFAULT 'Activo',
    observaciones TEXT NULL,
    fecha_ultimo_mtto DATE NULL,
    fecha_proximo_mtto DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    updated_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_equipos_codigo_activo ON equipos(codigo_activo);
CREATE INDEX IF NOT EXISTS idx_equipos_serie ON equipos(serie);
CREATE INDEX IF NOT EXISTS idx_equipos_modelo ON equipos(modelo);
CREATE INDEX IF NOT EXISTS idx_equipos_zona ON equipos(zona);
CREATE INDEX IF NOT EXISTS idx_equipos_estado ON equipos(estado_actual);
CREATE INDEX IF NOT EXISTS idx_equipos_proximo_mtto ON equipos(fecha_proximo_mtto);

DROP TRIGGER IF EXISTS trg_equipos_updated_at ON equipos;
CREATE TRIGGER trg_equipos_updated_at
BEFORE UPDATE ON equipos
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- 3. TABLA MANTENIMIENTOS (Bitácora e historial técnico por equipo)
CREATE TABLE IF NOT EXISTS mantenimientos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipo_id UUID NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    tecnico_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    fecha_mantenimiento DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo_mantenimiento VARCHAR(30) NOT NULL DEFAULT 'Preventivo',
    estado_resultante VARCHAR(40) NOT NULL,
    ubicacion_registrada TEXT NULL,
    observaciones TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    updated_by UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo_id ON mantenimientos(equipo_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_tecnico_id ON mantenimientos(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_mantenimientos_fecha ON mantenimientos(fecha_mantenimiento DESC);

DROP TRIGGER IF EXISTS trg_mantenimientos_updated_at ON mantenimientos;
CREATE TRIGGER trg_mantenimientos_updated_at
BEFORE UPDATE ON mantenimientos
FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- TRIGGER DE NEGOCIO: Sincroniza equipo y suma 45 días al próximo mtto (salvo Dado de baja)
CREATE OR REPLACE FUNCTION fn_sincronizar_equipo_tras_mtto()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE equipos
    SET 
        estado_actual = NEW.estado_resultante,
        fecha_ultimo_mtto = NEW.fecha_mantenimiento,
        fecha_proximo_mtto = CASE
            WHEN LOWER(TRIM(NEW.estado_resultante)) = 'dado de baja' THEN NULL
            ELSE (NEW.fecha_mantenimiento + INTERVAL '45 days')::DATE
        END,
        ubicacion = COALESCE(NULLIF(UPPER(TRIM(NEW.ubicacion_registrada)), ''), ubicacion),
        observaciones = COALESCE(NULLIF(UPPER(TRIM(NEW.observaciones)), ''), observaciones),
        updated_by = NEW.tecnico_id
    WHERE id = NEW.equipo_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_insert_mantenimiento ON mantenimientos;
CREATE TRIGGER trg_after_insert_mantenimiento
AFTER INSERT ON mantenimientos
FOR EACH ROW EXECUTE FUNCTION fn_sincronizar_equipo_tras_mtto();

-- =============================================================================
-- 4. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS) PARA USUARIOS AUTENTICADOS
-- =============================================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mantenimientos ENABLE ROW LEVEL SECURITY;

-- Políticas para tabla usuarios
DROP POLICY IF EXISTS "Permitir lectura de usuarios a autenticados" ON usuarios;
CREATE POLICY "Permitir lectura de usuarios a autenticados"
ON usuarios FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir insercion/edicion de usuarios a autenticados" ON usuarios;
CREATE POLICY "Permitir insercion/edicion de usuarios a autenticados"
ON usuarios FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para tabla equipos
DROP POLICY IF EXISTS "Permitir lectura de equipos a autenticados" ON equipos;
CREATE POLICY "Permitir lectura de equipos a autenticados"
ON equipos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion de equipos a autenticados" ON equipos;
CREATE POLICY "Permitir actualizacion de equipos a autenticados"
ON equipos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas para tabla mantenimientos
DROP POLICY IF EXISTS "Permitir lectura de mantenimientos a autenticados" ON mantenimientos;
CREATE POLICY "Permitir lectura de mantenimientos a autenticados"
ON mantenimientos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir registro de mantenimientos a autenticados" ON mantenimientos;
CREATE POLICY "Permitir registro de mantenimientos a autenticados"
ON mantenimientos FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

