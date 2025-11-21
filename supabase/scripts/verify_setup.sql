-- ============================================================================
-- Script: Verificacion Completa del Setup
-- Descripcion: Verifica que todas las migraciones se aplicaron correctamente
-- Uso: Ejecutar despues de las migraciones para validar el setup
-- ============================================================================

-- ============================================================================
-- 1. VERIFICAR ENUMS
-- ============================================================================

SELECT 'Verificando ENUMs...' as step;
SELECT
  typname as enum_name,
  string_agg(enumlabel, ', ' ORDER BY enumsortorder) as valores
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('user_role', 'user_status', 'audit_action_category', 'setting_type')
GROUP BY typname
ORDER BY typname;

-- ============================================================================
-- 2. VERIFICAR TABLAS
-- ============================================================================

SELECT 'Verificando Tablas...' as step;
SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN 'RLS Enabled'
    ELSE 'RLS DISABLED'
  END as seguridad
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings')
ORDER BY tablename;

-- ============================================================================
-- 3. VERIFICAR INDICES
-- ============================================================================

SELECT 'Verificando Indices...' as step;
SELECT
  tablename,
  COUNT(*) as total_indices
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 4. VERIFICAR POLITICAS RLS
-- ============================================================================

SELECT 'Verificando Politicas RLS...' as step;
SELECT
  tablename,
  COUNT(*) as total_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 5. VERIFICAR FUNCIONES
-- ============================================================================

SELECT 'Verificando Funciones Helper...' as step;
SELECT
  routine_name as funcion,
  routine_type as tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_role',
    'has_permission',
    'insert_audit_log',
    'refresh_dashboard_stats',
    'update_updated_at_column',
    'create_user_profile_and_role'
  )
ORDER BY routine_name;

-- ============================================================================
-- 6. VERIFICAR TRIGGERS
-- ============================================================================

SELECT 'Verificando Triggers...' as step;
SELECT
  event_object_table as tabla,
  trigger_name as trigger,
  event_manipulation as evento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================================================
-- 7. VERIFICAR VISTAS
-- ============================================================================

SELECT 'Verificando Vistas...' as step;
SELECT
  table_name as vista,
  CASE table_type
    WHEN 'VIEW' THEN 'Regular View'
    WHEN 'MATERIALIZED VIEW' THEN 'Materialized View'
  END as tipo
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_activity_summary', 'recent_activity')
ORDER BY tipo, vista;

SELECT 'Verificando Vista Materializada...' as step;
SELECT
  matviewname as vista,
  'Materialized View' as tipo
FROM pg_matviews
WHERE schemaname = 'public'
  AND matviewname = 'admin_dashboard_stats';

-- ============================================================================
-- 8. VERIFICAR EXTENSIONES
-- ============================================================================

SELECT 'Verificando Extensiones PostgreSQL...' as step;
SELECT
  extname as extension,
  extversion as version
FROM pg_extension
WHERE extname IN ('pg_trgm', 'pgcrypto')
ORDER BY extname;

-- ============================================================================
-- 9. VERIFICAR SYSTEM SETTINGS
-- ============================================================================

SELECT 'Verificando System Settings...' as step;
SELECT
  COUNT(*) as total_settings,
  SUM(CASE WHEN is_public THEN 1 ELSE 0 END) as publicos,
  SUM(CASE WHEN NOT is_public THEN 1 ELSE 0 END) as privados
FROM public.system_settings;

-- ============================================================================
-- 10. VERIFICAR INTEGRIDAD REFERENCIAL
-- ============================================================================

SELECT 'Verificando Integridad Referencial - Usuarios sin perfil...' as step;
SELECT COUNT(*) as usuarios_sin_perfil
FROM auth.users u
LEFT JOIN public.user_profiles up ON up.user_id = u.id
WHERE up.user_id IS NULL;

SELECT 'Verificando Integridad Referencial - Usuarios sin rol...' as step;
SELECT COUNT(*) as usuarios_sin_rol
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL;

-- ============================================================================
-- 11. VERIFICAR USUARIO ADMIN
-- ============================================================================

SELECT 'Verificando Usuario Admin...' as step;
SELECT
  COUNT(*) as total_admins,
  COUNT(CASE WHEN up.status = 'active' THEN 1 END) as admins_activos
FROM public.user_roles ur
JOIN public.user_profiles up ON up.user_id = ur.user_id
WHERE ur.role = 'admin';

-- ============================================================================
-- 12. ESTADISTICAS GENERALES
-- ============================================================================

SELECT 'Estadisticas Generales...' as step;
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_usuarios,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as admins,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'moderator') as moderators,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'user') as users,
  (SELECT COUNT(*) FROM public.audit_logs) as audit_logs,
  (SELECT COUNT(*) FROM public.system_settings) as settings;

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================

SELECT 'VERIFICACION COMPLETADA' as resultado;
