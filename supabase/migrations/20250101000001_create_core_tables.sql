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
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON public.user_roles(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_roles_updated_at ON public.user_roles(updated_at DESC);

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_login ON public.user_profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at DESC);

-- Índice para búsqueda fuzzy en full_name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name_trgm
  ON public.user_profiles USING GIN (full_name gin_trgm_ops);

-- Índice para búsqueda en metadata JSONB
CREATE INDEX IF NOT EXISTS idx_user_profiles_metadata ON public.user_profiles USING GIN (metadata);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(action_category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Índice compuesto para queries de "actividad reciente de un usuario"
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date
  ON public.audit_logs(user_id, action, created_at DESC);

-- Índices GIN para búsquedas en JSONB
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes ON public.audit_logs USING GIN (changes);
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata ON public.audit_logs USING GIN (metadata);

-- Índices para system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_public
  ON public.system_settings(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at
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
