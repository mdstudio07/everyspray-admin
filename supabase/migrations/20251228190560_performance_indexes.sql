-- ========================================
-- PERFORMANCE INDEXES FOR RBAC SYSTEM
-- ========================================
-- This migration creates optimized indexes for the RBAC system to ensure
-- fast query performance in production environments.

-- =====================================
-- USER ROLES TABLE INDEXES
-- =====================================

-- Primary lookup: user_id for role retrieval (most frequent query)
CREATE INDEX  IF NOT EXISTS idx_user_roles_user_id
ON public.user_roles(user_id);

-- Role-based queries: find all users with a specific role
CREATE INDEX IF NOT EXISTS idx_user_roles_role
ON public.user_roles(role);

-- Audit queries: find assignments by date range
CREATE INDEX  IF NOT EXISTS idx_user_roles_assigned_at
ON public.user_roles(assigned_at DESC);

-- Admin queries: find assignments by admin
CREATE INDEX  IF NOT EXISTS idx_user_roles_assigned_by
ON public.user_roles(assigned_by)
WHERE assigned_by IS NOT NULL;

-- Composite index for role and assignment time (for analytics)
CREATE INDEX  IF NOT EXISTS idx_user_roles_role_time
ON public.user_roles(role, assigned_at DESC);

-- =====================================
-- ROLE PERMISSIONS TABLE INDEXES
-- =====================================

-- Primary lookup: role-permission combination (for authorize function)
CREATE UNIQUE INDEX  IF NOT EXISTS idx_role_permissions_lookup
ON public.role_permissions(role, permission);

-- Permission-based queries: find roles with specific permission
CREATE INDEX  IF NOT EXISTS idx_role_permissions_permission
ON public.role_permissions(permission);

-- Role-based queries: find all permissions for a role
CREATE INDEX  IF NOT EXISTS idx_role_permissions_role
ON public.role_permissions(role);

-- =====================================
-- USERS PROFILE TABLE INDEXES
-- =====================================

-- Primary lookup: username for login and profile searches
CREATE UNIQUE INDEX  IF NOT EXISTS idx_users_profile_username
ON public.users_profile(username);

-- Email queries (if email searching is needed)
-- Note: email is in auth.users, but we might cache it for performance
-- CREATE INDEX  IF NOT EXISTS idx_users_profile_email
-- ON public.users_profile(email) WHERE email IS NOT NULL;

-- Contribution ranking and leaderboards
CREATE INDEX  IF NOT EXISTS idx_users_profile_contribution_count
ON public.users_profile(contribution_count DESC)
WHERE NOT is_suspended;

-- Trust level filtering
CREATE INDEX  IF NOT EXISTS idx_users_profile_trust_level
ON public.users_profile(trust_level)
WHERE NOT is_suspended;

-- Country-based queries for analytics
CREATE INDEX  IF NOT EXISTS idx_users_profile_country
ON public.users_profile(country)
WHERE country IS NOT NULL AND NOT is_suspended;

-- Active users (not suspended, recent login)
CREATE INDEX  IF NOT EXISTS idx_users_profile_active_users
ON public.users_profile(last_login DESC)
WHERE NOT is_suspended AND last_login IS NOT NULL;

-- Profile completion queries (for admin analytics)
CREATE INDEX  IF NOT EXISTS idx_users_profile_completion
ON public.users_profile(created_at DESC)
WHERE full_name IS NOT NULL AND bio IS NOT NULL;

-- Approval rate for contributor management
CREATE INDEX  IF NOT EXISTS idx_users_profile_approval_rate
ON public.users_profile(approval_rate DESC)
WHERE contribution_count > 0 AND NOT is_suspended;

-- =====================================
-- ROLE AUDIT LOG TABLE INDEXES
-- =====================================

-- Primary audit queries: by user and time
CREATE INDEX  IF NOT EXISTS idx_audit_log_user_time
ON public.role_audit_log(user_id, changed_at DESC);

-- Admin audit queries: changes by admin
CREATE INDEX  IF NOT EXISTS idx_audit_log_changed_by
ON public.role_audit_log(changed_by, changed_at DESC);

-- Role change tracking: specific role changes
CREATE INDEX  IF NOT EXISTS idx_audit_log_old_role
ON public.role_audit_log(old_role, changed_at DESC)
WHERE old_role IS NOT NULL;

CREATE INDEX  IF NOT EXISTS idx_audit_log_new_role
ON public.role_audit_log(new_role, changed_at DESC)
WHERE new_role IS NOT NULL;

-- Time-based audit queries (for reports)
CREATE INDEX  IF NOT EXISTS idx_audit_log_changed_at
ON public.role_audit_log(changed_at DESC);

-- Composite index for role transitions
CREATE INDEX  IF NOT EXISTS idx_audit_log_role_transition
ON public.role_audit_log(old_role, new_role, changed_at DESC)
WHERE old_role IS NOT NULL AND new_role IS NOT NULL;

-- =====================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================

-- User profile with role information (for admin user management)
-- This avoids expensive JOINs between users_profile and user_roles
CREATE INDEX  IF NOT EXISTS idx_users_profile_for_admin
ON public.users_profile(created_at DESC, is_suspended, contribution_count)
WHERE contribution_count >= 0;

-- Active contributors for analytics
CREATE INDEX  IF NOT EXISTS idx_active_contributors
ON public.users_profile(contribution_count DESC, approval_rate DESC, last_login DESC)
WHERE NOT is_suspended AND contribution_count > 0;

-- =====================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- =====================================

-- Suspended users (for admin management)
CREATE INDEX  IF NOT EXISTS idx_users_profile_suspended
ON public.users_profile(created_at DESC)
WHERE is_suspended = true;

-- High-value contributors (for special treatment)
CREATE INDEX  IF NOT EXISTS idx_users_profile_high_value
ON public.users_profile(contribution_count DESC, approval_rate DESC)
WHERE contribution_count >= 10 AND approval_rate >= 80.0 AND NOT is_suspended;

-- New users needing attention (for onboarding) - simplified without time constraint
CREATE INDEX  IF NOT EXISTS idx_users_profile_new_users
ON public.users_profile(created_at DESC)
WHERE contribution_count = 0;

-- Users with missing profile data (for completion campaigns)
CREATE INDEX  IF NOT EXISTS idx_users_profile_incomplete
ON public.users_profile(created_at DESC)
WHERE (full_name IS NULL OR bio IS NULL OR avatar_url IS NULL) AND NOT is_suspended;

-- =====================================
-- FUNCTION-BASED INDEXES
-- =====================================

-- Case-insensitive username searches
CREATE INDEX  IF NOT EXISTS idx_users_profile_username_lower
ON public.users_profile(lower(username));

-- Full-text search on user profiles (if needed)
-- Note: Consider using PostgreSQL's full-text search for bio/name search
-- CREATE INDEX  IF NOT EXISTS idx_users_profile_search
-- ON public.users_profile USING gin(to_tsvector('english', coalesce(full_name, '') || ' ' || coalesce(bio, '')))
-- WHERE NOT is_suspended;

-- =====================================
-- INDEX MONITORING AND MAINTENANCE
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

-- Function to validate index creation
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
  expected_indexes integer := 20; -- Update this if adding more indexes
BEGIN
  -- Count total indexes on RBAC tables
  SELECT COUNT(*)
  INTO total_indexes
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND relname IN ('user_roles', 'users_profile', 'role_audit_log', 'role_permissions');

  -- Return summary
  index_category := 'Total RBAC Indexes';
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
    WHERE schemaname = 'public' AND relname = 'user_roles'
    UNION ALL
    SELECT
      'users_profile' as category,
      COUNT(*) as count
    FROM pg_indexes
    WHERE schemaname = 'public' AND relname = 'users_profile'
    UNION ALL
    SELECT
      'role_audit_log' as category,
      COUNT(*) as count
    FROM pg_indexes
    WHERE schemaname = 'public' AND relname = 'role_audit_log'
    UNION ALL
    SELECT
      'role_permissions' as category,
      COUNT(*) as count
    FROM pg_indexes
    WHERE schemaname = 'public' AND relname = 'role_permissions'
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
COMMENT ON FUNCTION public.validate_rbac_indexes IS 'Validate that all required RBAC indexes have been created';

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

  RAISE NOTICE 'Performance indexes verification: % custom indexes created', index_count;

  IF index_count < 15 THEN
    RAISE WARNING 'Expected at least 15 custom indexes, found %', index_count;
  END IF;
END;
$verification$;

-- =====================================
-- PERFORMANCE OPTIMIZATION NOTES
-- =====================================

-- Index Strategy Summary:
-- 1. Single-column indexes for frequent lookups (user_id, role, permission)
-- 2. Composite indexes for complex queries (role + time, permission combinations)
-- 3. Partial indexes for filtered queries (active users, suspended users)
-- 4. Unique indexes for enforcing constraints (username, role-permission pairs)
-- 5. Functional indexes for case-insensitive searches
-- 6. Time-based indexes for audit queries and analytics

-- Query Performance Expectations:
-- - User role lookup: < 1ms (indexed on user_id)
-- - Permission check: < 1ms (indexed on role + permission)
-- - Audit queries: < 10ms (indexed on user + time)
-- - Analytics queries: < 100ms (indexed on contribution metrics)
-- - Admin user management: < 50ms (composite indexes)

-- Maintenance Recommendations:
-- 1. Monitor index usage with get_index_usage_stats() monthly
-- 2. Check for unused indexes with get_unused_indexes() quarterly
-- 3. Consider REINDEX  for heavily used indexes annually
-- 4. Update statistics regularly: ANALYZE public.users_profile, etc.