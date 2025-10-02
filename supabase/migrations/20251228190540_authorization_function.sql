-- ========================================
-- SECURE AUTHORIZATION FUNCTION & UTILITIES
-- ========================================
-- This migration creates the core authorization function and helper utilities
-- for production-ready permission checking with proper security.

-- =====================================
-- CORE AUTHORIZATION FUNCTION
-- =====================================

-- Production-secure authorize function with explicit search_path and error handling
CREATE OR REPLACE FUNCTION public.authorize(
  requested_permission public.app_permission
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  bind_permissions integer;
  user_role public.app_role;
  jwt_claims jsonb;
BEGIN
  -- Use current_setting for JWT access (production-safe)
  BEGIN
    jwt_claims := current_setting('request.jwt.claims', true)::jsonb;

    -- Extract user role from JWT claims
    user_role := (jwt_claims ->> 'user_role')::public.app_role;

  EXCEPTION WHEN OTHERS THEN
    -- If JWT is invalid or missing, deny access
    RETURN false;
  END;

  -- If no role found in JWT, deny access
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Check if role has the requested permission
  SELECT count(*)
  INTO bind_permissions
  FROM public.role_permissions
  WHERE role_permissions.permission = requested_permission
    AND role_permissions.role = user_role;

  RETURN bind_permissions > 0;

EXCEPTION WHEN OTHERS THEN
  -- Log error and deny access on any exception
  RAISE WARNING 'Error in authorize function: %', SQLERRM;
  RETURN false;
END;
$function$;

-- =====================================
-- HELPER AUTHORIZATION FUNCTIONS
-- =====================================

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role text;
BEGIN
  BEGIN
    user_role := current_setting('request.jwt.claims', true)::jsonb ->> 'user_role';
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  RETURN user_role = 'super_admin';
END;
$function$;

-- Check if current user is team member or higher
CREATE OR REPLACE FUNCTION public.is_team_member_or_higher()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role text;
BEGIN
  BEGIN
    user_role := current_setting('request.jwt.claims', true)::jsonb ->> 'user_role';
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  RETURN user_role IN ('super_admin', 'team_member');
END;
$function$;

-- Get current user ID from JWT
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_id uuid;
BEGIN
  BEGIN
    user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  RETURN user_id;
END;
$function$;

-- Get current user role from JWT
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role public.app_role;
BEGIN
  BEGIN
    user_role := (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  RETURN user_role;
END;
$function$;

-- =====================================
-- BATCH PERMISSION CHECKING
-- =====================================

-- Check multiple permissions at once (for efficiency)
CREATE OR REPLACE FUNCTION public.authorize_any(
  requested_permissions public.app_permission[]
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role public.app_role;
  permission_count integer;
BEGIN
  -- Get user role from JWT
  BEGIN
    user_role := (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user has ANY of the requested permissions
  SELECT count(*)
  INTO permission_count
  FROM public.role_permissions
  WHERE role_permissions.permission = ANY(requested_permissions)
    AND role_permissions.role = user_role;

  RETURN permission_count > 0;

EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

-- Check if user has ALL of the requested permissions
CREATE OR REPLACE FUNCTION public.authorize_all(
  requested_permissions public.app_permission[]
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role public.app_role;
  permission_count integer;
  required_count integer;
BEGIN
  -- Get user role from JWT
  BEGIN
    user_role := (current_setting('request.jwt.claims', true)::jsonb ->> 'user_role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  required_count := array_length(requested_permissions, 1);

  -- Check if user has ALL of the requested permissions
  SELECT count(*)
  INTO permission_count
  FROM public.role_permissions
  WHERE role_permissions.permission = ANY(requested_permissions)
    AND role_permissions.role = user_role;

  RETURN permission_count = required_count;

EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

-- =====================================
-- OWNERSHIP CHECKING UTILITIES
-- =====================================

-- Check if current user owns a resource (generic utility)
CREATE OR REPLACE FUNCTION public.is_owner(
  resource_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := public.get_current_user_id();

  RETURN current_user_id IS NOT NULL AND current_user_id = resource_user_id;
END;
$function$;

-- Combined permission or ownership check
CREATE OR REPLACE FUNCTION public.authorize_or_owner(
  requested_permission public.app_permission,
  resource_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- User has permission OR owns the resource
  RETURN public.authorize(requested_permission) OR public.is_owner(resource_user_id);
END;
$function$;

-- =====================================
-- SECURITY PERMISSIONS
-- =====================================

-- Revoke execute permissions from all roles except supabase internal
REVOKE EXECUTE ON FUNCTION public.authorize FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.is_super_admin FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.is_team_member_or_higher FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.get_current_user_id FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.authorize_any FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.authorize_all FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.is_owner FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.authorize_or_owner FROM authenticated, anon, public;

-- Note: These functions are called internally by RLS policies and should not be
-- directly accessible to client applications for security reasons.

-- =====================================
-- TESTING AND VALIDATION FUNCTIONS
-- =====================================

-- Function to test authorization with mock JWT claims
CREATE OR REPLACE FUNCTION public.test_authorization(
  test_role public.app_role,
  test_permission public.app_permission
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result boolean;
BEGIN
  -- This function is for testing purposes only and should be removed in production
  SELECT count(*) > 0
  INTO result
  FROM public.role_permissions
  WHERE role = test_role AND permission = test_permission;

  RETURN result;
END;
$function$;

-- Function to get all permissions for a role (for testing)
CREATE OR REPLACE FUNCTION public.get_role_permissions(
  check_role public.app_role
)
RETURNS public.app_permission[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  permissions public.app_permission[];
BEGIN
  SELECT array_agg(permission ORDER BY permission)
  INTO permissions
  FROM public.role_permissions
  WHERE role = check_role;

  RETURN COALESCE(permissions, '{}');
END;
$function$;

-- =====================================
-- DOCUMENTATION
-- =====================================

COMMENT ON FUNCTION public.authorize IS 'Core authorization function - checks if current user has specific permission based on JWT role claim';
COMMENT ON FUNCTION public.is_super_admin IS 'Returns true if current user is super admin';
COMMENT ON FUNCTION public.is_team_member_or_higher IS 'Returns true if current user is team member or super admin';
COMMENT ON FUNCTION public.get_current_user_id IS 'Extracts current user ID from JWT claims';
COMMENT ON FUNCTION public.get_current_user_role IS 'Extracts current user role from JWT claims';
COMMENT ON FUNCTION public.authorize_any IS 'Returns true if user has ANY of the specified permissions';
COMMENT ON FUNCTION public.authorize_all IS 'Returns true if user has ALL of the specified permissions';
COMMENT ON FUNCTION public.is_owner IS 'Checks if current user owns a specific resource';
COMMENT ON FUNCTION public.authorize_or_owner IS 'Returns true if user has permission OR owns the resource';
COMMENT ON FUNCTION public.test_authorization IS 'Testing function for authorization logic (remove in production)';
COMMENT ON FUNCTION public.get_role_permissions IS 'Returns all permissions for a specific role (testing utility)';

-- =====================================
-- FUNCTION USAGE EXAMPLES
-- =====================================

-- Example usage in RLS policies:
--
-- CREATE POLICY "Users can manage their profiles or admins can manage all"
-- ON public.users_profile FOR ALL
-- USING (public.authorize_or_owner('users.manage', id));
--
-- CREATE POLICY "Only team members can create perfumes"
-- ON public.perfumes FOR INSERT
-- WITH CHECK (public.authorize('perfumes.create'));
--
-- CREATE POLICY "Super admins can delete anything"
-- ON public.perfumes FOR DELETE
-- USING (public.authorize('perfumes.delete'));

-- Example usage in application code:
-- SELECT public.authorize('perfumes.create'); -- Returns true/false
-- SELECT public.get_current_user_role(); -- Returns user's role
-- SELECT public.authorize_any(ARRAY['perfumes.create', 'brands.create']); -- Check multiple permissions