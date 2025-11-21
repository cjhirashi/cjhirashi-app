-- ============================================================================
-- SCRIPT DE VERIFICACIÓN - FASE 1
-- Propósito: Verificar que las migraciones se aplicaron correctamente
-- ============================================================================

\echo '==================================================================================='
\echo 'FASE 1: VERIFICACIÓN DE BASE DE DATOS'
\echo '==================================================================================='
\echo ''

-- ============================================================================
-- 1. VERIFICAR EXTENSIONES
-- ============================================================================
\echo '1. Verificando extensiones...'
SELECT
  extname AS "Extension",
  extversion AS "Versión"
FROM pg_extension
WHERE extname IN ('uuid-ossp', 'pg_trgm')
ORDER BY extname;
\echo ''

-- ============================================================================
-- 2. VERIFICAR ENUMS
-- ============================================================================
\echo '2. Verificando ENUMs creados...'
SELECT
  t.typname AS "ENUM",
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS "Valores"
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN ('user_role', 'user_status', 'audit_action_category', 'setting_type')
GROUP BY t.typname
ORDER BY t.typname;
\echo ''

-- ============================================================================
-- 3. VERIFICAR TABLAS
-- ============================================================================
\echo '3. Verificando tablas creadas...'
SELECT
  tablename AS "Tabla",
  CASE WHEN rowsecurity THEN '✓ Habilitado' ELSE '✗ DESHABILITADO' END AS "RLS"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings')
ORDER BY tablename;
\echo ''

-- ============================================================================
-- 4. VERIFICAR ÍNDICES
-- ============================================================================
\echo '4. Verificando índices optimizados...'
SELECT
  schemaname AS "Schema",
  tablename AS "Tabla",
  indexname AS "Índice"
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings')
ORDER BY tablename, indexname;
\echo ''

-- ============================================================================
-- 5. VERIFICAR FUNCIONES
-- ============================================================================
\echo '5. Verificando funciones de ayuda...'
SELECT
  proname AS "Función",
  pg_get_function_arguments(oid) AS "Argumentos"
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'get_user_role',
    'has_permission',
    'insert_audit_log',
    'update_updated_at_column',
    'auto_create_user_profile',
    'auto_assign_user_role'
  )
ORDER BY proname;
\echo ''

-- ============================================================================
-- 6. VERIFICAR RLS POLICIES
-- ============================================================================
\echo '6. Verificando políticas RLS...'
SELECT
  schemaname AS "Schema",
  tablename AS "Tabla",
  policyname AS "Política",
  cmd AS "Comando"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings')
ORDER BY tablename, policyname;
\echo ''

-- ============================================================================
-- 7. VERIFICAR TRIGGERS
-- ============================================================================
\echo '7. Verificando triggers...'
SELECT
  event_object_table AS "Tabla",
  trigger_name AS "Trigger",
  event_manipulation AS "Evento"
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings')
ORDER BY event_object_table, trigger_name;
\echo ''

-- ============================================================================
-- 8. VERIFICAR VISTAS
-- ============================================================================
\echo '8. Verificando vistas de analytics...'
SELECT
  table_name AS "Vista",
  CASE
    WHEN table_type = 'VIEW' THEN 'Vista Regular'
    ELSE 'Vista Materializada'
  END AS "Tipo"
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('admin_dashboard_stats', 'user_activity_summary', 'recent_activity')
ORDER BY table_name;
\echo ''

-- ============================================================================
-- 9. VERIFICAR DATOS INICIALES
-- ============================================================================
\echo '9. Verificando datos iniciales (system_settings)...'
SELECT
  key AS "Configuración",
  value_type AS "Tipo",
  is_public AS "Público"
FROM system_settings
ORDER BY key;
\echo ''

-- ============================================================================
-- 10. VERIFICAR USUARIOS ADMIN
-- ============================================================================
\echo '10. Verificando usuarios admin...'
SELECT
  u.email AS "Email",
  ur.role AS "Rol",
  up.status AS "Estado",
  ur.assigned_at AS "Fecha Asignación"
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE ur.role = 'admin'
ORDER BY ur.assigned_at DESC;
\echo ''

-- ============================================================================
-- 11. CONTAR REGISTROS EN TABLAS
-- ============================================================================
\echo '11. Conteo de registros en tablas principales...'
SELECT
  'user_roles' AS tabla,
  COUNT(*) AS registros
FROM user_roles
UNION ALL
SELECT
  'user_profiles' AS tabla,
  COUNT(*) AS registros
FROM user_profiles
UNION ALL
SELECT
  'audit_logs' AS tabla,
  COUNT(*) AS registros
FROM audit_logs
UNION ALL
SELECT
  'system_settings' AS tabla,
  COUNT(*) AS registros
FROM system_settings
ORDER BY tabla;
\echo ''

-- ============================================================================
-- 12. PROBAR FUNCIONES
-- ============================================================================
\echo '12. Probando funciones de autorización...'
\echo 'Nota: Si no hay usuarios, estas funciones retornarán NULL o user'
\echo ''

-- Nota: Estas queries solo funcionarán si hay un usuario autenticado
-- En un entorno de prueba, simplemente verificamos que las funciones existen

-- ============================================================================
-- 13. VERIFICAR FOREIGN KEYS
-- ============================================================================
\echo '13. Verificando foreign keys (integridad referencial)...'
SELECT
  tc.table_name AS "Tabla",
  kcu.column_name AS "Columna",
  ccu.table_name AS "Tabla Referenciada",
  ccu.column_name AS "Columna Referenciada"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings')
ORDER BY tc.table_name, kcu.column_name;
\echo ''

-- ============================================================================
-- RESUMEN FINAL
-- ============================================================================
\echo '==================================================================================='
\echo 'RESUMEN DE VERIFICACIÓN'
\echo '==================================================================================='
\echo ''

DO $$
DECLARE
  tabla_count INTEGER;
  index_count INTEGER;
  policy_count INTEGER;
  function_count INTEGER;
  view_count INTEGER;
  setting_count INTEGER;
BEGIN
  -- Contar elementos críticos
  SELECT COUNT(*) INTO tabla_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings');

  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings');

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('user_roles', 'user_profiles', 'audit_logs', 'system_settings');

  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE pronamespace = 'public'::regnamespace
    AND proname IN (
      'get_user_role',
      'has_permission',
      'insert_audit_log',
      'update_updated_at_column',
      'auto_create_user_profile',
      'auto_assign_user_role'
    );

  SELECT COUNT(*) INTO view_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('admin_dashboard_stats', 'user_activity_summary', 'recent_activity');

  SELECT COUNT(*) INTO setting_count
  FROM system_settings;

  -- Mostrar resumen
  RAISE NOTICE 'Tablas creadas: % de 4', tabla_count;
  RAISE NOTICE 'Índices creados: %', index_count;
  RAISE NOTICE 'Políticas RLS: %', policy_count;
  RAISE NOTICE 'Funciones helper: % de 6', function_count;
  RAISE NOTICE 'Vistas de analytics: % de 3', view_count;
  RAISE NOTICE 'Settings iniciales: % de 8', setting_count;
  RAISE NOTICE '';

  IF tabla_count = 4 AND function_count = 6 AND view_count = 3 AND setting_count = 8 THEN
    RAISE NOTICE '✓ FASE 1 COMPLETADA EXITOSAMENTE';
  ELSE
    RAISE WARNING '✗ ALGUNAS VERIFICACIONES FALLARON - Revisar logs arriba';
  END IF;
END $$;

\echo ''
\echo '==================================================================================='
\echo 'FIN DE VERIFICACIÓN'
\echo '==================================================================================='
