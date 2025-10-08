-- ========================================
-- PRODUCTION-SECURE CUSTOM ACCESS TOKEN HOOK
-- ========================================
-- This migration creates a secure JWT token hook that adds role claims
-- while following production security best practices.

-- =====================================
-- CUSTOM ACCESS TOKEN HOOK FUNCTION
-- =====================================

-- Production-ready auth hook with proper security and error handling
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  claims jsonb;
  user_role public.app_role;
  user_id_param uuid;
BEGIN
  -- Validate input event structure
  IF event IS NULL OR event->>'user_id' IS NULL THEN
    RAISE EXCEPTION 'Invalid event structure: missing user_id';
  END IF;

  -- Extract and validate user_id
  BEGIN
    user_id_param := (event->>'user_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid user_id format: %', event->>'user_id';
  END;

  -- Extract existing claims
  claims := COALESCE(event->'claims', '{}'::jsonb);

  -- Fetch the user role from user_roles table with error handling
  BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = user_id_param;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but continue with default role
    RAISE WARNING 'Error fetching user role for %: %', user_id_param, SQLERRM;
    user_role := NULL;
  END;

  -- Set role claim (default to contributor if no role found)
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
  ELSE
    -- Default role for users without explicit role assignment
    claims := jsonb_set(claims, '{user_role}', '"contributor"');

    -- Log this occurrence for monitoring
    RAISE NOTICE 'User % has no role assigned, defaulting to contributor', user_id_param;
  END IF;

  -- Add additional security claims
  claims := jsonb_set(claims, '{aal}', '"aal1"'); -- Authentication Assurance Level
  claims := jsonb_set(claims, '{amr}', '["password"]'); -- Authentication Methods References

  -- Update the event with new claims
  event := jsonb_set(event, '{claims}', claims);

  RETURN event;

EXCEPTION WHEN OTHERS THEN
  -- Critical error handling - log and return original event
  RAISE WARNING 'Critical error in custom_access_token_hook: %', SQLERRM;

  -- Return original event to prevent auth failure
  RETURN event;
END;
$function$;

-- =====================================
-- SECURITY PERMISSIONS FOR AUTH HOOK
-- =====================================

-- Grant specific permissions needed for the auth hook
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Grant read access to user_roles table for auth hook
GRANT SELECT ON TABLE public.user_roles TO supabase_auth_admin;
GRANT SELECT ON TABLE public.role_permissions TO supabase_auth_admin;

-- Explicitly revoke from all other roles for security
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
REVOKE ALL ON TABLE public.user_roles FROM authenticated, anon, public;
REVOKE ALL ON TABLE public.role_permissions FROM authenticated, anon, public;
REVOKE ALL ON TABLE public.role_audit_log FROM authenticated, anon, public;

-- =====================================
-- HELPER FUNCTION FOR JWT VALIDATION
-- =====================================

-- Function to validate JWT structure (for testing)
CREATE OR REPLACE FUNCTION public.validate_jwt_claims(test_claims jsonb)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_role_claim text;
  is_valid boolean := true;
BEGIN
  -- Check if user_role claim exists and is valid
  user_role_claim := test_claims->>'user_role';

  IF user_role_claim IS NULL THEN
    RAISE NOTICE 'Missing user_role claim';
    is_valid := false;
  ELSIF user_role_claim NOT IN ('super_admin', 'team_member', 'contributor') THEN
    RAISE NOTICE 'Invalid user_role claim: %', user_role_claim;
    is_valid := false;
  END IF;

  -- Check for required security claims
  IF test_claims->>'aal' IS NULL THEN
    RAISE NOTICE 'Missing aal claim';
    is_valid := false;
  END IF;

  IF test_claims->'amr' IS NULL THEN
    RAISE NOTICE 'Missing amr claim';
    is_valid := false;
  END IF;

  RETURN is_valid;
END;
$function$;

-- =====================================
-- TESTING FUNCTIONS
-- =====================================

-- Function to simulate the auth hook (for testing)
CREATE OR REPLACE FUNCTION public.test_auth_hook(test_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  mock_event jsonb;
  result jsonb;
BEGIN
  -- Create mock event structure
  mock_event := jsonb_build_object(
    'user_id', test_user_id,
    'claims', jsonb_build_object(
      'sub', test_user_id,
      'email', 'test@example.com'
    )
  );

  -- Call the auth hook
  result := public.custom_access_token_hook(mock_event);

  RETURN result->'claims';
END;
$function$;

-- Function to test hook with various scenarios
CREATE OR REPLACE FUNCTION public.test_auth_hook_scenarios()
RETURNS table(scenario text, result jsonb, is_valid boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  test_user_id uuid;
  test_claims jsonb;
BEGIN
  -- Test 1: User with no role (should default to contributor)
  test_user_id := gen_random_uuid();
  test_claims := public.test_auth_hook(test_user_id);

  scenario := 'User with no role';
  result := test_claims;
  is_valid := public.validate_jwt_claims(test_claims);
  RETURN NEXT;

  -- Test 2: Invalid user_id format
  BEGIN
    SELECT public.custom_access_token_hook('{"user_id": "invalid", "claims": {}}') INTO test_claims;
    scenario := 'Invalid user_id';
    result := test_claims;
    is_valid := false;
  EXCEPTION WHEN OTHERS THEN
    scenario := 'Invalid user_id (expected error)';
    result := jsonb_build_object('error', SQLERRM);
    is_valid := true; -- Expected to fail
  END;
  RETURN NEXT;

  -- Test 3: NULL event
  BEGIN
    SELECT public.custom_access_token_hook(NULL) INTO test_claims;
    scenario := 'NULL event';
    result := test_claims;
    is_valid := false;
  EXCEPTION WHEN OTHERS THEN
    scenario := 'NULL event (expected error)';
    result := jsonb_build_object('error', SQLERRM);
    is_valid := true; -- Expected to fail
  END;
  RETURN NEXT;
END;
$function$;

-- =====================================
-- DOCUMENTATION AND COMMENTS
-- =====================================

COMMENT ON FUNCTION public.custom_access_token_hook IS 'Production-secure JWT token hook that adds role claims with comprehensive error handling';
COMMENT ON FUNCTION public.validate_jwt_claims IS 'Validates JWT claims structure for testing purposes';
COMMENT ON FUNCTION public.test_auth_hook IS 'Simulates the auth hook for testing role assignment';
COMMENT ON FUNCTION public.test_auth_hook_scenarios IS 'Comprehensive testing function for various auth hook scenarios';

-- =====================================
-- HOOK CONFIGURATION INSTRUCTIONS
-- =====================================

-- To enable this hook in Supabase:
-- 1. Go to Authentication > Hooks in your Supabase dashboard
-- 2. Create a new hook with type "Custom Access Token"
-- 3. Set the URL to: https://your-project.supabase.co/rest/v1/rpc/custom_access_token_hook
-- 4. Set HTTP method to POST
-- 5. Add these headers:
--    - Content-Type: application/json
--    - Authorization: Bearer YOUR_SERVICE_ROLE_KEY
--    - apikey: YOUR_SERVICE_ROLE_KEY
-- 6. Enable the hook

-- The hook will automatically add user_role claims to JWT tokens
-- based on the user_roles table data.