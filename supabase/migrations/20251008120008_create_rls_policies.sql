-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================
-- This migration creates RLS policies for all catalog tables.
--
-- Security Model:
-- - Contributors: Can ONLY write to contributor_perfume_suggestions
-- - Team Members: Can create/edit drafts (brands, notes, perfumes)
-- - Super Admins: Can approve/reject/publish everything
-- - Public (anon): Can READ published data only (brands_public, notes_public, perfumes_public)
--
-- Key Principles:
-- - Public tables: Read-only for everyone, write-only via SECURITY DEFINER functions
-- - Draft tables: Team members can edit their own drafts
-- - Suggestions: Contributors can only see/edit their own
-- ========================================

-- =====================================
-- ENABLE RLS ON ALL TABLES
-- =====================================

ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_perfume_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfumes_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- =====================================
-- HELPER FUNCTION: Check if user is super admin
-- =====================================

CREATE OR REPLACE FUNCTION public.is_super_admin_catalog()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    SELECT authorize('users.manage')
  );
END;
$$;

-- =====================================
-- HELPER FUNCTION: Check if user is team member or higher
-- =====================================

CREATE OR REPLACE FUNCTION public.is_team_member_or_higher_catalog()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (
    SELECT is_team_member_or_higher()
  );
END;
$$;

-- =====================================
-- IMAGES TABLE POLICIES
-- =====================================

-- Everyone can view images (public display)
CREATE POLICY images_select_all
ON public.images
FOR SELECT
TO anon, authenticated
USING (true);

-- Team members can upload images
CREATE POLICY images_insert_team
ON public.images
FOR INSERT
TO authenticated
WITH CHECK (is_team_member_or_higher_catalog());

-- Users can update their own uploaded images
CREATE POLICY images_update_own
ON public.images
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Super admins can delete images
CREATE POLICY images_delete_admin
ON public.images
FOR DELETE
TO authenticated
USING (is_super_admin_catalog());

-- =====================================
-- CONTRIBUTOR SUGGESTIONS POLICIES
-- =====================================

-- Contributors can insert their own suggestions
CREATE POLICY contrib_suggestions_insert
ON public.contributor_perfume_suggestions
FOR INSERT
TO authenticated
WITH CHECK (contributor_id = auth.uid() AND authorize('suggestions.create'));

-- Contributors can view their own suggestions
CREATE POLICY contrib_suggestions_select_own
ON public.contributor_perfume_suggestions
FOR SELECT
TO authenticated
USING (contributor_id = auth.uid());

-- Team members can view all suggestions
CREATE POLICY contrib_suggestions_select_team
ON public.contributor_perfume_suggestions
FOR SELECT
TO authenticated
USING (is_team_member_or_higher_catalog());

-- Team members can update suggestions (assign, process)
CREATE POLICY contrib_suggestions_update_team
ON public.contributor_perfume_suggestions
FOR UPDATE
TO authenticated
USING (is_team_member_or_higher_catalog())
WITH CHECK (is_team_member_or_higher_catalog());

-- =====================================
-- BRANDS DRAFT TABLE POLICIES
-- =====================================

-- Team members can create brands
CREATE POLICY brands_insert_team
ON public.brands
FOR INSERT
TO authenticated
WITH CHECK (
  is_team_member_or_higher_catalog() AND
  created_by = auth.uid() AND
  authorize('brands.create')
);

-- Team members can view their own drafts + all approved brands
CREATE POLICY brands_select_team
ON public.brands
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  status = 'approved' OR
  is_super_admin_catalog()
);

-- Team members can update their own drafts
CREATE POLICY brands_update_own
ON public.brands
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  status = 'draft' AND
  authorize('brands.update')
)
WITH CHECK (
  created_by = auth.uid() AND
  status = 'draft'
);

-- Super admins can update any brand
CREATE POLICY brands_update_admin
ON public.brands
FOR UPDATE
TO authenticated
USING (is_super_admin_catalog())
WITH CHECK (is_super_admin_catalog());

-- Super admins can delete brands
CREATE POLICY brands_delete_admin
ON public.brands
FOR DELETE
TO authenticated
USING (is_super_admin_catalog());

-- =====================================
-- BRANDS PUBLIC TABLE POLICIES
-- =====================================

-- Everyone can read published brands
CREATE POLICY brands_public_select_all
ON public.brands_public
FOR SELECT
TO anon, authenticated
USING (true);

-- NO direct INSERT/UPDATE/DELETE policies (only via functions)

-- =====================================
-- NOTES DRAFT TABLE POLICIES
-- =====================================

-- Team members can create notes
CREATE POLICY notes_insert_team
ON public.notes
FOR INSERT
TO authenticated
WITH CHECK (
  is_team_member_or_higher_catalog() AND
  created_by = auth.uid() AND
  authorize('notes.create')
);

-- Team members can view their own drafts + all approved notes
CREATE POLICY notes_select_team
ON public.notes
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  status = 'approved' OR
  is_super_admin_catalog()
);

-- Team members can update their own drafts
CREATE POLICY notes_update_own
ON public.notes
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  status = 'draft' AND
  authorize('notes.update')
)
WITH CHECK (
  created_by = auth.uid() AND
  status = 'draft'
);

-- Super admins can update any note
CREATE POLICY notes_update_admin
ON public.notes
FOR UPDATE
TO authenticated
USING (is_super_admin_catalog())
WITH CHECK (is_super_admin_catalog());

-- Super admins can delete notes
CREATE POLICY notes_delete_admin
ON public.notes
FOR DELETE
TO authenticated
USING (is_super_admin_catalog());

-- =====================================
-- NOTES PUBLIC TABLE POLICIES
-- =====================================

-- Everyone can read published notes
CREATE POLICY notes_public_select_all
ON public.notes_public
FOR SELECT
TO anon, authenticated
USING (true);

-- NO direct INSERT/UPDATE/DELETE policies (only via functions)

-- =====================================
-- PERFUMES DRAFT TABLE POLICIES
-- =====================================

-- Team members can create perfumes
CREATE POLICY perfumes_insert_team
ON public.perfumes
FOR INSERT
TO authenticated
WITH CHECK (
  is_team_member_or_higher_catalog() AND
  created_by = auth.uid() AND
  authorize('perfumes.create')
);

-- Team members can view their own drafts + all approved perfumes
CREATE POLICY perfumes_select_team
ON public.perfumes
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR
  status = 'approved' OR
  is_super_admin_catalog()
);

-- Team members can update their own drafts
CREATE POLICY perfumes_update_own
ON public.perfumes
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  status = 'draft' AND
  authorize('perfumes.update')
)
WITH CHECK (
  created_by = auth.uid() AND
  status = 'draft'
);

-- Super admins can update any perfume
CREATE POLICY perfumes_update_admin
ON public.perfumes
FOR UPDATE
TO authenticated
USING (is_super_admin_catalog())
WITH CHECK (is_super_admin_catalog());

-- Super admins can delete perfumes
CREATE POLICY perfumes_delete_admin
ON public.perfumes
FOR DELETE
TO authenticated
USING (is_super_admin_catalog());

-- =====================================
-- PERFUMES PUBLIC TABLE POLICIES
-- =====================================

-- Everyone can read published perfumes
CREATE POLICY perfumes_public_select_all
ON public.perfumes_public
FOR SELECT
TO anon, authenticated
USING (true);

-- NO direct INSERT/UPDATE/DELETE policies (only via functions)

-- =====================================
-- AUDIT LOG POLICIES
-- =====================================

-- Super admins can view all audit logs
CREATE POLICY audit_log_select_admin
ON public.audit_log
FOR SELECT
TO authenticated
USING (is_super_admin_catalog());

-- Team members can view their own actions
CREATE POLICY audit_log_select_own
ON public.audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only system (via functions) can insert audit logs
-- No UPDATE or DELETE policies (immutable)

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON POLICY images_select_all ON public.images IS 'Everyone can view images';
COMMENT ON POLICY brands_public_select_all ON public.brands_public IS 'Public access to published brands';
COMMENT ON POLICY notes_public_select_all ON public.notes_public IS 'Public access to published notes';
COMMENT ON POLICY perfumes_public_select_all ON public.perfumes_public IS 'Public access to published perfumes';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  -- Count total policies created
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  IF v_policy_count < 30 THEN
    RAISE WARNING 'Expected at least 30 policies, found %', v_policy_count;
  END IF;

  RAISE NOTICE '✅ RLS policies created successfully';
  RAISE NOTICE '   - Total policies: %', v_policy_count;
  RAISE NOTICE '   - Public tables: Read-only for everyone';
  RAISE NOTICE '   - Draft tables: Team members can edit their own';
  RAISE NOTICE '   - Suggestions: Contributors can only see their own';
  RAISE NOTICE '   - Audit log: Super admins can view all, team members can view their own';
END $$;
