-- ============================================================================
-- Script: Asignar Rol de Admin a Usuario
-- Descripción: Asigna el rol de administrador y activa un usuario existente
-- Uso: Modificar el email antes de ejecutar
-- ============================================================================

-- INSTRUCCIONES:
-- 1. Reemplaza 'tu-email@example.com' con el email del usuario real
-- 2. Ejecuta este script en Supabase SQL Editor o con psql
-- 3. Verifica el resultado con la query de verificación al final

DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'tu-email@example.com'; -- CAMBIAR ESTE EMAIL
BEGIN
  -- Buscar el usuario por email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;

  -- Verificar si se encontró el usuario
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', admin_email;
  END IF;

  -- Asignar rol de admin
  UPDATE public.user_roles
  SET 
    role = 'admin',
    updated_at = NOW()
  WHERE user_id = admin_user_id;

  -- Activar cuenta
  UPDATE public.user_profiles
  SET 
    status = 'active',
    updated_at = NOW()
  WHERE user_id = admin_user_id;

  -- Registrar en audit log
  PERFORM insert_audit_log(
    p_user_id := admin_user_id,
    p_action := 'role.update',
    p_action_category := 'role',
    p_resource_type := 'user_role',
    p_resource_id := admin_user_id::TEXT,
    p_changes := jsonb_build_object(
      'before', jsonb_build_object('role', 'user'),
      'after', jsonb_build_object('role', 'admin')
    ),
    p_metadata := jsonb_build_object(
      'reason', 'Initial admin assignment',
      'script', 'assign_admin.sql'
    )
  );

  RAISE NOTICE '✅ Admin role assigned successfully to user: % (ID: %)', admin_email, admin_user_id;
  RAISE NOTICE '✅ User status set to: active';
  RAISE NOTICE '✅ Audit log entry created';
END $$;

-- ============================================================================
-- Query de Verificación
-- ============================================================================

-- Ejecuta esta query para verificar que el cambio se aplicó correctamente
SELECT
  u.id,
  u.email,
  up.full_name,
  ur.role,
  up.status,
  ur.updated_at as role_updated_at
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.user_profiles up ON up.user_id = u.id
WHERE u.email = 'tu-email@example.com'; -- CAMBIAR ESTE EMAIL TAMBIÉN

-- Resultado esperado:
-- role = 'admin'
-- status = 'active'
-- role_updated_at = (timestamp reciente)
