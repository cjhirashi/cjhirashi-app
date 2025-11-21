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
