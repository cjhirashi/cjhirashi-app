# Database Schema - Admin Panel

> **Contexto de Versión**: Este documento describe el schema de base de datos del sistema base existente (Admin Panel),
> implementado antes de v0.1. Corresponde al "Base pre-v0.1" sobre el cual se construye v0.1.

**Versión:** 1.0 (Base pre-v0.1)
**Última Actualización:** 2025-11-11
**Base de Datos:** PostgreSQL 15+ (Supabase)

---

## Diagrama Entidad-Relación

```
┌─────────────────────────┐
│     auth.users          │ (Supabase Auth - No modificar)
│─────────────────────────│
│ id (UUID) PK            │
│ email                   │
│ created_at              │
│ ...                     │
└─────────────────────────┘
            │
            │ 1:1
            ├──────────────────────┐
            │                      │
            ↓                      ↓
┌─────────────────────────┐  ┌─────────────────────────┐
│    user_roles           │  │    user_profiles        │
│─────────────────────────│  │─────────────────────────│
│ user_id (UUID) PK, FK   │  │ user_id (UUID) PK, FK   │
│ role (ENUM)             │  │ full_name               │
│ assigned_by (UUID) FK   │  │ avatar_url              │
│ assigned_at             │  │ status (ENUM)           │
│ updated_at              │  │ last_login_at           │
└─────────────────────────┘  │ metadata (JSONB)        │
            │                 │ created_at              │
            │                 │ updated_at              │
            │                 └─────────────────────────┘
            │
            │ 1:N
            ↓
┌─────────────────────────┐
│     audit_logs          │
│─────────────────────────│
│ id (UUID) PK            │
│ user_id (UUID) FK       │
│ action                  │
│ action_category (ENUM)  │
│ resource_type           │
│ resource_id             │
│ changes (JSONB)         │
│ metadata (JSONB)        │
│ ip_address (INET)       │
│ user_agent              │
│ created_at              │
└─────────────────────────┘

┌─────────────────────────┐
│   system_settings       │
│─────────────────────────│
│ key (VARCHAR) PK        │
│ value                   │
│ value_type (ENUM)       │
│ description             │
│ is_public               │
│ is_encrypted            │
│ updated_by (UUID) FK    │
│ updated_at              │
└─────────────────────────┘
```

---

## Migración 001: Tablas Core

```sql
-- ============================================================================
-- MIGRATION 001: Core Admin Panel Tables
-- Description: Creates base tables for RBAC, profiles, audit, and settings
-- Author: Architecture Team
-- Date: 2025-11-11
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

-- Roles del sistema
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');

-- Estados de usuario
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- Categorías de acciones de auditoría
CREATE TYPE audit_action_category AS ENUM (
  'auth',
  'user',
  'role',
  'setting',
  'system'
);

-- Tipos de valores para settings
CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json');

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabla: user_roles
-- Propósito: Almacenar roles de usuarios para RBAC
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'user',
  assigned_by UUID,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_user_roles_user_id
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_user_roles_assigned_by
    FOREIGN KEY (assigned_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL
);

-- Comentarios
COMMENT ON TABLE public.user_roles IS 'Stores user roles for RBAC system';
COMMENT ON COLUMN public.user_roles.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN public.user_roles.role IS 'User role: admin, moderator, or user';
COMMENT ON COLUMN public.user_roles.assigned_by IS 'Admin who assigned this role';
COMMENT ON COLUMN public.user_roles.assigned_at IS 'When role was first assigned';
COMMENT ON COLUMN public.user_roles.updated_at IS 'Last time role was changed';

-- ----------------------------------------------------------------------------
-- Tabla: user_profiles
-- Propósito: Metadatos extendidos de usuarios
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY,
  full_name VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  status user_status NOT NULL DEFAULT 'pending',
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  email_verified_at TIMESTAMPTZ,
  phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'es',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Key
  CONSTRAINT fk_user_profiles_user_id
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT check_phone_format CHECK (phone ~ '^\+?[0-9]{10,20}$' OR phone IS NULL),
  CONSTRAINT check_timezone_valid CHECK (timezone IS NOT NULL)
);

-- Comentarios
COMMENT ON TABLE public.user_profiles IS 'Extended user metadata beyond auth.users';
COMMENT ON COLUMN public.user_profiles.status IS 'User account status';
COMMENT ON COLUMN public.user_profiles.metadata IS 'Flexible JSON field for custom attributes';
COMMENT ON COLUMN public.user_profiles.last_login_at IS 'Last successful login timestamp';
COMMENT ON COLUMN public.user_profiles.last_login_ip IS 'IP address of last login';

-- ----------------------------------------------------------------------------
-- Tabla: audit_logs
-- Propósito: Registro inmutable de acciones administrativas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  action_category audit_action_category NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  changes JSONB,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Key
  CONSTRAINT fk_audit_logs_user_id
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  -- Constraints
  CONSTRAINT check_action_format CHECK (action ~ '^[a-z]+\.[a-z_]+$'),
  CONSTRAINT check_resource_type_format CHECK (
    resource_type IS NULL OR resource_type ~ '^[a-z_]+$'
  )
);

-- Comentarios
COMMENT ON TABLE public.audit_logs IS 'Immutable audit trail of all administrative actions';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (e.g., user.create, role.update)';
COMMENT ON COLUMN public.audit_logs.action_category IS 'High-level category for filtering';
COMMENT ON COLUMN public.audit_logs.resource_type IS 'Type of resource affected (user, role, setting)';
COMMENT ON COLUMN public.audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN public.audit_logs.changes IS 'JSON object with before/after values';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional context (request headers, query params)';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the user who performed the action';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent string of the request';

-- ----------------------------------------------------------------------------
-- Tabla: system_settings
-- Propósito: Configuración global del sistema
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  value_type setting_type NOT NULL DEFAULT 'string',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Foreign Key
  CONSTRAINT fk_system_settings_updated_by
    FOREIGN KEY (updated_by)
    REFERENCES auth.users(id)
    ON DELETE SET NULL,

  -- Constraints
  CONSTRAINT check_key_format CHECK (key ~ '^[a-z][a-z0-9_.]*$'),
  CONSTRAINT check_key_length CHECK (length(key) >= 3)
);

-- Comentarios
COMMENT ON TABLE public.system_settings IS 'System-wide configuration key-value store';
COMMENT ON COLUMN public.system_settings.key IS 'Setting key (dot notation, e.g., app.name)';
COMMENT ON COLUMN public.system_settings.value IS 'Setting value (stored as text, parsed by type)';
COMMENT ON COLUMN public.system_settings.value_type IS 'Data type for parsing value';
COMMENT ON COLUMN public.system_settings.is_public IS 'Whether setting can be read by non-admins';
COMMENT ON COLUMN public.system_settings.is_encrypted IS 'Whether value is encrypted at rest';

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Índices para user_roles
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_assigned_by ON public.user_roles(assigned_by);
CREATE INDEX idx_user_roles_updated_at ON public.user_roles(updated_at DESC);

-- Índices para user_profiles
CREATE INDEX idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX idx_user_profiles_last_login ON public.user_profiles(last_login_at DESC);
CREATE INDEX idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- Índice para búsqueda fuzzy en full_name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_user_profiles_full_name_trgm
  ON public.user_profiles USING GIN (full_name gin_trgm_ops);

-- Índice para búsqueda en metadata JSONB
CREATE INDEX idx_user_profiles_metadata ON public.user_profiles USING GIN (metadata);

-- Índices para audit_logs
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_category ON public.audit_logs(action_category);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Índice compuesto para queries de "actividad reciente de un usuario"
CREATE INDEX idx_audit_logs_user_action_date
  ON public.audit_logs(user_id, action, created_at DESC);

-- Índices GIN para búsquedas en JSONB
CREATE INDEX idx_audit_logs_changes ON public.audit_logs USING GIN (changes);
CREATE INDEX idx_audit_logs_metadata ON public.audit_logs USING GIN (metadata);

-- Índices para system_settings
CREATE INDEX idx_system_settings_public
  ON public.system_settings(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_system_settings_updated_at
  ON public.system_settings(updated_at DESC);

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para user_roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers para user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Triggers para system_settings
CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: Auto-crear perfil y rol para nuevos usuarios
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_user_profile_and_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Crear perfil
  INSERT INTO public.user_profiles (user_id, full_name, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending'
  );

  -- Asignar rol por defecto
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_and_role();

COMMENT ON FUNCTION create_user_profile_and_role() IS
  'Automatically creates profile and assigns default role to new users';

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Policies para user_roles
-- ----------------------------------------------------------------------------

-- Policy: Usuarios pueden leer su propio rol
CREATE POLICY "users_read_own_role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins pueden leer todos los roles
CREATE POLICY "admins_read_all_roles"
  ON public.user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Solo admins pueden modificar roles
CREATE POLICY "admins_modify_roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    -- No pueden modificar su propio rol
    user_id != auth.uid()
  );

-- ----------------------------------------------------------------------------
-- Policies para user_profiles
-- ----------------------------------------------------------------------------

-- Policy: Usuarios pueden leer su propio perfil
CREATE POLICY "users_read_own_profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Admins y moderators pueden leer todos los perfiles
CREATE POLICY "admins_read_all_profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Policy: Usuarios pueden actualizar su propio perfil (campos limitados)
CREATE POLICY "users_update_own_profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- No pueden cambiar status
    status = (SELECT status FROM public.user_profiles WHERE user_id = auth.uid())
  );

-- Policy: Solo admins pueden cambiar status y otros campos protegidos
CREATE POLICY "admins_update_all_profiles"
  ON public.user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Solo admins pueden eliminar perfiles
CREATE POLICY "admins_delete_profiles"
  ON public.user_profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- Policies para audit_logs
-- ----------------------------------------------------------------------------

-- Policy: Solo admins y moderators pueden leer logs
CREATE POLICY "admins_read_logs"
  ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Policy: Sistema puede insertar logs (via service role key)
-- NO policy for INSERT = only service role can insert

-- Policy: Nadie puede modificar o eliminar logs (inmutabilidad)
-- NO policy for UPDATE/DELETE = denied for everyone

-- ----------------------------------------------------------------------------
-- Policies para system_settings
-- ----------------------------------------------------------------------------

-- Policy: Settings públicos legibles por todos
CREATE POLICY "public_settings_readable"
  ON public.system_settings
  FOR SELECT
  USING (is_public = TRUE);

-- Policy: Solo admins pueden leer settings privados
CREATE POLICY "admins_read_all_settings"
  ON public.system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Solo admins pueden modificar settings
CREATE POLICY "admins_modify_settings"
  ON public.system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Función: Obtener rol de usuario
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.user_roles WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_role(UUID) IS 'Returns the role of a given user';

-- Función: Verificar si usuario tiene permiso
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_value user_role;
  role_hierarchy_user INTEGER;
  role_hierarchy_required INTEGER;
BEGIN
  -- Obtener rol del usuario
  user_role_value := get_user_role(p_user_id);

  IF user_role_value IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Definir jerarquía (admin > moderator > user)
  role_hierarchy_user := CASE user_role_value
    WHEN 'admin' THEN 3
    WHEN 'moderator' THEN 2
    WHEN 'user' THEN 1
  END;

  role_hierarchy_required := CASE p_required_role
    WHEN 'admin' THEN 3
    WHEN 'moderator' THEN 2
    WHEN 'user' THEN 1
  END;

  RETURN role_hierarchy_user >= role_hierarchy_required;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION has_permission(UUID, user_role) IS
  'Checks if user has required permission based on role hierarchy';

-- Función: Insertar audit log (SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION insert_audit_log(
  p_user_id UUID,
  p_action VARCHAR,
  p_action_category audit_action_category,
  p_resource_type VARCHAR DEFAULT NULL,
  p_resource_id VARCHAR DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, action_category, resource_type, resource_id,
    changes, metadata, ip_address, user_agent
  ) VALUES (
    p_user_id, p_action, p_action_category, p_resource_type, p_resource_id,
    p_changes, p_metadata, p_ip_address, p_user_agent
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION insert_audit_log IS
  'Inserts audit log entry (bypasses RLS for system operations)';

COMMIT;

-- ============================================================================
-- END OF MIGRATION 001
-- ============================================================================
```

---

## Migración 002: Vistas de Analytics

```sql
-- ============================================================================
-- MIGRATION 002: Analytics Views
-- Description: Creates materialized views and regular views for analytics
-- Author: Architecture Team
-- Date: 2025-11-11
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. MATERIALIZED VIEW: Dashboard Stats
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.admin_dashboard_stats AS
SELECT
  -- Users stats
  (SELECT COUNT(*) FROM public.user_profiles) as total_users,
  (SELECT COUNT(*) FROM public.user_profiles WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM public.user_profiles WHERE status = 'inactive') as inactive_users,
  (SELECT COUNT(*) FROM public.user_profiles WHERE status = 'suspended') as suspended_users,
  (SELECT COUNT(*) FROM public.user_profiles WHERE status = 'pending') as pending_users,

  -- New users
  (SELECT COUNT(*) FROM public.user_profiles WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_today,
  (SELECT COUNT(*) FROM public.user_profiles WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM public.user_profiles WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,

  -- Roles stats
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'moderator') as total_moderators,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'user') as total_regular_users,

  -- Activity stats
  (SELECT COUNT(*) FROM public.audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as actions_today,
  (SELECT COUNT(*) FROM public.audit_logs WHERE created_at >= NOW() - INTERVAL '7 days') as actions_week,

  -- Timestamp
  NOW() as refreshed_at;

-- Índice único necesario para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX ON public.admin_dashboard_stats ((1));

COMMENT ON MATERIALIZED VIEW public.admin_dashboard_stats IS
  'Cached dashboard statistics, refresh every 5 minutes';

-- ============================================================================
-- 2. VIEW: User Activity Summary
-- ============================================================================

CREATE OR REPLACE VIEW public.user_activity_summary AS
SELECT
  u.id,
  up.full_name,
  u.email,
  ur.role,
  up.status,
  up.last_login_at,
  up.created_at as user_since,
  (SELECT COUNT(*) FROM public.audit_logs WHERE user_id = u.id) as total_actions,
  (SELECT COUNT(*) FROM public.audit_logs WHERE user_id = u.id AND created_at >= NOW() - INTERVAL '24 hours') as actions_today,
  (SELECT COUNT(*) FROM public.audit_logs WHERE user_id = u.id AND created_at >= NOW() - INTERVAL '7 days') as actions_week,
  (SELECT COUNT(*) FROM public.audit_logs WHERE user_id = u.id AND created_at >= NOW() - INTERVAL '30 days') as actions_month
FROM auth.users u
JOIN public.user_profiles up ON up.user_id = u.id
JOIN public.user_roles ur ON ur.user_id = u.id;

COMMENT ON VIEW public.user_activity_summary IS
  'Comprehensive user activity metrics for admin panel';

-- ============================================================================
-- 3. VIEW: Recent Activity
-- ============================================================================

CREATE OR REPLACE VIEW public.recent_activity AS
SELECT
  al.id,
  al.action,
  al.action_category,
  al.resource_type,
  al.resource_id,
  al.created_at,
  u.email as user_email,
  up.full_name as user_name,
  ur.role as user_role
FROM public.audit_logs al
JOIN auth.users u ON u.id = al.user_id
JOIN public.user_profiles up ON up.user_id = al.user_id
JOIN public.user_roles ur ON ur.user_id = al.user_id
ORDER BY al.created_at DESC
LIMIT 100;

COMMENT ON VIEW public.recent_activity IS
  'Last 100 audit log entries with user information';

-- ============================================================================
-- 4. FUNCTION: Refresh Dashboard Stats
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_dashboard_stats() IS
  'Refreshes the dashboard stats materialized view';

COMMIT;

-- ============================================================================
-- END OF MIGRATION 002
-- ============================================================================
```

---

## Migración 003: Datos Iniciales (Seeds)

```sql
-- ============================================================================
-- MIGRATION 003: Seed Initial Data
-- Description: Seeds initial system settings and assigns first admin
-- Author: Architecture Team
-- Date: 2025-11-11
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. SYSTEM SETTINGS
-- ============================================================================

INSERT INTO public.system_settings (key, value, value_type, description, is_public) VALUES
  ('app.name', 'Admin Panel', 'string', 'Application name', TRUE),
  ('app.version', '1.0.0', 'string', 'Application version', TRUE),
  ('app.maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', FALSE),
  ('auth.max_login_attempts', '5', 'number', 'Max failed login attempts before lockout', FALSE),
  ('auth.lockout_duration', '900', 'number', 'Lockout duration in seconds (15 min)', FALSE),
  ('audit.retention_days', '365', 'number', 'Days to retain audit logs before archiving', FALSE),
  ('pagination.default_limit', '20', 'number', 'Default pagination limit', FALSE),
  ('pagination.max_limit', '100', 'number', 'Maximum pagination limit', FALSE)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 2. ASSIGN FIRST ADMIN
-- ============================================================================

-- IMPORTANTE: Reemplazar 'admin@example.com' con el email real del primer admin
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Obtener ID del primer usuario registrado (o por email específico)
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@example.com' -- CAMBIAR ESTE EMAIL
  LIMIT 1;

  IF admin_user_id IS NOT NULL THEN
    -- Actualizar rol a admin
    UPDATE public.user_roles
    SET role = 'admin', updated_at = NOW()
    WHERE user_id = admin_user_id;

    -- Actualizar status a active
    UPDATE public.user_profiles
    SET status = 'active', updated_at = NOW()
    WHERE user_id = admin_user_id;

    RAISE NOTICE 'Admin role assigned to user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No user found with email admin@example.com - skipping admin assignment';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- END OF MIGRATION 003
-- ============================================================================
```

---

## Queries Útiles

### Verificar Integridad

```sql
-- Verificar que todos los usuarios tienen perfil
SELECT COUNT(*)
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.user_id = u.id
WHERE up.user_id IS NULL;
-- Esperado: 0

-- Verificar que todos los usuarios tienen rol
SELECT COUNT(*)
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;
-- Esperado: 0

-- Verificar índices existen
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings')
ORDER BY tablename, indexname;
```

### Performance Testing

```sql
-- Test: Query de lista de usuarios (debe usar índice)
EXPLAIN ANALYZE
SELECT *
FROM public.user_profiles
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 20;
-- Esperado: Index Scan on idx_user_profiles_status

-- Test: Búsqueda por nombre (debe usar trigram index)
EXPLAIN ANALYZE
SELECT *
FROM public.user_profiles
WHERE full_name ILIKE '%john%';
-- Esperado: Bitmap Index Scan on idx_user_profiles_full_name_trgm

-- Test: Audit logs por usuario (debe usar índice compuesto)
EXPLAIN ANALYZE
SELECT *
FROM public.audit_logs
WHERE user_id = 'some-uuid'
ORDER BY created_at DESC
LIMIT 20;
-- Esperado: Index Scan on idx_audit_logs_user_action_date
```

---

## Mantenimiento

### Refresh de Vistas Materializadas

```sql
-- Manual refresh (ejecutar cuando sea necesario)
REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_stats;

-- Automatizado con pg_cron (requiere extensión y superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'refresh-dashboard-stats',
  '*/5 * * * *',  -- Cada 5 minutos
  'REFRESH MATERIALIZED VIEW CONCURRENTLY public.admin_dashboard_stats'
);
```

### Archivado de Audit Logs

```sql
-- Crear tabla de archivo
CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  LIKE public.audit_logs INCLUDING ALL
);

-- Mover logs antiguos (ejecutar mensualmente)
WITH moved AS (
  DELETE FROM public.audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year'
  RETURNING *
)
INSERT INTO public.audit_logs_archive
SELECT * FROM moved;

-- Comprimir tabla de archivo
VACUUM FULL public.audit_logs_archive;
```

### Estadísticas de DB

```sql
-- Actualizar estadísticas (mejora query planner)
ANALYZE public.user_roles;
ANALYZE public.user_profiles;
ANALYZE public.audit_logs;
ANALYZE public.system_settings;
```

---

## Documentos Relacionados

- [ADR-002: Database Schema Design](../decisions/adr-002-database-schema.md)
- [Arquitectura del Admin Panel](./admin-panel-architecture.md)
