-- ========================================
-- WORKFLOW FUNCTIONS
-- ========================================
-- This migration creates all workflow functions for the perfume catalog system.
--
-- Functions Created:
-- 1. Suggestions: accept_suggestion_to_review, reject_suggestion
-- 2. Brands: submit_brand_for_approval, approve_and_publish_brand, reject_brand, unpublish_brand
-- 3. Notes: submit_note_for_approval, approve_and_publish_note, reject_note, unpublish_note
-- 4. Perfumes: submit_perfume_for_approval, approve_and_publish_perfume, reject_perfume, unpublish_perfume
--
-- All functions use SECURITY DEFINER to bypass RLS for writing to public tables.
-- ========================================

-- =====================================
-- HELPER FUNCTION: Generate slug from text
-- =====================================

CREATE OR REPLACE FUNCTION public.generate_slug(p_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(p_text, '[^a-zA-Z0-9\s-]', '', 'g'), -- Remove special chars
    '\s+', '-', 'g' -- Replace spaces with hyphens
  ));
END;
$$;

-- =====================================
-- 1. ACCEPT SUGGESTION TO REVIEW
-- =====================================

CREATE OR REPLACE FUNCTION public.accept_suggestion_to_review(
  p_suggestion_id INTEGER,
  p_team_member_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_perfume_id UUID;
  v_suggestion RECORD;
BEGIN
  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_team_member_id
    AND role IN ('team_member', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: team_member or super_admin role required';
  END IF;

  -- Get suggestion
  SELECT * INTO v_suggestion
  FROM contributor_perfume_suggestions
  WHERE id = p_suggestion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found with id: %', p_suggestion_id;
  END IF;

  IF v_suggestion.status != 'pending' THEN
    RAISE EXCEPTION 'Suggestion already processed with status: %', v_suggestion.status;
  END IF;

  -- Create perfume draft
  INSERT INTO perfumes (
    suggestion_id,
    name,
    slug,
    brand_id,
    created_by,
    status
  )
  SELECT
    p_suggestion_id,
    v_suggestion.perfume_name,
    generate_slug(v_suggestion.perfume_name),
    NULL, -- Brand to be filled by team member
    p_team_member_id,
    'draft'
  RETURNING id INTO v_perfume_id;

  -- Update suggestion
  UPDATE contributor_perfume_suggestions
  SET
    status = 'accepted',
    assigned_to_team_member = p_team_member_id,
    processed_by = p_team_member_id,
    processed_at = NOW()
  WHERE id = p_suggestion_id;

  -- Create audit logs
  PERFORM create_audit_log_entry(
    'perfume',
    v_perfume_id::TEXT,
    'created',
    p_team_member_id,
    NULL,
    to_jsonb(v_suggestion),
    'Created from suggestion #' || p_suggestion_id
  );

  PERFORM create_audit_log_entry(
    'suggestion',
    p_suggestion_id::TEXT,
    'approved',
    p_team_member_id,
    NULL,
    NULL,
    'Moved to review as perfume draft'
  );

  RETURN v_perfume_id;
END;
$$;

-- =====================================
-- 2. REJECT SUGGESTION
-- =====================================

CREATE OR REPLACE FUNCTION public.reject_suggestion(
  p_suggestion_id INTEGER,
  p_rejection_note TEXT,
  p_team_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_suggestion RECORD;
BEGIN
  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_team_member_id
    AND role IN ('team_member', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Validate rejection note
  IF p_rejection_note IS NULL OR length(trim(p_rejection_note)) = 0 THEN
    RAISE EXCEPTION 'Rejection note is required';
  END IF;

  -- Get suggestion
  SELECT * INTO v_suggestion
  FROM contributor_perfume_suggestions
  WHERE id = p_suggestion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found';
  END IF;

  IF v_suggestion.status != 'pending' THEN
    RAISE EXCEPTION 'Suggestion already processed';
  END IF;

  -- Update suggestion
  UPDATE contributor_perfume_suggestions
  SET
    status = 'rejected',
    rejection_note = p_rejection_note,
    processed_by = p_team_member_id,
    processed_at = NOW()
  WHERE id = p_suggestion_id;

  -- Create audit log
  PERFORM create_audit_log_entry(
    'suggestion',
    p_suggestion_id::TEXT,
    'rejected',
    p_team_member_id,
    to_jsonb(v_suggestion),
    NULL,
    p_rejection_note
  );

  RETURN TRUE;
END;
$$;

-- =====================================
-- 3. SUBMIT BRAND FOR APPROVAL
-- =====================================

CREATE OR REPLACE FUNCTION public.submit_brand_for_approval(
  p_brand_id UUID,
  p_team_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_brand RECORD;
BEGIN
  -- Get brand
  SELECT * INTO v_brand FROM brands WHERE id = p_brand_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  IF v_brand.status != 'draft' THEN
    RAISE EXCEPTION 'Brand must be in draft status';
  END IF;

  IF v_brand.created_by != p_team_member_id THEN
    RAISE EXCEPTION 'You can only submit your own drafts';
  END IF;

  -- Update brand status
  UPDATE brands
  SET status = 'pending_approval'
  WHERE id = p_brand_id;

  -- Create audit log
  PERFORM create_audit_log_entry(
    'brand',
    p_brand_id::TEXT,
    'updated',
    p_team_member_id,
    to_jsonb(v_brand),
    to_jsonb((SELECT brands FROM brands WHERE id = p_brand_id)),
    'Submitted for approval'
  );

  RETURN TRUE;
END;
$$;

-- =====================================
-- 4. APPROVE AND PUBLISH BRAND
-- =====================================

CREATE OR REPLACE FUNCTION public.approve_and_publish_brand(
  p_brand_id UUID,
  p_super_admin_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_brand RECORD;
  v_public_brand_id UUID;
  v_thumbnail_url TEXT;
BEGIN
  -- Check super admin permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_super_admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions: super_admin required';
  END IF;

  -- Get brand
  SELECT * INTO v_brand FROM brands WHERE id = p_brand_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  IF v_brand.status != 'pending_approval' THEN
    RAISE EXCEPTION 'Brand must be in pending_approval status, current: %', v_brand.status;
  END IF;

  -- Get thumbnail URL
  IF v_brand.logo_image_id IS NOT NULL THEN
    SELECT thumbnail_url INTO v_thumbnail_url
    FROM images
    WHERE id = v_brand.logo_image_id;
  END IF;

  -- Insert into brands_public (DENORMALIZED)
  INSERT INTO brands_public (
    brand_id,
    name,
    slug,
    thumbnail_url,
    published_by
  ) VALUES (
    p_brand_id,
    v_brand.name,
    v_brand.slug,
    v_thumbnail_url,
    p_super_admin_id
  )
  RETURNING id INTO v_public_brand_id;

  -- Update brand status and link to public
  UPDATE brands
  SET
    status = 'approved',
    public_brand_id = v_public_brand_id,
    approved_by = p_super_admin_id,
    approved_at = NOW()
  WHERE id = p_brand_id;

  -- Create audit logs
  PERFORM create_audit_log_entry(
    'brand',
    p_brand_id::TEXT,
    'approved',
    p_super_admin_id,
    to_jsonb(v_brand),
    to_jsonb((SELECT brands FROM brands WHERE id = p_brand_id)),
    'Approved and published to brands_public'
  );

  PERFORM create_audit_log_entry(
    'brand',
    v_public_brand_id::TEXT,
    'published',
    p_super_admin_id,
    NULL,
    to_jsonb((SELECT brands_public FROM brands_public WHERE id = v_public_brand_id)),
    'Published to public catalog'
  );

  RETURN v_public_brand_id;
END;
$$;

-- =====================================
-- 5. REJECT BRAND
-- =====================================

CREATE OR REPLACE FUNCTION public.reject_brand(
  p_brand_id UUID,
  p_rejection_note TEXT,
  p_super_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_brand RECORD;
BEGIN
  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_super_admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Validate rejection note
  IF p_rejection_note IS NULL OR length(trim(p_rejection_note)) = 0 THEN
    RAISE EXCEPTION 'Rejection note is required';
  END IF;

  -- Get brand
  SELECT * INTO v_brand FROM brands WHERE id = p_brand_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  IF v_brand.status != 'pending_approval' THEN
    RAISE EXCEPTION 'Brand must be in pending_approval status';
  END IF;

  -- Update brand
  UPDATE brands
  SET
    status = 'rejected',
    rejection_note = p_rejection_note,
    rejected_by = p_super_admin_id,
    rejected_at = NOW()
  WHERE id = p_brand_id;

  -- Create audit log
  PERFORM create_audit_log_entry(
    'brand',
    p_brand_id::TEXT,
    'rejected',
    p_super_admin_id,
    to_jsonb(v_brand),
    to_jsonb((SELECT brands FROM brands WHERE id = p_brand_id)),
    p_rejection_note
  );

  RETURN TRUE;
END;
$$;

-- =====================================
-- 6. UNPUBLISH BRAND
-- =====================================

CREATE OR REPLACE FUNCTION public.unpublish_brand(
  p_brand_id UUID,
  p_reason TEXT,
  p_super_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_brand RECORD;
  v_public_brand RECORD;
BEGIN
  -- Check permission
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_super_admin_id AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Validate reason
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'Reason is required for unpublishing';
  END IF;

  -- Get brand
  SELECT * INTO v_brand FROM brands WHERE id = p_brand_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Brand not found';
  END IF;

  IF v_brand.status != 'approved' OR v_brand.public_brand_id IS NULL THEN
    RAISE EXCEPTION 'Brand is not currently published';
  END IF;

  -- Get public brand before deletion
  SELECT * INTO v_public_brand
  FROM brands_public
  WHERE id = v_brand.public_brand_id;

  -- Delete from public table
  DELETE FROM brands_public WHERE id = v_brand.public_brand_id;

  -- Update brand status
  UPDATE brands
  SET
    status = 'draft',
    public_brand_id = NULL
  WHERE id = p_brand_id;

  -- Create audit logs
  PERFORM create_audit_log_entry(
    'brand',
    p_brand_id::TEXT,
    'unpublished',
    p_super_admin_id,
    to_jsonb(v_brand),
    to_jsonb((SELECT brands FROM brands WHERE id = p_brand_id)),
    p_reason
  );

  PERFORM create_audit_log_entry(
    'brand',
    v_public_brand.id::TEXT,
    'deleted',
    p_super_admin_id,
    to_jsonb(v_public_brand),
    NULL,
    p_reason
  );

  RETURN TRUE;
END;
$$;

-- =====================================
-- 7-9. NOTES FUNCTIONS (Similar pattern)
-- =====================================

CREATE OR REPLACE FUNCTION public.submit_note_for_approval(
  p_note_id UUID,
  p_team_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_note RECORD;
BEGIN
  SELECT * INTO v_note FROM notes WHERE id = p_note_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Note not found'; END IF;
  IF v_note.status != 'draft' THEN RAISE EXCEPTION 'Note must be in draft status'; END IF;
  IF v_note.created_by != p_team_member_id THEN RAISE EXCEPTION 'You can only submit your own drafts'; END IF;

  UPDATE notes SET status = 'pending_approval' WHERE id = p_note_id;
  PERFORM create_audit_log_entry('note', p_note_id::TEXT, 'updated', p_team_member_id, to_jsonb(v_note), to_jsonb((SELECT notes FROM notes WHERE id = p_note_id)), 'Submitted for approval');
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_and_publish_note(
  p_note_id UUID,
  p_super_admin_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_note RECORD;
  v_public_note_id UUID;
  v_thumbnail_url TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_super_admin_id AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  SELECT * INTO v_note FROM notes WHERE id = p_note_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Note not found'; END IF;
  IF v_note.status != 'pending_approval' THEN RAISE EXCEPTION 'Note must be in pending_approval status'; END IF;

  IF v_note.image_id IS NOT NULL THEN
    SELECT thumbnail_url INTO v_thumbnail_url FROM images WHERE id = v_note.image_id;
  END IF;

  INSERT INTO notes_public (note_id, name, slug, thumbnail_url, published_by)
  VALUES (p_note_id, v_note.name, v_note.slug, v_thumbnail_url, p_super_admin_id)
  RETURNING id INTO v_public_note_id;

  UPDATE notes SET status = 'approved', public_note_id = v_public_note_id, approved_by = p_super_admin_id, approved_at = NOW() WHERE id = p_note_id;
  PERFORM create_audit_log_entry('note', p_note_id::TEXT, 'approved', p_super_admin_id, to_jsonb(v_note), to_jsonb((SELECT notes FROM notes WHERE id = p_note_id)), 'Approved and published');
  PERFORM create_audit_log_entry('note', v_public_note_id::TEXT, 'published', p_super_admin_id, NULL, to_jsonb((SELECT notes_public FROM notes_public WHERE id = v_public_note_id)), 'Published');
  RETURN v_public_note_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_note(
  p_note_id UUID,
  p_rejection_note TEXT,
  p_super_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_note RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_super_admin_id AND role = 'super_admin') THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  IF p_rejection_note IS NULL OR length(trim(p_rejection_note)) = 0 THEN RAISE EXCEPTION 'Rejection note required'; END IF;

  SELECT * INTO v_note FROM notes WHERE id = p_note_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Note not found'; END IF;
  IF v_note.status != 'pending_approval' THEN RAISE EXCEPTION 'Note must be in pending_approval status'; END IF;

  UPDATE notes SET status = 'rejected', rejection_note = p_rejection_note, rejected_by = p_super_admin_id, rejected_at = NOW() WHERE id = p_note_id;
  PERFORM create_audit_log_entry('note', p_note_id::TEXT, 'rejected', p_super_admin_id, to_jsonb(v_note), to_jsonb((SELECT notes FROM notes WHERE id = p_note_id)), p_rejection_note);
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.unpublish_note(
  p_note_id UUID,
  p_reason TEXT,
  p_super_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_note RECORD;
  v_public_note RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_super_admin_id AND role = 'super_admin') THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'Reason required'; END IF;

  SELECT * INTO v_note FROM notes WHERE id = p_note_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Note not found'; END IF;
  IF v_note.status != 'approved' OR v_note.public_note_id IS NULL THEN RAISE EXCEPTION 'Note not currently published'; END IF;

  SELECT * INTO v_public_note FROM notes_public WHERE id = v_note.public_note_id;
  DELETE FROM notes_public WHERE id = v_note.public_note_id;
  UPDATE notes SET status = 'draft', public_note_id = NULL WHERE id = p_note_id;

  PERFORM create_audit_log_entry('note', p_note_id::TEXT, 'unpublished', p_super_admin_id, to_jsonb(v_note), to_jsonb((SELECT notes FROM notes WHERE id = p_note_id)), p_reason);
  PERFORM create_audit_log_entry('note', v_public_note.id::TEXT, 'deleted', p_super_admin_id, to_jsonb(v_public_note), NULL, p_reason);
  RETURN TRUE;
END;
$$;

-- =====================================
-- 10-13. PERFUME FUNCTIONS (Most complex - denormalization)
-- =====================================

CREATE OR REPLACE FUNCTION public.submit_perfume_for_approval(
  p_perfume_id UUID,
  p_team_member_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_perfume RECORD;
BEGIN
  SELECT * INTO v_perfume FROM perfumes WHERE id = p_perfume_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfume not found'; END IF;
  IF v_perfume.status != 'draft' THEN RAISE EXCEPTION 'Perfume must be in draft status'; END IF;
  IF v_perfume.created_by != p_team_member_id THEN RAISE EXCEPTION 'You can only submit your own drafts'; END IF;
  IF v_perfume.brand_id IS NULL THEN RAISE EXCEPTION 'Perfume must have a brand assigned'; END IF;

  UPDATE perfumes SET status = 'pending_approval' WHERE id = p_perfume_id;
  PERFORM create_audit_log_entry('perfume', p_perfume_id::TEXT, 'updated', p_team_member_id, to_jsonb(v_perfume), to_jsonb((SELECT perfumes FROM perfumes WHERE id = p_perfume_id)), 'Submitted for approval');
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_and_publish_perfume(
  p_perfume_id UUID,
  p_super_admin_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_perfume RECORD;
  v_public_perfume_id UUID;
  v_brand_name TEXT;
  v_notes_string TEXT;
  v_thumbnail_url TEXT;
  v_all_note_ids UUID[];
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_super_admin_id AND role = 'super_admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  SELECT * INTO v_perfume FROM perfumes WHERE id = p_perfume_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfume not found'; END IF;
  IF v_perfume.status != 'pending_approval' THEN RAISE EXCEPTION 'Perfume must be in pending_approval status'; END IF;

  -- Get brand name (DENORMALIZED)
  SELECT name INTO v_brand_name FROM brands_public WHERE id = v_perfume.brand_id;
  IF v_brand_name IS NULL THEN RAISE EXCEPTION 'Brand not found in public catalog'; END IF;

  -- Combine all note IDs
  v_all_note_ids := v_perfume.top_note_ids || v_perfume.middle_note_ids || v_perfume.base_note_ids;

  -- Get all note names and concatenate (DENORMALIZED)
  SELECT string_agg(name, ', ' ORDER BY name) INTO v_notes_string
  FROM notes_public
  WHERE id = ANY(v_all_note_ids);

  -- Get thumbnail (DENORMALIZED)
  IF v_perfume.main_image_id IS NOT NULL THEN
    SELECT thumbnail_url INTO v_thumbnail_url FROM images WHERE id = v_perfume.main_image_id;
  END IF;

  -- Insert into perfumes_public (FULLY DENORMALIZED)
  INSERT INTO perfumes_public (perfume_id, name, slug, brand_name, notes, thumbnail_url, published_by)
  VALUES (p_perfume_id, v_perfume.name, v_perfume.slug, v_brand_name, COALESCE(v_notes_string, 'No notes'), v_thumbnail_url, p_super_admin_id)
  RETURNING id INTO v_public_perfume_id;

  UPDATE perfumes SET status = 'approved', public_perfume_id = v_public_perfume_id, approved_by = p_super_admin_id, approved_at = NOW() WHERE id = p_perfume_id;
  PERFORM create_audit_log_entry('perfume', p_perfume_id::TEXT, 'approved', p_super_admin_id, to_jsonb(v_perfume), to_jsonb((SELECT perfumes FROM perfumes WHERE id = p_perfume_id)), 'Approved and published');
  PERFORM create_audit_log_entry('perfume', v_public_perfume_id::TEXT, 'published', p_super_admin_id, NULL, to_jsonb((SELECT perfumes_public FROM perfumes_public WHERE id = v_public_perfume_id)), 'Published');
  RETURN v_public_perfume_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_perfume(
  p_perfume_id UUID,
  p_rejection_note TEXT,
  p_super_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_perfume RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_super_admin_id AND role = 'super_admin') THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  IF p_rejection_note IS NULL OR length(trim(p_rejection_note)) = 0 THEN RAISE EXCEPTION 'Rejection note required'; END IF;

  SELECT * INTO v_perfume FROM perfumes WHERE id = p_perfume_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfume not found'; END IF;
  IF v_perfume.status != 'pending_approval' THEN RAISE EXCEPTION 'Perfume must be in pending_approval status'; END IF;

  UPDATE perfumes SET status = 'rejected', rejection_note = p_rejection_note, rejected_by = p_super_admin_id, rejected_at = NOW() WHERE id = p_perfume_id;
  PERFORM create_audit_log_entry('perfume', p_perfume_id::TEXT, 'rejected', p_super_admin_id, to_jsonb(v_perfume), to_jsonb((SELECT perfumes FROM perfumes WHERE id = p_perfume_id)), p_rejection_note);
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.unpublish_perfume(
  p_perfume_id UUID,
  p_reason TEXT,
  p_super_admin_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_perfume RECORD;
  v_public_perfume RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_super_admin_id AND role = 'super_admin') THEN RAISE EXCEPTION 'Insufficient permissions'; END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN RAISE EXCEPTION 'Reason required'; END IF;

  SELECT * INTO v_perfume FROM perfumes WHERE id = p_perfume_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Perfume not found'; END IF;
  IF v_perfume.status != 'approved' OR v_perfume.public_perfume_id IS NULL THEN RAISE EXCEPTION 'Perfume not currently published'; END IF;

  SELECT * INTO v_public_perfume FROM perfumes_public WHERE id = v_perfume.public_perfume_id;
  DELETE FROM perfumes_public WHERE id = v_perfume.public_perfume_id;
  UPDATE perfumes SET status = 'draft', public_perfume_id = NULL WHERE id = p_perfume_id;

  PERFORM create_audit_log_entry('perfume', p_perfume_id::TEXT, 'unpublished', p_super_admin_id, to_jsonb(v_perfume), to_jsonb((SELECT perfumes FROM perfumes WHERE id = p_perfume_id)), p_reason);
  PERFORM create_audit_log_entry('perfume', v_public_perfume.id::TEXT, 'deleted', p_super_admin_id, to_jsonb(v_public_perfume), NULL, p_reason);
  RETURN TRUE;
END;
$$;

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON FUNCTION public.generate_slug IS 'Generate URL-friendly slug from text';
COMMENT ON FUNCTION public.accept_suggestion_to_review IS 'Move contributor suggestion to perfumes table for review';
COMMENT ON FUNCTION public.reject_suggestion IS 'Reject contributor suggestion with feedback';
COMMENT ON FUNCTION public.approve_and_publish_brand IS 'CRITICAL: Denormalize and copy brand to brands_public';
COMMENT ON FUNCTION public.approve_and_publish_perfume IS 'MOST CRITICAL: Denormalize brand_name, notes, thumbnail and copy to perfumes_public';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
DECLARE
  v_function_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc
  WHERE proname LIKE '%_brand' OR proname LIKE '%_note' OR proname LIKE '%_perfume' OR proname LIKE '%_suggestion%';

  RAISE NOTICE '✅ Workflow functions created successfully';
  RAISE NOTICE '   - Total workflow functions: %', v_function_count;
  RAISE NOTICE '   - Suggestions: accept, reject';
  RAISE NOTICE '   - Brands: submit, approve, reject, unpublish';
  RAISE NOTICE '   - Notes: submit, approve, reject, unpublish';
  RAISE NOTICE '   - Perfumes: submit, approve (with denormalization), reject, unpublish';
END $$;
