-- ============================================================================
-- MIGRATION 003: Seed Initial Data
-- Description: Seeds initial system settings and assigns first admin
-- Author: Architecture Team
-- Date: 2025-11-11
-- Security: Sets secure defaults for system configuration
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
  WHERE email = 'carlos@cjhirashi.com' -- CAMBIAR ESTE EMAIL
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
