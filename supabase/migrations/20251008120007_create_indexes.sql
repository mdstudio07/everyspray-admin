-- ========================================
-- PERFORMANCE INDEXES
-- ========================================
-- This migration creates all performance indexes for fast searches and queries.
--
-- Index Types:
-- - B-tree indexes: Standard indexes for exact lookups, foreign keys, status filtering
-- - GIN trigram indexes: Fast LIKE/ILIKE searches (fuzzy text matching)
-- - Composite indexes: Multi-column indexes for common query patterns
--
-- Priority:
-- - CRITICAL: Public tables (queried by end users constantly)
-- - IMPORTANT: Draft tables (queried by team members frequently)
-- - USEFUL: Audit log and suggestions (less frequent queries)
-- ========================================

-- =====================================
-- IMAGES TABLE INDEXES
-- =====================================

-- Hash-based deduplication
CREATE INDEX idx_images_hash
ON public.images(sha256_hash)
WHERE sha256_hash IS NOT NULL;

-- Entity tracking (which entity does this image belong to)
CREATE INDEX idx_images_entity
ON public.images(entity_type, entity_id);

-- User tracking (who uploaded)
CREATE INDEX idx_images_uploaded_by
ON public.images(uploaded_by);

-- Recent uploads
CREATE INDEX idx_images_created
ON public.images(created_at DESC);

-- =====================================
-- CONTRIBUTOR SUGGESTIONS INDEXES
-- =====================================

-- Status filtering (pending, in_review, accepted, rejected)
CREATE INDEX idx_contrib_status
ON public.contributor_perfume_suggestions(status);

-- Contributor's suggestions
CREATE INDEX idx_contrib_contributor
ON public.contributor_perfume_suggestions(contributor_id);

-- Assigned team member's queue
CREATE INDEX idx_contrib_assigned
ON public.contributor_perfume_suggestions(assigned_to_team_member);

-- Recent suggestions
CREATE INDEX idx_contrib_created
ON public.contributor_perfume_suggestions(created_at DESC);

-- Composite: Status + assigned team member (common filter)
CREATE INDEX idx_contrib_status_assigned
ON public.contributor_perfume_suggestions(status, assigned_to_team_member);

-- =====================================
-- BRANDS DRAFT TABLE INDEXES
-- =====================================

-- Status filtering
CREATE INDEX idx_brands_status
ON public.brands(status);

-- Creator's drafts
CREATE INDEX idx_brands_created_by
ON public.brands(created_by);

-- Slug lookup
CREATE INDEX idx_brands_slug
ON public.brands(slug);

-- Fuzzy name search (CRITICAL for search UX)
CREATE INDEX idx_brands_name_trgm
ON public.brands USING gin(name gin_trgm_ops);

-- Country filtering
CREATE INDEX idx_brands_country
ON public.brands(country)
WHERE country IS NOT NULL;

-- =====================================
-- BRANDS PUBLIC TABLE INDEXES (CRITICAL)
-- =====================================

-- Unique slug for direct lookups
CREATE UNIQUE INDEX idx_brands_public_slug
ON public.brands_public(slug);

-- Fuzzy name search (MOST CRITICAL - public users search by name)
CREATE INDEX idx_brands_public_name_trgm
ON public.brands_public USING gin(name gin_trgm_ops);

-- Recently published
CREATE INDEX idx_brands_public_published
ON public.brands_public(published_at DESC);

-- Link back to draft
CREATE INDEX idx_brands_public_brand_id
ON public.brands_public(brand_id);

-- =====================================
-- NOTES DRAFT TABLE INDEXES
-- =====================================

-- Status filtering
CREATE INDEX idx_notes_status
ON public.notes(status);

-- Creator's drafts
CREATE INDEX idx_notes_created_by
ON public.notes(created_by);

-- Slug lookup
CREATE INDEX idx_notes_slug
ON public.notes(slug);

-- Category filtering
CREATE INDEX idx_notes_category
ON public.notes(category)
WHERE category IS NOT NULL;

-- Subcategory filtering
CREATE INDEX idx_notes_subcategory
ON public.notes(subcategory)
WHERE subcategory IS NOT NULL;

-- Fuzzy name search
CREATE INDEX idx_notes_name_trgm
ON public.notes USING gin(name gin_trgm_ops);

-- =====================================
-- NOTES PUBLIC TABLE INDEXES (CRITICAL)
-- =====================================

-- Unique slug for direct lookups
CREATE UNIQUE INDEX idx_notes_public_slug
ON public.notes_public(slug);

-- Fuzzy name search (CRITICAL - public users search by note name)
CREATE INDEX idx_notes_public_name_trgm
ON public.notes_public USING gin(name gin_trgm_ops);

-- Recently published
CREATE INDEX idx_notes_public_published
ON public.notes_public(published_at DESC);

-- Link back to draft
CREATE INDEX idx_notes_public_note_id
ON public.notes_public(note_id);

-- =====================================
-- PERFUMES DRAFT TABLE INDEXES
-- =====================================

-- Status filtering
CREATE INDEX idx_perfumes_status
ON public.perfumes(status);

-- Creator's drafts
CREATE INDEX idx_perfumes_created_by
ON public.perfumes(created_by);

-- Brand filtering
CREATE INDEX idx_perfumes_brand
ON public.perfumes(brand_id);

-- Slug lookup
CREATE INDEX idx_perfumes_slug
ON public.perfumes(slug);

-- Suggestion tracking
CREATE INDEX idx_perfumes_suggestion
ON public.perfumes(suggestion_id)
WHERE suggestion_id IS NOT NULL;

-- Fuzzy name search
CREATE INDEX idx_perfumes_name_trgm
ON public.perfumes USING gin(name gin_trgm_ops);

-- Launch year filtering
CREATE INDEX idx_perfumes_launch_year
ON public.perfumes(launch_year)
WHERE launch_year IS NOT NULL;

-- Gender filtering
CREATE INDEX idx_perfumes_gender
ON public.perfumes(gender)
WHERE gender IS NOT NULL;

-- =====================================
-- PERFUMES PUBLIC TABLE INDEXES (MOST CRITICAL)
-- =====================================

-- Unique slug for direct lookups
CREATE UNIQUE INDEX idx_perfumes_public_slug
ON public.perfumes_public(slug);

-- Fuzzy name search (MOST CRITICAL - primary search method)
CREATE INDEX idx_perfumes_public_name_trgm
ON public.perfumes_public USING gin(name gin_trgm_ops);

-- Brand filtering (e.g., "Show all Chanel perfumes")
CREATE INDEX idx_perfumes_public_brand_name
ON public.perfumes_public(brand_name);

-- Notes search (e.g., "Find perfumes with Bergamot")
CREATE INDEX idx_perfumes_public_notes_trgm
ON public.perfumes_public USING gin(notes gin_trgm_ops);

-- Recently published
CREATE INDEX idx_perfumes_public_published
ON public.perfumes_public(published_at DESC);

-- Link back to draft
CREATE INDEX idx_perfumes_public_perfume_id
ON public.perfumes_public(perfume_id);

-- Composite: Brand + name (common query pattern)
CREATE INDEX idx_perfumes_public_brand_name_lookup
ON public.perfumes_public(brand_name, name);

-- =====================================
-- AUDIT LOG INDEXES
-- =====================================

-- Entity lookup (get all changes for a specific entity)
CREATE INDEX idx_audit_entity
ON public.audit_log(entity_type, entity_id);

-- User activity (who made changes)
CREATE INDEX idx_audit_user
ON public.audit_log(user_id);

-- Action type filtering
CREATE INDEX idx_audit_action
ON public.audit_log(action);

-- Recent activity
CREATE INDEX idx_audit_created
ON public.audit_log(created_at DESC);

-- Composite: Entity + time (common pattern)
CREATE INDEX idx_audit_entity_created
ON public.audit_log(entity_type, entity_id, created_at DESC);

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON INDEX idx_images_hash IS 'Fast duplicate detection via SHA256 hash';
COMMENT ON INDEX idx_brands_name_trgm IS 'Trigram index for fuzzy brand name search';
COMMENT ON INDEX idx_brands_public_name_trgm IS 'CRITICAL: Public brand name search';
COMMENT ON INDEX idx_notes_public_name_trgm IS 'CRITICAL: Public note name search';
COMMENT ON INDEX idx_perfumes_public_name_trgm IS 'MOST CRITICAL: Primary perfume search method';
COMMENT ON INDEX idx_perfumes_public_notes_trgm IS 'CRITICAL: Search perfumes by note names';
COMMENT ON INDEX idx_perfumes_public_brand_name_lookup IS 'Composite index for brand + perfume name queries';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
DECLARE
  v_index_count INTEGER;
BEGIN
  -- Count total indexes created
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

  IF v_index_count < 40 THEN
    RAISE WARNING 'Expected at least 40 indexes, found %', v_index_count;
  END IF;

  RAISE NOTICE '✅ Performance indexes created successfully';
  RAISE NOTICE '   - Total indexes: %', v_index_count;
  RAISE NOTICE '   - B-tree indexes: Status, FK, slug lookups';
  RAISE NOTICE '   - GIN trigram indexes: Fuzzy text search';
  RAISE NOTICE '   - Composite indexes: Common query patterns';
  RAISE NOTICE '   - Public table indexes: CRITICAL for end-user performance';
END $$;
