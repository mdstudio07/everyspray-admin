-- ========================================
-- ROLE PERMISSIONS MAPPING AND INITIAL DATA
-- ========================================
-- This migration populates the role_permissions table with the complete
-- permission matrix for the perfume platform RBAC system.

-- =====================================
-- SUPER ADMIN PERMISSIONS (ALL ACCESS)
-- =====================================

-- Super admins have complete access to all platform features
INSERT INTO public.role_permissions (role, permission) VALUES
-- Perfume management (full CRUD + approval)
('super_admin', 'perfumes.create'),
('super_admin', 'perfumes.update'),
('super_admin', 'perfumes.delete'),
('super_admin', 'perfumes.approve'),

-- Brand management (full CRUD + approval)
('super_admin', 'brands.create'),
('super_admin', 'brands.update'),
('super_admin', 'brands.delete'),
('super_admin', 'brands.approve'),

-- Notes management (full CRUD + approval)
('super_admin', 'notes.create'),
('super_admin', 'notes.update'),
('super_admin', 'notes.delete'),
('super_admin', 'notes.approve'),

-- Suggestions management (full access)
('super_admin', 'suggestions.create'),
('super_admin', 'suggestions.review'),
('super_admin', 'suggestions.moderate'),

-- User and system management
('super_admin', 'users.manage'),
('super_admin', 'users.suspend'),
('super_admin', 'analytics.view');

-- =====================================
-- TEAM MEMBER PERMISSIONS (MODERATION LEVEL)
-- =====================================

-- Team members can create content and moderate submissions
INSERT INTO public.role_permissions (role, permission) VALUES
-- Content creation (no deletion or approval)
('team_member', 'perfumes.create'),
('team_member', 'perfumes.update'),
('team_member', 'brands.create'),
('team_member', 'brands.update'),
('team_member', 'notes.create'),
('team_member', 'notes.update'),

-- Suggestion management (review but not moderate)
('team_member', 'suggestions.create'),
('team_member', 'suggestions.review');

-- =====================================
-- CONTRIBUTOR PERMISSIONS (LIMITED)
-- =====================================

-- Contributors can only submit suggestions for review
INSERT INTO public.role_permissions (role, permission) VALUES
('contributor', 'suggestions.create');

-- =====================================
-- VALIDATION AND VERIFICATION
-- =====================================

-- Verify all roles have at least one permission
DO $validation$
DECLARE
  role_count INTEGER;
  permission_count INTEGER;
BEGIN
  -- Check that all roles have permissions assigned
  SELECT COUNT(DISTINCT role) INTO role_count FROM public.role_permissions;

  IF role_count != 3 THEN
    RAISE EXCEPTION 'Expected 3 roles with permissions, found %', role_count;
  END IF;

  -- Check total permission count for sanity
  SELECT COUNT(*) INTO permission_count FROM public.role_permissions;

  IF permission_count < 15 THEN
    RAISE EXCEPTION 'Expected at least 15 permission assignments, found %', permission_count;
  END IF;

  RAISE NOTICE 'Role permissions validation passed: % roles, % total permissions', role_count, permission_count;
END
$validation$;

-- =====================================
-- PERMISSION SUMMARY QUERY
-- =====================================

-- Create a view to easily see the permission matrix
CREATE VIEW public.role_permissions_summary AS
SELECT
  r.role,
  array_agg(r.permission ORDER BY r.permission) as permissions,
  count(r.permission) as permission_count
FROM public.role_permissions r
GROUP BY r.role
ORDER BY
  CASE r.role
    WHEN 'super_admin' THEN 1
    WHEN 'team_member' THEN 2
    WHEN 'contributor' THEN 3
  END;

COMMENT ON VIEW public.role_permissions_summary IS 'Summary view showing all permissions by role for easy reference';

-- =====================================
-- HELPER FUNCTION FOR PERMISSION CHECKS
-- =====================================

-- Function to check if a role has a specific permission (for testing)
CREATE OR REPLACE FUNCTION public.role_has_permission(
  check_role public.app_role,
  check_permission public.app_permission
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.role_permissions
    WHERE role = check_role AND permission = check_permission
  );
$function$;

COMMENT ON FUNCTION public.role_has_permission IS 'Helper function to check if a role has a specific permission';

-- =====================================
-- PERMISSION INHERITANCE RULES
-- =====================================

-- Document the permission inheritance hierarchy
-- contributor < team_member < super_admin
--
-- Permission flow:
-- - Contributors: Can only create suggestions
-- - Team Members: Can create/update content + review suggestions
-- - Super Admins: Full access including delete/approve + user management
--
-- This hierarchy ensures proper escalation of privileges while
-- maintaining security boundaries between role levels.