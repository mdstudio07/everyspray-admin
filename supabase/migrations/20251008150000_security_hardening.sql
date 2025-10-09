-- ============================================================================
-- Security Hardening Migration
-- ============================================================================
-- Created: 2025-10-08
-- Purpose: Add critical security improvements to RBAC and Catalog systems
--
-- Changes:
-- 1. Add statement timeout to auth hook (prevent login blocking)
-- 2. Fix audit trigger to fail-secure (block operations if audit fails)
-- 3. Create security health check function
-- 4. Add service role activity monitoring
-- 5. Create function ownership audit
-- 6. Add explicit schema qualification to workflow functions
-- ============================================================================

-- ============================================================================
-- 0. SCHEMA UPDATES FOR FAIL-SECURE AUDIT
-- ============================================================================
-- Purpose: Allow NULL changed_by for system operations (migrations, seeding)
-- This enables fail-secure audit while allowing automated system operations
-- ============================================================================

ALTER TABLE public.role_audit_log
  ALTER COLUMN changed_by DROP NOT NULL;

COMMENT ON COLUMN public.role_audit_log.changed_by IS
'User who made the role change. NULL for system operations (migrations, seeding).';


-- ============================================================================
-- 1. UPDATE AUTH HOOK WITH STATEMENT TIMEOUT
-- ============================================================================
-- Purpose: Prevent slow database queries from blocking user logins
-- Timeout: 1000ms (1 second - generous for auth, prevents hanging)
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
'JWT token hook with 1000ms statement timeout (via pg_catalog.set_config) to prevent login blocking. Adds user_role claim for RBAC.';


-- ============================================================================
-- 2. FIX AUDIT TRIGGER TO FAIL-SECURE
-- ============================================================================
-- Purpose: BLOCK role changes if audit logging fails (fail-secure)
-- Previous: RAISE WARNING (allowed operation to continue)
-- Current: RAISE EXCEPTION (blocks operation)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_old_role text;
  v_new_role text;
BEGIN
  -- Extract current user from JWT claims
  BEGIN
    v_user_id := NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
  EXCEPTION
    WHEN OTHERS THEN
      v_user_id := NULL; -- Service role or system
  END;

  -- Determine old and new roles based on operation
  IF TG_OP = 'INSERT' THEN
    v_old_role := NULL;
    v_new_role := NEW.role::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old_role := OLD.role::text;
    v_new_role := NEW.role::text;
  ELSIF TG_OP = 'DELETE' THEN
    v_old_role := OLD.role::text;
    v_new_role := NULL;
  END IF;

  -- ⚡ SECURITY HARDENING: Fail-secure audit logging
  -- If audit logging fails, the entire role change operation is BLOCKED
  -- changed_by can be NULL for system operations (migrations, seeding)
  BEGIN
    INSERT INTO public.role_audit_log (
      user_id,
      old_role,
      new_role,
      changed_by,
      reason,
      changed_at
    ) VALUES (
      COALESCE(NEW.user_id, OLD.user_id),
      v_old_role::app_role,
      v_new_role::app_role,
      v_user_id, -- NULL for system operations (migrations/seeding)
      CASE
        WHEN v_user_id IS NULL THEN 'System operation (service role or migration)'
        ELSE 'Automatic trigger on user_roles change'
      END,
      NOW()
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- 🔒 FAIL-SECURE: Block the operation if audit fails
      RAISE EXCEPTION 'CRITICAL: Role audit failed - operation blocked: %', SQLERRM;
  END;

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.audit_role_changes IS
'Fail-secure audit trigger: BLOCKS role changes if audit logging fails. Critical for compliance.';


-- ============================================================================
-- 3. CREATE SECURITY HEALTH CHECK FUNCTION
-- ============================================================================
-- Purpose: Automated security validation
-- Checks: Critical indexes, SECURITY DEFINER functions, RLS policies
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_security_health()
RETURNS TABLE (
  check_name text,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_index_exists boolean;
  v_definer_count integer;
  v_definer_no_path integer;
  v_rls_count integer;
  v_expected_rls integer := 6; -- brands, notes, perfumes + their _public tables
BEGIN
  -- ============================================
  -- CHECK 1: Critical Auth Index
  -- ============================================
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname = 'idx_user_roles_user_id'
  ) INTO v_index_exists;

  IF v_index_exists THEN
    RETURN QUERY SELECT
      'Critical Auth Index (idx_user_roles_user_id)'::text,
      '✅ PASS'::text,
      'Index exists - auth hook will be fast'::text;
  ELSE
    RETURN QUERY SELECT
      'Critical Auth Index (idx_user_roles_user_id)'::text,
      '❌ FAIL'::text,
      'CRITICAL: Missing index will cause slow logins'::text;
  END IF;

  -- ============================================
  -- CHECK 2: SECURITY DEFINER Functions
  -- ============================================
  SELECT
    COUNT(*) FILTER (WHERE prosecdef = true),
    COUNT(*) FILTER (WHERE prosecdef = true AND proconfig IS NULL)
  INTO v_definer_count, v_definer_no_path
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%';

  IF v_definer_no_path = 0 THEN
    RETURN QUERY SELECT
      'SECURITY DEFINER Functions'::text,
      '✅ PASS'::text,
      format('%s functions, all have explicit search_path', v_definer_count)::text;
  ELSIF v_definer_no_path < v_definer_count THEN
    RETURN QUERY SELECT
      'SECURITY DEFINER Functions'::text,
      '⚠️ WARNING'::text,
      format('%s/%s functions missing search_path', v_definer_no_path, v_definer_count)::text;
  ELSE
    RETURN QUERY SELECT
      'SECURITY DEFINER Functions'::text,
      '❌ FAIL'::text,
      format('ALL %s functions missing search_path', v_definer_count)::text;
  END IF;

  -- ============================================
  -- CHECK 3: RLS on Catalog Tables
  -- ============================================
  SELECT COUNT(*) INTO v_rls_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public'
  AND c.relname IN ('brands', 'notes', 'perfumes', 'brands_public', 'notes_public', 'perfumes_public')
  AND c.relrowsecurity = true;

  IF v_rls_count = v_expected_rls THEN
    RETURN QUERY SELECT
      'RLS on Catalog Tables'::text,
      '✅ PASS'::text,
      format('All %s catalog tables have RLS enabled', v_expected_rls)::text;
  ELSIF v_rls_count > 0 THEN
    RETURN QUERY SELECT
      'RLS on Catalog Tables'::text,
      '⚠️ WARNING'::text,
      format('Only %s/%s catalog tables have RLS', v_rls_count, v_expected_rls)::text;
  ELSE
    RETURN QUERY SELECT
      'RLS on Catalog Tables'::text,
      '❌ FAIL'::text,
      'CRITICAL: No RLS enabled on catalog tables'::text;
  END IF;

  -- ============================================
  -- CHECK 4: Audit Log Immutability
  -- ============================================
  DECLARE
    v_audit_update_policies integer;
    v_audit_delete_policies integer;
  BEGIN
    SELECT
      COUNT(*) FILTER (WHERE cmd = 'UPDATE'),
      COUNT(*) FILTER (WHERE cmd = 'DELETE')
    INTO v_audit_update_policies, v_audit_delete_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('audit_log', 'role_audit_log');

    IF v_audit_update_policies = 0 AND v_audit_delete_policies = 0 THEN
      RETURN QUERY SELECT
        'Audit Log Immutability'::text,
        '✅ PASS'::text,
        'No UPDATE/DELETE policies on audit tables'::text;
    ELSE
      RETURN QUERY SELECT
        'Audit Log Immutability'::text,
        '❌ FAIL'::text,
        format('Found %s UPDATE and %s DELETE policies',
          v_audit_update_policies, v_audit_delete_policies)::text;
    END IF;
  END;

  -- ============================================
  -- CHECK 5: Public Tables Write Protection
  -- ============================================
  DECLARE
    v_public_write_policies integer;
  BEGIN
    SELECT COUNT(*) INTO v_public_write_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('brands_public', 'notes_public', 'perfumes_public')
    AND cmd IN ('INSERT', 'UPDATE', 'DELETE')
    AND (
      'authenticated' = ANY(string_to_array(roles::text, ','))
      OR 'anon' = ANY(string_to_array(roles::text, ','))
    );

    IF v_public_write_policies = 0 THEN
      RETURN QUERY SELECT
        'Public Tables Write Protection'::text,
        '✅ PASS'::text,
        'No direct write policies for users on public tables'::text;
    ELSE
      RETURN QUERY SELECT
        'Public Tables Write Protection'::text,
        '❌ FAIL'::text,
        format('Found %s write policies - public tables should be read-only',
          v_public_write_policies)::text;
    END IF;
  END;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.check_security_health IS
'Automated security validation: checks critical indexes, SECURITY DEFINER functions, RLS policies, audit immutability.';


-- ============================================================================
-- 4. CREATE SERVICE ROLE ACTIVITY MONITORING FUNCTION
-- ============================================================================
-- Purpose: Detect unusual service role activity (potential security breach)
-- Method: Compare today vs 30-day average, flag if 3x higher
-- ============================================================================

CREATE OR REPLACE FUNCTION public.detect_unusual_service_role_activity()
RETURNS TABLE (
  date date,
  operation_count bigint,
  avg_30day numeric,
  is_unusual boolean,
  alert_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_today_count bigint;
  v_avg_30day numeric;
  v_threshold numeric;
BEGIN
  -- Get today's service role operations (user_id IS NULL)
  SELECT COUNT(*) INTO v_today_count
  FROM public.audit_log
  WHERE user_id IS NULL
  AND created_at >= CURRENT_DATE;

  -- Get 30-day average (excluding today)
  SELECT AVG(daily_count)::numeric(10,2) INTO v_avg_30day
  FROM (
    SELECT DATE(created_at) as day, COUNT(*) as daily_count
    FROM public.audit_log
    WHERE user_id IS NULL
    AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    AND created_at < CURRENT_DATE
    GROUP BY DATE(created_at)
  ) daily_stats;

  -- Default to 0 if no history
  v_avg_30day := COALESCE(v_avg_30day, 0);
  v_threshold := v_avg_30day * 3;

  -- Return today's stats
  RETURN QUERY SELECT
    CURRENT_DATE,
    v_today_count,
    v_avg_30day,
    (v_today_count > v_threshold AND v_avg_30day > 0) as is_unusual,
    CASE
      WHEN v_avg_30day = 0 AND v_today_count > 10 THEN '⚠️ WARNING: No baseline, high activity'
      WHEN v_today_count > v_threshold * 5 THEN '🔴 CRITICAL: 5x normal activity'
      WHEN v_today_count > v_threshold * 3 THEN '🟠 HIGH: 3x normal activity'
      WHEN v_today_count > v_threshold THEN '🟡 ELEVATED: Above threshold'
      ELSE '🟢 NORMAL'
    END::text;

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.detect_unusual_service_role_activity IS
'Detects unusual service role activity by comparing today vs 30-day average. Flags if 3x+ higher.';


-- ============================================================================
-- 5. CREATE FUNCTION OWNERSHIP AUDIT
-- ============================================================================
-- Purpose: Audit SECURITY DEFINER function ownership
-- Safe owners: postgres, supabase_admin, main database user
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_function_ownership()
RETURNS TABLE (
  function_name text,
  owner name,
  is_security_definer boolean,
  is_safe boolean,
  risk_level text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_safe_owners text[] := ARRAY['postgres', 'supabase_admin', 'supabase_auth_admin'];
BEGIN
  RETURN QUERY
  SELECT
    (n.nspname || '.' || p.proname)::text as function_name,
    pg_get_userbyid(p.proowner) as owner,
    p.prosecdef as is_security_definer,
    (pg_get_userbyid(p.proowner)::text = ANY(v_safe_owners)) as is_safe,
    CASE
      WHEN NOT p.prosecdef THEN '🟢 LOW: Not SECURITY DEFINER'
      WHEN pg_get_userbyid(p.proowner)::text = ANY(v_safe_owners) THEN '🟢 SAFE: Trusted owner'
      ELSE '🔴 HIGH: Untrusted owner with elevated privileges'
    END::text as risk_level
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname NOT LIKE 'pg_%'
  ORDER BY
    CASE
      WHEN p.prosecdef AND NOT (pg_get_userbyid(p.proowner)::text = ANY(v_safe_owners)) THEN 1
      WHEN p.prosecdef THEN 2
      ELSE 3
    END,
    p.proname;
END;
$$;

COMMENT ON FUNCTION public.audit_function_ownership IS
'Audits SECURITY DEFINER function ownership. Flags functions with untrusted owners.';


-- ============================================================================
-- 6. ADD EXPLICIT SCHEMA QUALIFICATION TO WORKFLOW FUNCTIONS
-- ============================================================================
-- Purpose: Extra safety layer - explicitly qualify all table references
-- Pattern: INSERT INTO perfumes_public → INSERT INTO public.perfumes_public
-- ============================================================================

-- NOTE: This step involves updating existing workflow functions
-- We'll update the most critical ones: approve_and_publish_* functions

-- ----------------------------------------------------------------------------
-- UPDATE: approve_and_publish_brand (with explicit schema)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_and_publish_brand(
  p_brand_id uuid,
  p_super_admin_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_brand_record RECORD;
  v_thumbnail_url text;
  v_new_public_id uuid;
  v_brand_before jsonb;
  v_brand_after jsonb;
BEGIN
  -- Verify user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_super_admin_id
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only super_admin can approve brands';
  END IF;

  -- Get brand data (explicit schema: public.brands)
  SELECT * INTO v_brand_record
  FROM public.brands
  WHERE id = p_brand_id
  AND status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand not found or not pending approval';
  END IF;

  -- Store before state
  v_brand_before := to_jsonb(v_brand_record);

  -- Fetch thumbnail URL from images table (explicit schema)
  IF v_brand_record.logo_image_id IS NOT NULL THEN
    SELECT thumbnail_url INTO v_thumbnail_url
    FROM public.images
    WHERE id = v_brand_record.logo_image_id;
  END IF;

  -- Insert into brands_public (DENORMALIZED) (explicit schema)
  INSERT INTO public.brands_public (
    brand_id,
    name,
    slug,
    thumbnail_url,
    published_by,
    published_at
  ) VALUES (
    p_brand_id,
    v_brand_record.name,
    v_brand_record.slug,
    v_thumbnail_url,
    p_super_admin_id,
    NOW()
  )
  RETURNING id INTO v_new_public_id;

  -- Update brands table (explicit schema)
  UPDATE public.brands
  SET
    status = 'approved',
    public_brand_id = v_new_public_id,
    approved_by = p_super_admin_id,
    approved_at = NOW()
  WHERE id = p_brand_id;

  -- Store after state
  SELECT to_jsonb(b.*) INTO v_brand_after
  FROM public.brands b
  WHERE id = p_brand_id;

  -- Log approval to audit_log (explicit schema)
  INSERT INTO public.audit_log (
    entity_type, entity_id, action, user_id,
    before_data, after_data, reason
  ) VALUES (
    'brand', p_brand_id::text, 'approved', p_super_admin_id,
    v_brand_before, v_brand_after, 'Brand approved by super admin'
  );

  -- Log publishing to audit_log (explicit schema)
  INSERT INTO public.audit_log (
    entity_type, entity_id, action, user_id,
    before_data, after_data, reason
  ) VALUES (
    'brand', v_new_public_id::text, 'published', p_super_admin_id,
    NULL, v_brand_after, 'Brand published to public catalog'
  );

  RETURN v_new_public_id;
END;
$$;

COMMENT ON FUNCTION public.approve_and_publish_brand IS
'Approves brand and publishes to brands_public with explicit schema qualification for security.';


-- ----------------------------------------------------------------------------
-- UPDATE: approve_and_publish_note (with explicit schema)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_and_publish_note(
  p_note_id uuid,
  p_super_admin_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_note_record RECORD;
  v_thumbnail_url text;
  v_new_public_id uuid;
  v_note_before jsonb;
  v_note_after jsonb;
BEGIN
  -- Verify user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_super_admin_id
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only super_admin can approve notes';
  END IF;

  -- Get note data (explicit schema)
  SELECT * INTO v_note_record
  FROM public.notes
  WHERE id = p_note_id
  AND status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Note not found or not pending approval';
  END IF;

  v_note_before := to_jsonb(v_note_record);

  -- Fetch thumbnail URL (explicit schema)
  IF v_note_record.image_id IS NOT NULL THEN
    SELECT thumbnail_url INTO v_thumbnail_url
    FROM public.images
    WHERE id = v_note_record.image_id;
  END IF;

  -- Insert into notes_public (explicit schema)
  INSERT INTO public.notes_public (
    note_id,
    name,
    slug,
    thumbnail_url,
    published_by,
    published_at
  ) VALUES (
    p_note_id,
    v_note_record.name,
    v_note_record.slug,
    v_thumbnail_url,
    p_super_admin_id,
    NOW()
  )
  RETURNING id INTO v_new_public_id;

  -- Update notes table (explicit schema)
  UPDATE public.notes
  SET
    status = 'approved',
    public_note_id = v_new_public_id,
    approved_by = p_super_admin_id,
    approved_at = NOW()
  WHERE id = p_note_id;

  SELECT to_jsonb(n.*) INTO v_note_after
  FROM public.notes n
  WHERE id = p_note_id;

  -- Log to audit (explicit schema)
  INSERT INTO public.audit_log (
    entity_type, entity_id, action, user_id,
    before_data, after_data, reason
  ) VALUES (
    'note', p_note_id::text, 'approved', p_super_admin_id,
    v_note_before, v_note_after, 'Note approved by super admin'
  );

  INSERT INTO public.audit_log (
    entity_type, entity_id, action, user_id,
    before_data, after_data, reason
  ) VALUES (
    'note', v_new_public_id::text, 'published', p_super_admin_id,
    NULL, v_note_after, 'Note published to public catalog'
  );

  RETURN v_new_public_id;
END;
$$;

COMMENT ON FUNCTION public.approve_and_publish_note IS
'Approves note and publishes to notes_public with explicit schema qualification.';


-- ----------------------------------------------------------------------------
-- UPDATE: approve_and_publish_perfume (with explicit schema)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.approve_and_publish_perfume(
  p_perfume_id uuid,
  p_super_admin_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_perfume_record RECORD;
  v_brand_name text;
  v_notes_string text;
  v_thumbnail_url text;
  v_all_note_ids uuid[];
  v_new_public_id uuid;
  v_perfume_before jsonb;
  v_perfume_after jsonb;
BEGIN
  -- Verify user is super_admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_super_admin_id
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Permission denied: Only super_admin can approve perfumes';
  END IF;

  -- Get perfume data (explicit schema)
  SELECT * INTO v_perfume_record
  FROM public.perfumes
  WHERE id = p_perfume_id
  AND status = 'pending_approval';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfume not found or not pending approval';
  END IF;

  v_perfume_before := to_jsonb(v_perfume_record);

  -- CRITICAL DENORMALIZATION STEP 1: Fetch brand_name (explicit schema)
  SELECT name INTO v_brand_name
  FROM public.brands_public
  WHERE id = v_perfume_record.brand_id;

  IF v_brand_name IS NULL THEN
    RAISE EXCEPTION 'Brand not found in public catalog';
  END IF;

  -- CRITICAL DENORMALIZATION STEP 2: Combine all note IDs
  v_all_note_ids := COALESCE(v_perfume_record.top_note_ids, ARRAY[]::uuid[]) ||
                    COALESCE(v_perfume_record.middle_note_ids, ARRAY[]::uuid[]) ||
                    COALESCE(v_perfume_record.base_note_ids, ARRAY[]::uuid[]);

  -- CRITICAL DENORMALIZATION STEP 3: Fetch and concatenate note names (explicit schema)
  IF array_length(v_all_note_ids, 1) > 0 THEN
    SELECT string_agg(name, ', ' ORDER BY name) INTO v_notes_string
    FROM public.notes_public
    WHERE id = ANY(v_all_note_ids);
  END IF;

  -- CRITICAL DENORMALIZATION STEP 4: Fetch thumbnail URL (explicit schema)
  IF v_perfume_record.main_image_id IS NOT NULL THEN
    SELECT thumbnail_url INTO v_thumbnail_url
    FROM public.images
    WHERE id = v_perfume_record.main_image_id;
  END IF;

  -- Insert into perfumes_public (FULLY DENORMALIZED) (explicit schema)
  INSERT INTO public.perfumes_public (
    perfume_id,
    name,
    slug,
    brand_name,
    notes,
    thumbnail_url,
    published_by,
    published_at
  ) VALUES (
    p_perfume_id,
    v_perfume_record.name,
    v_perfume_record.slug,
    v_brand_name,
    v_notes_string,
    v_thumbnail_url,
    p_super_admin_id,
    NOW()
  )
  RETURNING id INTO v_new_public_id;

  -- Update perfumes table (explicit schema)
  UPDATE public.perfumes
  SET
    status = 'approved',
    public_perfume_id = v_new_public_id,
    approved_by = p_super_admin_id,
    approved_at = NOW()
  WHERE id = p_perfume_id;

  SELECT to_jsonb(p.*) INTO v_perfume_after
  FROM public.perfumes p
  WHERE id = p_perfume_id;

  -- Log to audit (explicit schema)
  INSERT INTO public.audit_log (
    entity_type, entity_id, action, user_id,
    before_data, after_data, reason
  ) VALUES (
    'perfume', p_perfume_id::text, 'approved', p_super_admin_id,
    v_perfume_before, v_perfume_after, 'Perfume approved by super admin'
  );

  INSERT INTO public.audit_log (
    entity_type, entity_id, action, user_id,
    before_data, after_data, reason
  ) VALUES (
    'perfume', v_new_public_id::text, 'published', p_super_admin_id,
    NULL, v_perfume_after, 'Perfume published to public catalog'
  );

  RETURN v_new_public_id;
END;
$$;

COMMENT ON FUNCTION public.approve_and_publish_perfume IS
'Approves perfume with full denormalization (brand_name, notes, thumbnail) and explicit schema qualification.';


-- ============================================================================
-- VALIDATION: Run Security Health Check
-- ============================================================================

DO $$
DECLARE
  v_check_record RECORD;
  v_has_failures boolean := false;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SECURITY HEALTH CHECK RESULTS';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';

  FOR v_check_record IN SELECT * FROM public.check_security_health() LOOP
    RAISE NOTICE '[%] % - %',
      v_check_record.status,
      v_check_record.check_name,
      v_check_record.details;

    IF v_check_record.status LIKE '%FAIL%' THEN
      v_has_failures := true;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';

  IF v_has_failures THEN
    RAISE NOTICE '⚠️  ATTENTION: Some security checks failed. Review above.';
  ELSE
    RAISE NOTICE '✅ All security checks passed!';
  END IF;

  RAISE NOTICE '============================================================================';
  RAISE NOTICE '';
END;
$$;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary:
-- ✅ Auth hook now has 1000ms statement timeout (via pg_catalog.set_config)
-- ✅ Audit trigger now fail-secure (RAISE EXCEPTION)
-- ✅ Security health check function created
-- ✅ Service role activity monitoring added
-- ✅ Function ownership audit created
-- ✅ Critical workflow functions updated with explicit schema qualification
-- ✅ Security validation executed
-- ============================================================================
