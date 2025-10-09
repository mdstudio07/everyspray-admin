-- ============================================================================
-- Fix Auth Hook: Use pg_catalog.set_config() Instead of SET LOCAL
-- ============================================================================
-- Created: 2025-10-09
-- Purpose: Update custom_access_token_hook to use pg_catalog.set_config()
--          instead of SET LOCAL for better PostgreSQL compatibility
--
-- Why This Fix:
-- - SET LOCAL requires VOLATILE function volatility
-- - pg_catalog.set_config() works with STABLE (safer, more restrictive)
-- - Same behavior: third parameter `true` = local to transaction
-- - Recommended approach for PostgreSQL hooks
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE  -- Safe to use STABLE with pg_catalog.set_config()
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_role text;
  claims jsonb;
BEGIN
  -- ⚡ SECURITY HARDENING: Add statement timeout to prevent login blocking
  -- Using pg_catalog.set_config() instead of SET LOCAL for STABLE function compatibility
  PERFORM pg_catalog.set_config('statement_timeout', '1000ms', true);

  -- Extract user_id from event
  v_user_id := (event->>'user_id')::uuid;

  -- Default claims
  claims := event->'claims';

  -- Fetch user role from user_roles table
  BEGIN
    SELECT role::text INTO v_role
    FROM public.user_roles
    WHERE user_id = v_user_id
    LIMIT 1;

    -- Add role claim to JWT
    IF v_role IS NOT NULL THEN
      claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
    ELSE
      -- Default to contributor if no role found
      claims := jsonb_set(claims, '{user_role}', '"contributor"'::jsonb);
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- On error, default to contributor (never fail auth)
      claims := jsonb_set(claims, '{user_role}', '"contributor"'::jsonb);
  END;

  -- Add security claims
  claims := jsonb_set(claims, '{aal}',
    COALESCE(claims->'aal', (event->'claims'->'aal'), '"aal1"'::jsonb));
  claims := jsonb_set(claims, '{amr}',
    COALESCE(claims->'amr', (event->'claims'->'amr'), '["password"]'::jsonb));

  -- Return updated event
  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

COMMENT ON FUNCTION public.custom_access_token_hook IS
'JWT token hook with 1000ms statement timeout (via pg_catalog.set_config) to prevent login blocking. Adds user_role claim for RBAC. Uses STABLE volatility for better optimization.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Auth hook updated to use pg_catalog.set_config() instead of SET LOCAL
-- ✅ Function volatility changed from VOLATILE to STABLE (safer)
-- ✅ Same behavior: timeout still applies locally to transaction
-- ✅ Better PostgreSQL compatibility and optimization
-- ============================================================================
