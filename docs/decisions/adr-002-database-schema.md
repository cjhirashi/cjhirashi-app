# ADR-002: Diseño del Schema de Base de Datos para Admin Panel

**Estado:** Aceptado
**Fecha:** 2025-11-11
**Decisores:** Database Team, Security Team
**Contexto Técnico:** PostgreSQL (Supabase), Row Level Security, Next.js 15

---

## Contexto y Problema

Necesitamos diseñar un schema de base de datos que soporte:

1. Sistema de roles y permisos (RBAC)
2. Gestión de usuarios con metadatos adicionales
3. Auditoría completa de acciones administrativas
4. Analytics y reporting
5. Configuración del sistema
6. Escalabilidad para futuras funcionalidades

### Requisitos Específicos

- **Integridad Referencial**: Relaciones claras entre entidades
- **Auditabilidad**: Registro inmutable de todas las acciones
- **Performance**: Índices optimizados para queries frecuentes
- **Seguridad**: Row Level Security (RLS) en todas las tablas sensibles
- **Compatibilidad**: Integración con auth.users de Supabase
- **Escalabilidad**: Soporte para millones de registros de audit

---

## Opciones Consideradas

### Opción 1: Schema Minimalista

**Descripción**: Solo tablas esenciales (users, roles)

**Pros:**
- Simple de implementar
- Bajo overhead

**Contras:**
- No escalable
- Sin auditoría
- Metadatos insuficientes

**Evaluación:** Rechazada - Insuficiente para requisitos del proyecto

---

### Opción 2: Schema Completo con Todas las Funcionalidades

**Descripción**: Implementar todas las tablas posibles desde el inicio

**Pros:**
- Preparado para el futuro
- No requiere migraciones complejas

**Contras:**
- Over-engineering
- Mayor complejidad inicial
- Más superficie de ataque

**Evaluación:** Rechazada - Violates YAGNI principle

---

### Opción 3: Schema Modular Iterativo (SELECCIONADA)

**Descripción**: Implementar tablas core ahora, escalar incrementalmente

**Core Tables:**
1. `user_roles` - Roles de usuarios
2. `audit_logs` - Auditoría
3. `user_profiles` - Metadatos extendidos de usuarios
4. `system_settings` - Configuración

**Future Tables:**
5. `permissions` - Permisos granulares (fase 2)
6. `role_permissions` - Relación roles-permisos (fase 2)
7. `sessions` - Seguimiento de sesiones (fase 2)

**Pros:**
- Balance entre completitud y simplicidad
- Iterativo y escalable
- Cubre necesidades inmediatas
- Fácil de testear

**Contras:**
- Requiere migraciones futuras
- Debe planificarse bien desde el inicio

**Evaluación:** ACEPTADA - Balance óptimo

---

## Decisión

Implementar **Opción 3: Schema Modular Iterativo**

---

## Schema Detallado

### 1. Tabla: `user_roles`

**Propósito**: Almacenar el rol de cada usuario

```sql
-- Enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
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

-- Índices
CREATE INDEX idx_user_roles_role ON user_roles(role);
CREATE INDEX idx_user_roles_assigned_by ON user_roles(assigned_by);

-- Comentarios
COMMENT ON TABLE user_roles IS 'Stores user roles for RBAC system';
COMMENT ON COLUMN user_roles.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN user_roles.role IS 'User role: admin, moderator, or user';
COMMENT ON COLUMN user_roles.assigned_by IS 'Admin who assigned this role';
```

**Justificación de Diseño:**
- `user_id` como PK garantiza un único rol por usuario
- `assigned_by` permite rastrear quién asignó cada rol
- Usar ENUM para `role` previene valores inválidos
- `updated_at` permite auditar cambios de rol

---

### 2. Tabla: `audit_logs`

**Propósito**: Registro inmutable de todas las acciones administrativas

```sql
CREATE TYPE audit_action_category AS ENUM (
  'auth',
  'user',
  'role',
  'setting',
  'system'
);

CREATE TABLE public.audit_logs (
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
    ON DELETE CASCADE
);

-- Índices para queries comunes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_category ON audit_logs(action_category);

-- Índice compuesto para queries de "actividad reciente de un usuario"
CREATE INDEX idx_audit_logs_user_action_date
  ON audit_logs(user_id, action, created_at DESC);

-- Índice GIN para búsquedas en JSONB
CREATE INDEX idx_audit_logs_changes ON audit_logs USING GIN (changes);
CREATE INDEX idx_audit_logs_metadata ON audit_logs USING GIN (metadata);

-- Comentarios
COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all administrative actions';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., user.create, role.update)';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object with before/after values';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context (e.g., request headers, query params)';
```

**Justificación de Diseño:**
- UUID auto-generado como PK (no secuencial para seguridad)
- `changes` JSONB permite almacenar diffs estructurados
- `metadata` JSONB para contexto adicional sin modificar schema
- `ip_address` tipo INET para eficiencia y validación
- Múltiples índices para diferentes patrones de consulta:
  - Por usuario (historial de un admin)
  - Por acción (todas las veces que se eliminó un usuario)
  - Por fecha (actividad reciente)
  - Por recurso (historial de un usuario específico)
- GIN indexes en JSONB para búsquedas complejas

**Ejemplo de Registro:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "admin-uuid",
  "action": "user.role.update",
  "action_category": "role",
  "resource_type": "user",
  "resource_id": "target-user-uuid",
  "changes": {
    "role": {
      "from": "user",
      "to": "moderator"
    }
  },
  "metadata": {
    "request_id": "req-123",
    "session_id": "sess-456"
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-11-11T10:30:00Z"
}
```

---

### 3. Tabla: `user_profiles`

**Propósito**: Metadatos extendidos de usuarios (complementa auth.users)

```sql
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

CREATE TABLE public.user_profiles (
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
    ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_user_profiles_status ON user_profiles(status);
CREATE INDEX idx_user_profiles_last_login ON user_profiles(last_login_at DESC);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- Índice para búsqueda de texto completo
CREATE INDEX idx_user_profiles_full_name_trgm
  ON user_profiles USING GIN (full_name gin_trgm_ops);

-- Comentarios
COMMENT ON TABLE user_profiles IS 'Extended user metadata beyond auth.users';
COMMENT ON COLUMN user_profiles.status IS 'User account status';
COMMENT ON COLUMN user_profiles.metadata IS 'Flexible JSON field for custom attributes';
```

**Justificación de Diseño:**
- Separado de `auth.users` para no modificar schema de Supabase Auth
- `status` ENUM para control de estados válidos
- `metadata` JSONB para extensibilidad sin migraciones
- Índice trigram en `full_name` para búsquedas fuzzy eficientes
- Tracking de último login para analytics y seguridad

---

### 4. Tabla: `system_settings`

**Propósito**: Configuración global del sistema

```sql
CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json');

CREATE TABLE public.system_settings (
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
    ON DELETE SET NULL
);

-- Índice para settings públicos
CREATE INDEX idx_system_settings_public ON system_settings(is_public) WHERE is_public = TRUE;

-- Comentarios
COMMENT ON TABLE system_settings IS 'System-wide configuration key-value store';
COMMENT ON COLUMN system_settings.is_public IS 'Whether setting can be read by non-admins';
COMMENT ON COLUMN system_settings.is_encrypted IS 'Whether value is encrypted at rest';
```

**Justificación de Diseño:**
- Key-value store simple y flexible
- `value_type` para type-safe parsing en aplicación
- `is_public` permite exponer ciertos settings a frontend
- `is_encrypted` marca valores sensibles (API keys, secrets)
- `updated_by` para auditoría de cambios

**Ejemplos de Settings:**

```sql
INSERT INTO system_settings (key, value, value_type, description, is_public) VALUES
  ('app.name', 'Admin Panel', 'string', 'Application name', TRUE),
  ('app.maintenance_mode', 'false', 'boolean', 'Enable maintenance mode', FALSE),
  ('auth.max_login_attempts', '5', 'number', 'Max failed login attempts', FALSE),
  ('email.smtp_host', 'smtp.example.com', 'string', 'SMTP server', FALSE);
```

---

### 5. Triggers Automáticos

#### Trigger: `updated_at` Auto-Update

```sql
-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Trigger: Auto-Create User Profile

```sql
-- Crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, full_name, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'pending'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
```

**Justificación**: Garantiza consistencia - todo usuario tiene perfil y rol

---

### 6. Row Level Security (RLS) Policies

#### Policies: `user_roles`

```sql
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Usuarios pueden leer su propio rol
CREATE POLICY "Users can read own role"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admins pueden ver todos los roles
CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Solo admins pueden modificar roles
CREATE POLICY "Only admins can modify roles"
  ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

#### Policies: `audit_logs`

```sql
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Solo admins y moderators pueden leer logs
CREATE POLICY "Admins and moderators can read logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Policy 2: Nadie puede modificar logs (inmutables)
-- No CREATE POLICY for UPDATE/DELETE = denied by default

-- Policy 3: Sistema puede insertar logs (via service role key)
-- Handled by application with service role key
```

#### Policies: `user_profiles`

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Usuarios pueden leer su propio perfil
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Admins y moderators pueden leer todos los perfiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Policy 3: Usuarios pueden actualizar su propio perfil (campos limitados)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- No pueden cambiar status
    status = (SELECT status FROM user_profiles WHERE user_id = auth.uid())
  );

-- Policy 4: Solo admins pueden cambiar status
CREATE POLICY "Admins can update all profiles"
  ON user_profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

#### Policies: `system_settings`

```sql
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Settings públicos legibles por todos
CREATE POLICY "Public settings readable by all"
  ON system_settings
  FOR SELECT
  USING (is_public = TRUE);

-- Policy 2: Solo admins pueden leer settings privados
CREATE POLICY "Admins can read all settings"
  ON system_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy 3: Solo admins pueden modificar settings
CREATE POLICY "Only admins can modify settings"
  ON system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

---

### 7. Vistas para Analytics

#### Vista: `admin_dashboard_stats`

```sql
CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM user_profiles) as total_users,
  (SELECT COUNT(*) FROM user_profiles WHERE status = 'active') as active_users,
  (SELECT COUNT(*) FROM user_profiles WHERE created_at >= NOW() - INTERVAL '24 hours') as new_users_today,
  (SELECT COUNT(*) FROM user_profiles WHERE created_at >= NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM user_profiles WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month,
  (SELECT COUNT(*) FROM user_roles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM user_roles WHERE role = 'moderator') as total_moderators,
  (SELECT COUNT(*) FROM audit_logs WHERE created_at >= NOW() - INTERVAL '24 hours') as actions_today,
  NOW() as refreshed_at;

-- Índice único necesario para REFRESH CONCURRENTLY
CREATE UNIQUE INDEX ON admin_dashboard_stats ((1));

-- Comentario
COMMENT ON MATERIALIZED VIEW admin_dashboard_stats IS 'Cached dashboard statistics, refreshed every 5 minutes';
```

**Refresh automático con pg_cron** (requiere extensión):

```sql
-- Instalar extensión (requiere superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule refresh cada 5 minutos
SELECT cron.schedule(
  'refresh-admin-dashboard-stats',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats'
);
```

**Alternativa sin pg_cron**: Refresh manual desde aplicación:

```typescript
// lib/admin/queries/dashboard.ts
export async function getDashboardStats() {
  const supabase = await createClient();

  // Intentar refresh (solo admins pueden hacerlo)
  await supabase.rpc('refresh_dashboard_stats');

  // Obtener stats
  const { data } = await supabase
    .from('admin_dashboard_stats')
    .select('*')
    .single();

  return data;
}

// Function en Supabase
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Vista: `user_activity_summary`

```sql
CREATE VIEW user_activity_summary AS
SELECT
  u.id,
  up.full_name,
  u.email,
  ur.role,
  up.status,
  up.last_login_at,
  (SELECT COUNT(*) FROM audit_logs WHERE user_id = u.id) as total_actions,
  (SELECT COUNT(*) FROM audit_logs WHERE user_id = u.id AND created_at >= NOW() - INTERVAL '24 hours') as actions_today,
  u.created_at as user_since
FROM auth.users u
JOIN user_profiles up ON up.user_id = u.id
JOIN user_roles ur ON ur.user_id = u.id;

-- Comentario
COMMENT ON VIEW user_activity_summary IS 'Comprehensive user activity metrics for admin panel';
```

---

### 8. Funciones Útiles

#### Función: Get User Role

```sql
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM user_roles WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Uso: SELECT get_user_role(auth.uid());
```

#### Función: Has Permission

```sql
CREATE OR REPLACE FUNCTION has_permission(p_user_id UUID, p_required_role user_role)
RETURNS BOOLEAN AS $$
DECLARE
  user_role_value user_role;
  role_hierarchy_user INTEGER;
  role_hierarchy_required INTEGER;
BEGIN
  -- Obtener rol del usuario
  SELECT role INTO user_role_value FROM user_roles WHERE user_id = p_user_id;

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

-- Uso en RLS:
-- WHERE has_permission(auth.uid(), 'moderator')
```

---

## Diagrama de Relaciones

```
auth.users (Supabase Auth)
    |
    ├─── user_profiles (1:1)
    │    └─── user_id FK
    │
    ├─── user_roles (1:1)
    │    ├─── user_id FK
    │    └─── assigned_by FK → auth.users
    │
    └─── audit_logs (1:N)
         └─── user_id FK

system_settings (independiente)
    └─── updated_by FK → auth.users
```

---

## Estrategia de Migraciones

### Migración 001: Core Tables

```sql
-- 001_create_admin_tables.sql
BEGIN;

-- 1. Crear ENUMs
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE audit_action_category AS ENUM ('auth', 'user', 'role', 'setting', 'system');
CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json');

-- 2. Crear tablas
CREATE TABLE user_roles (...);
CREATE TABLE user_profiles (...);
CREATE TABLE audit_logs (...);
CREATE TABLE system_settings (...);

-- 3. Crear índices
CREATE INDEX ...;

-- 4. Crear triggers
CREATE FUNCTION ...;
CREATE TRIGGER ...;

-- 5. Habilitar RLS
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...;

COMMIT;
```

### Migración 002: Analytics Views

```sql
-- 002_create_analytics_views.sql
BEGIN;

CREATE MATERIALIZED VIEW admin_dashboard_stats AS ...;
CREATE VIEW user_activity_summary AS ...;

COMMIT;
```

### Migración 003: Seed Data

```sql
-- 003_seed_initial_data.sql
BEGIN;

-- Asignar rol admin al primer usuario (reemplazar con email real)
INSERT INTO user_roles (user_id, role, assigned_at)
SELECT id, 'admin', NOW()
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;

-- Settings iniciales
INSERT INTO system_settings (key, value, value_type, description, is_public) VALUES
  ('app.name', 'Admin Panel', 'string', 'Application name', TRUE),
  ('app.maintenance_mode', 'false', 'boolean', 'Maintenance mode', FALSE),
  ('auth.max_login_attempts', '5', 'number', 'Max login attempts', FALSE);

COMMIT;
```

---

## Métricas de Performance

### Queries Esperados y Optimizaciones

| Query | Frecuencia | Target Latency | Optimización |
|-------|------------|----------------|--------------|
| Get user role | Muy alta | < 5ms | Índice en user_roles(user_id) |
| List users (paginated) | Alta | < 50ms | Índice en user_profiles(created_at) |
| Get dashboard stats | Media | < 100ms | Materialized view |
| Search users by name | Media | < 100ms | GIN trigram index |
| Recent audit logs | Alta | < 50ms | Índice compuesto (user_id, created_at) |
| Audit log by resource | Baja | < 200ms | Índice en (resource_type, resource_id) |

### Tamaño Estimado de Tablas

| Tabla | Filas (1 año) | Tamaño Estimado |
|-------|---------------|-----------------|
| user_roles | 10,000 | < 1 MB |
| user_profiles | 10,000 | ~5 MB |
| audit_logs | 1,000,000 | ~500 MB |
| system_settings | 100 | < 1 MB |

**Estrategia de Archivado**: Audit logs > 1 año movidos a tabla de archivo mensualmente

```sql
-- Crear tabla de archivo
CREATE TABLE audit_logs_archive (LIKE audit_logs INCLUDING ALL);

-- Mover logs antiguos (ejecutar mensualmente)
WITH moved AS (
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year'
  RETURNING *
)
INSERT INTO audit_logs_archive SELECT * FROM moved;
```

---

## Consecuencias

### Positivas

1. **Integridad**: Relaciones claras con FK constraints
2. **Seguridad**: RLS en todas las tablas sensibles
3. **Auditable**: Logs inmutables con contexto completo
4. **Performance**: Índices optimizados para queries comunes
5. **Escalable**: Schema modular y extensible
6. **Mantenible**: Triggers automáticos reducen errores

### Negativas

1. **Complejidad**: Más tablas que un schema minimalista
2. **Storage**: Audit logs crecen indefinidamente (mitigado con archivado)
3. **Joins**: Algunas queries requieren múltiples joins

---

## Testing del Schema

```sql
-- Test 1: Verificar que usuarios tienen rol por defecto
SELECT COUNT(*) FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;
-- Esperado: 0

-- Test 2: Verificar RLS (como usuario regular)
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user-uuid-not-admin';
SELECT * FROM user_roles; -- Debe ver solo su propio rol

-- Test 3: Verificar índices existen
SELECT indexname FROM pg_indexes
WHERE tablename IN ('user_roles', 'audit_logs', 'user_profiles', 'system_settings');

-- Test 4: Performance de query común
EXPLAIN ANALYZE
SELECT * FROM user_profiles
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 20;
-- Esperado: Index Scan en idx_user_profiles_status
```

---

## Documentos Relacionados

- [ADR-001: RBAC Implementation](./adr-001-rbac-implementation.md)
- [ADR-004: Security Layers](./adr-004-security-layers.md)
- [Arquitectura del Admin Panel](../architecture/admin-panel-architecture.md)

---

**Estado Final:** ACEPTADO

**Aprobadores:**
- [ ] Database Engineer
- [ ] Security Guardian
- [ ] Backend Architect
