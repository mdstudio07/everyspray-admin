-- ============================================================================
-- Update Auth Hook: Add Claims Whitelisting and Robust User ID Extraction
-- ============================================================================
-- Created: 2025-10-09
-- Purpose: Enhance custom_access_token_hook with production security features
--
-- Improvements:
-- - Claims whitelisting (only allow known, safe claims)
-- - Robust user_id extraction (supports both event.user_id and claims.sub)
-- - Guaranteed aal/amr claims for compatibility
-- - pg_catalog.set_config() for STABLE function compatibility
-- ============================================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE  -- Safe to use STABLE with pg_catalog.set_config()
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  original_claims jsonb := COALESCE(event->'claims', '{}'::jsonb);
  new_claims jsonb := '{}'::jsonb;
  claim text;
  v_user_id uuid := NULL;
  v_role text := NULL;
  allowed text[] := ARRAY[
    'iss','aud','exp','iat','sub','role','aal','session_id','email','phone','is_anonymous'
  ];
BEGIN
  -- ⚡ SECURITY HARDENING: Keep hook fast with statement timeout
  -- Using pg_catalog.set_config() instead of SET LOCAL for STABLE function compatibility
  PERFORM pg_catalog.set_config('statement_timeout', '1000', true);

  -- Pick user id: prefer top-level event.user_id, then claims.sub
  BEGIN
    IF event ? 'user_id' THEN
      v_user_id := NULLIF(event->>'user_id','')::uuid;
    ELSIF original_claims ? 'sub' THEN
      v_user_id := NULLIF(original_claims->>'sub','')::uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  -- Whitelist existing claims into new_claims (security: only allow known claims)
  FOREACH claim IN ARRAY allowed LOOP
    IF original_claims ? claim THEN
      new_claims := jsonb_set(new_claims, ARRAY[claim], original_claims->claim, true);
    END IF;
  END LOOP;

  -- Attempt to fetch role from public.user_roles for v_user_id
  IF v_user_id IS NOT NULL THEN
    BEGIN
      SELECT role::text INTO v_role
      FROM public.user_roles
      WHERE user_id = v_user_id
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      v_role := NULL;
    END;
  END IF;

  -- Default role if none found
  IF v_role IS NULL THEN
    v_role := 'contributor';
  END IF;

  -- Set user_role claim (create missing path)
  new_claims := jsonb_set(new_claims, '{user_role}', to_jsonb(v_role), true);

  -- Ensure aal/amr exist
  IF NOT (new_claims ? 'aal') THEN
    new_claims := jsonb_set(new_claims, '{aal}', '"aal1"'::jsonb, true);
  END IF;
  IF NOT (new_claims ? 'amr') THEN
    new_claims := jsonb_set(new_claims, '{amr}', '["password"]'::jsonb, true);
  END IF;

  -- Return the claims object expected by Supabase auth hook
  RETURN jsonb_build_object('claims', new_claims);
END;
$$;

COMMENT ON FUNCTION public.custom_access_token_hook IS
'JWT token hook with 1000ms statement timeout (via pg_catalog.set_config) to prevent login blocking. Adds user_role claim for RBAC. Uses STABLE volatility for better optimization. Implements claims whitelisting for security.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Auth hook updated with claims whitelisting (security best practice)
-- ✅ Robust user_id extraction (supports both event.user_id and claims.sub)
-- ✅ Guaranteed aal/amr claims for compatibility
-- ✅ Uses pg_catalog.set_config() with STABLE volatility
-- ✅ 1000ms statement timeout prevents login blocking
-- ============================================================================
