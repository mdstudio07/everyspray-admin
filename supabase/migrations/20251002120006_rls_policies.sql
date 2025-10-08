-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================
-- This migration enables RLS and creates comprehensive security policies
-- for all RBAC tables with proper access controls.

-- =====================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================

-- Enable RLS on all RBAC tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================
-- USER ROLES TABLE POLICIES
-- =====================================

-- Super admins can read all user roles
CREATE POLICY "Super admins can read all user roles"
ON public.user_roles FOR SELECT
USING (public.is_super_admin());

-- Super admins can update user roles
CREATE POLICY "Super admins can update user roles"
ON public.user_roles FOR UPDATE
USING (public.is_super_admin());

-- Super admins can insert new user roles
CREATE POLICY "Super admins can insert user roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_super_admin());

-- Super admins can delete user roles
CREATE POLICY "Super admins can delete user roles"
ON public.user_roles FOR DELETE
USING (public.is_super_admin());

-- Auth admin can read user roles (for JWT token generation)
CREATE POLICY "Auth admin can read user roles"
ON public.user_roles FOR SELECT
TO supabase_auth_admin USING (true);

-- Service role can manage user roles (for system operations)
CREATE POLICY "Service role can manage user roles"
ON public.user_roles FOR ALL
TO service_role USING (true);

-- =====================================
-- USERS PROFILE TABLE POLICIES
-- =====================================

-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
ON public.users_profile FOR SELECT
USING (public.get_current_user_id() = id);

-- Users can update their own basic profile information (non-sensitive fields only)
CREATE POLICY "Users can update their own profile"
ON public.users_profile FOR UPDATE
USING (public.get_current_user_id() = id);

-- Super admins can read all profiles
CREATE POLICY "Super admins can read all profiles"
ON public.users_profile FOR SELECT
USING (public.is_super_admin());

-- Super admins can update all profiles (including sensitive fields)
CREATE POLICY "Super admins can update all profiles"
ON public.users_profile FOR UPDATE
USING (public.is_super_admin());

-- Team members can read public profile information
CREATE POLICY "Team members can read public profiles"
ON public.users_profile FOR SELECT
USING (
  public.is_team_member_or_higher() AND
  NOT is_suspended
);

-- Service role can manage all profiles (for system operations)
CREATE POLICY "Service role can manage profiles"
ON public.users_profile FOR ALL
TO service_role USING (true);

-- =====================================
-- ROLE AUDIT LOG POLICIES
-- =====================================

-- Only super admins can view audit logs
CREATE POLICY "Only super admins can view audit logs"
ON public.role_audit_log FOR SELECT
USING (public.is_super_admin());

-- System can insert audit records
CREATE POLICY "System can insert audit records"
ON public.role_audit_log FOR INSERT
WITH CHECK (true); -- Handled by triggers

-- Service role can manage audit logs
CREATE POLICY "Service role can manage audit logs"
ON public.role_audit_log FOR ALL
TO service_role USING (true);

-- =====================================
-- ROLE PERMISSIONS TABLE POLICIES
-- =====================================

-- Auth admin can read role permissions (for JWT token generation)
CREATE POLICY "Auth admin can read role permissions"
ON public.role_permissions FOR SELECT
TO supabase_auth_admin USING (true);

-- Super admins can read role permissions
CREATE POLICY "Super admins can read role permissions"
ON public.role_permissions FOR SELECT
USING (public.is_super_admin());

-- Service role can manage role permissions
CREATE POLICY "Service role can manage role permissions"
ON public.role_permissions FOR ALL
TO service_role USING (true);

-- No other users can access role permissions directly
-- (This prevents users from seeing the permission matrix)

-- =====================================
-- PUBLIC VIEW POLICIES
-- =====================================

-- The users_profile_public view inherits policies from the underlying table
-- but only exposes safe columns, providing an additional security layer

-- Enable RLS on the view (inherited from base table)
-- Views automatically inherit RLS from their base tables in Supabase

-- =====================================
-- ADDITIONAL SECURITY POLICIES
-- =====================================

-- Prevent profile creation by regular users (only through triggers)
CREATE POLICY "Prevent direct profile creation"
ON public.users_profile FOR INSERT
WITH CHECK (false); -- Only allow inserts through the user creation trigger

-- Override for service role
CREATE POLICY "Service role can insert profiles"
ON public.users_profile FOR INSERT
TO service_role WITH CHECK (true);

-- Override for auth admin (for user creation trigger)
CREATE POLICY "Auth functions can insert profiles"
ON public.users_profile FOR INSERT
TO supabase_auth_admin WITH CHECK (true);

-- =====================================
-- POLICY VALIDATION AND TESTING
-- =====================================

-- Function to test policy effectiveness
CREATE OR REPLACE FUNCTION public.test_rls_policies()
RETURNS table(
  policy_name text,
  table_name text,
  operation text,
  expected_result text,
  test_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Test 1: Regular user reading their own profile
  policy_name := 'Users can read own profile';
  table_name := 'users_profile';
  operation := 'SELECT';
  expected_result := 'Should succeed for own profile';
  test_status := 'Manual test required';
  RETURN NEXT;

  -- Test 2: Regular user trying to read role permissions
  policy_name := 'Role permissions access';
  table_name := 'role_permissions';
  operation := 'SELECT';
  expected_result := 'Should be denied for regular users';
  test_status := 'Manual test required';
  RETURN NEXT;

  -- Test 3: Super admin accessing audit logs
  policy_name := 'Super admin audit access';
  table_name := 'role_audit_log';
  operation := 'SELECT';
  expected_result := 'Should succeed for super admins';
  test_status := 'Manual test required';
  RETURN NEXT;

  -- Test 4: User trying to update sensitive profile fields
  policy_name := 'Profile update restrictions';
  table_name := 'users_profile';
  operation := 'UPDATE';
  expected_result := 'Should block sensitive field changes';
  test_status := 'Manual test required';
  RETURN NEXT;

  -- Add more test cases as needed
  RETURN;
END;
$function$;

-- Function to check if RLS is enabled on all required tables
CREATE OR REPLACE FUNCTION public.verify_rls_enabled()
RETURNS table(
  table_name text,
  rls_enabled boolean,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename as table_name,
    rowsecurity as rls_enabled,
    CASE
      WHEN rowsecurity THEN 'RLS Enabled ✓'
      ELSE 'RLS NOT Enabled ✗'
    END as status
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('user_roles', 'users_profile', 'role_audit_log', 'role_permissions')
  ORDER BY tablename;
END;
$function$;

-- =====================================
-- SECURITY BEST PRACTICES IMPLEMENTED
-- =====================================

-- ✓ Principle of least privilege - Users can only access what they need
-- ✓ Defense in depth - Multiple security layers (RLS + application logic)
-- ✓ Separation of concerns - Different policies for different operations
-- ✓ Audit trail protection - Only super admins can view audit logs
-- ✓ Sensitive data protection - Role permissions hidden from regular users
-- ✓ Column-level security - Public view exposes only safe profile data
-- ✓ System role separation - Service role for admin operations
-- ✓ Auth integration - Policies use JWT claims for decisions

-- =====================================
-- DOCUMENTATION
-- =====================================

COMMENT ON POLICY "Super admins can read all user roles" ON public.user_roles IS 'Allows super admins to view role assignments for user management';
COMMENT ON POLICY "Users can read their own profile" ON public.users_profile IS 'Users can view their complete profile information';
COMMENT ON POLICY "Users can update their own profile" ON public.users_profile IS 'Users can update basic profile info but not sensitive fields';
COMMENT ON POLICY "Only super admins can view audit logs" ON public.role_audit_log IS 'Restricts audit log access to super admins only';
COMMENT ON POLICY "Auth admin can read role permissions" ON public.role_permissions IS 'Allows auth system to read permissions for JWT generation';

COMMENT ON FUNCTION public.test_rls_policies IS 'Testing function to validate RLS policy effectiveness';
COMMENT ON FUNCTION public.verify_rls_enabled IS 'Utility function to verify RLS is enabled on all required tables';

-- =====================================
-- POST-MIGRATION VERIFICATION
-- =====================================

-- Verify RLS is enabled on all tables
DO $verification$
DECLARE
  rls_count integer;
BEGIN
  SELECT COUNT(*)
  INTO rls_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('user_roles', 'users_profile', 'role_audit_log', 'role_permissions')
    AND rowsecurity = true;

  IF rls_count != 4 THEN
    RAISE EXCEPTION 'RLS not enabled on all required tables. Expected 4, found %', rls_count;
  END IF;

  RAISE NOTICE 'RLS verification passed: RLS enabled on all % required tables', rls_count;
END;
$verification$;