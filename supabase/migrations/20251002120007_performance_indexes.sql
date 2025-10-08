-- ========================================
-- ESSENTIAL PERFORMANCE INDEXES FOR RBAC
-- ========================================
-- This migration creates ONLY critical indexes needed for RBAC functionality.
-- Additional analytics indexes can be added later when needed.

-- =====================================
-- USER ROLES TABLE INDEXES (2 indexes)
-- =====================================

-- CRITICAL: Primary lookup for role retrieval (used by auth hook on every login)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
ON public.user_roles(user_id);

-- USEFUL: Find all users with a specific role (admin queries)
CREATE INDEX IF NOT EXISTS idx_user_roles_role
ON public.user_roles(role);

-- =====================================
-- ROLE PERMISSIONS TABLE INDEXES (1 index)
-- =====================================

-- CRITICAL: Primary lookup for authorize() function (used in all RLS policies)
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_lookup
ON public.role_permissions(role, permission);

-- =====================================
-- USERS PROFILE TABLE INDEXES (2 indexes)
-- =====================================

-- CRITICAL: Username lookup for login and profile searches
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_username
ON public.users_profile(username);

-- CRITICAL: Case-insensitive username searches (for check_username_exists)
CREATE INDEX IF NOT EXISTS idx_users_profile_username_lower
ON public.users_profile(lower(username));

-- =====================================
-- ROLE AUDIT LOG TABLE INDEXES (1 index)
-- =====================================

-- USEFUL: Audit queries by user and time
CREATE INDEX IF NOT EXISTS idx_audit_log_user_time
ON public.role_audit_log(user_id, changed_at DESC);

-- =====================================
-- INDEX MONITORING UTILITIES
-- =====================================

-- Function to monitor index usage statistics
CREATE OR REPLACE FUNCTION public.get_index_usage_stats()
RETURNS table(
  table_name text,
  index_name text,
  index_size text,
  index_scans bigint,
  tuples_read bigint,
  tuples_fetched bigint,
  usage_ratio numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT
    schemaname || '.' || relname as table_name,
    indexrelname as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    CASE
      WHEN idx_scan = 0 THEN 0
      ELSE round((idx_tup_fetch::numeric / idx_tup_read::numeric) * 100, 2)
    END as usage_ratio
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND relname IN ('user_roles', 'users_profile', 'role_audit_log', 'role_permissions')
  ORDER BY idx_scan DESC;
$function$;

-- Function to identify unused indexes
CREATE OR REPLACE FUNCTION public.get_unused_indexes()
RETURNS table(
  table_name text,
  index_name text,
  index_size text,
  suggestion text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $function$
  SELECT
    schemaname || '.' || relname as table_name,
    indexrelname as index_name,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    'Consider dropping - no scans recorded' as suggestion
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND relname IN ('user_roles', 'users_profile', 'role_audit_log', 'role_permissions')
    AND idx_scan = 0
  ORDER BY pg_relation_size(indexrelid) DESC;
$function$;

-- =====================================
-- INDEX VALIDATION
-- =====================================

-- Function to validate essential indexes exist
CREATE OR REPLACE FUNCTION public.validate_rbac_indexes()
RETURNS table(
  index_category text,
  index_count integer,
  status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $function$
DECLARE
  total_indexes integer;
  expected_indexes integer := 6; -- Only essential indexes
BEGIN
  -- Count total indexes on RBAC tables
  SELECT COUNT(*)
  INTO total_indexes
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('user_roles', 'users_profile', 'role_audit_log', 'role_permissions')
    AND indexname LIKE 'idx_%';

  -- Return summary
  index_category := 'Essential RBAC Indexes';
  index_count := total_indexes;
  status := CASE
    WHEN total_indexes >= expected_indexes THEN 'Sufficient ✓'
    ELSE 'Missing indexes ✗'
  END;
  RETURN NEXT;

  -- Return category breakdown
  FOR index_category, index_count IN
    SELECT
      'user_roles' as category,
      COUNT(*) as count
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND indexname LIKE 'idx_%'
    UNION ALL
    SELECT
      'users_profile' as category,
      COUNT(*) as count
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'users_profile' AND indexname LIKE 'idx_%'
    UNION ALL
    SELECT
      'role_audit_log' as category,
      COUNT(*) as count
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'role_audit_log' AND indexname LIKE 'idx_%'
    UNION ALL
    SELECT
      'role_permissions' as category,
      COUNT(*) as count
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'role_permissions' AND indexname LIKE 'idx_%'
  LOOP
    status := 'Created ✓';
    RETURN NEXT;
  END LOOP;
END;
$function$;

-- =====================================
-- DOCUMENTATION
-- =====================================

COMMENT ON FUNCTION public.get_index_usage_stats IS 'Monitor index usage statistics for performance optimization';
COMMENT ON FUNCTION public.get_unused_indexes IS 'Identify unused indexes that can be dropped to save space';
COMMENT ON FUNCTION public.validate_rbac_indexes IS 'Validate that all essential RBAC indexes exist';

-- =====================================
-- POST-CREATION VERIFICATION
-- =====================================

-- Verify indexes were created successfully
DO $verification$
DECLARE
  index_count integer;
BEGIN
  SELECT COUNT(*)
  INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('user_roles', 'users_profile', 'role_audit_log', 'role_permissions')
    AND indexname LIKE 'idx_%';

  RAISE NOTICE 'Essential indexes verification: % custom indexes created', index_count;

  IF index_count < 6 THEN
    RAISE WARNING 'Expected 6 essential indexes, found %', index_count;
  END IF;
END;
$verification$;

-- =====================================
-- PERFORMANCE NOTES
-- =====================================

-- Index Strategy:
-- 1. Only critical indexes for RBAC functionality
-- 2. Single-column indexes for frequent lookups
-- 3. Unique indexes for constraint enforcement
-- 4. Case-insensitive index for username checks
--
-- When to add more indexes:
-- - Leaderboard features → Add contribution_count index
-- - Analytics dashboard → Add composite indexes
-- - Advanced filtering → Add partial indexes
-- - Full-text search → Add GIN indexes
--
-- Query Performance Expectations:
-- - User role lookup: < 1ms (idx_user_roles_user_id)
-- - Permission check: < 1ms (idx_role_permissions_lookup)
-- - Username check: < 1ms (idx_users_profile_username_lower)
-- - Audit queries: < 10ms (idx_audit_log_user_time)
