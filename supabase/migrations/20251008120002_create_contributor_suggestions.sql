-- ========================================
-- CONTRIBUTOR SUGGESTIONS TABLE
-- ========================================
-- This migration creates the contributor_perfume_suggestions table.
-- This is the ONLY table that contributors can write to directly.
--
-- Workflow:
-- 1. Contributor submits suggestion (status: pending)
-- 2. Team member reviews and accepts/rejects
-- 3. If accepted, moved to perfumes table for detailed editing
-- 4. If rejected, contributor gets feedback via rejection_note
--
-- Key Features:
-- - Simple form for contributors (minimal friction)
-- - Workflow tracking (assigned team member, processor)
-- - Complete audit trail (who, when, why)
-- - Status-based processing (pending → in_review → accepted/rejected)
-- ========================================

CREATE TABLE public.contributor_perfume_suggestions (
  -- Primary identification (uses SERIAL for internal-only table)
  id SERIAL PRIMARY KEY,

  -- Basic perfume information (from contributor)
  perfume_name TEXT NOT NULL,
  brand_name TEXT,
  estimated_launch_year INTEGER,
  rough_notes TEXT, -- Rough description of notes (e.g., "floral, woody, citrus")
  contributor_notes TEXT, -- Any additional notes or comments from contributor
  reference_url TEXT, -- Optional URL reference (e.g., brand website, Fragrantica)

  -- Workflow tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_review', 'accepted', 'rejected')
  ),

  -- User references
  contributor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Who submitted
  assigned_to_team_member UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who is reviewing
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who accepted/rejected

  -- Rejection feedback
  rejection_note TEXT, -- Why was this rejected (visible to contributor)

  -- Timestamps
  processed_at TIMESTAMP WITH TIME ZONE, -- When was it accepted/rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- TABLE CONSTRAINTS
-- =====================================

-- Ensure launch year is reasonable (1900-2100)
ALTER TABLE public.contributor_perfume_suggestions
ADD CONSTRAINT suggestions_launch_year_valid
CHECK (estimated_launch_year IS NULL OR (estimated_launch_year >= 1900 AND estimated_launch_year <= 2100));

-- Ensure rejection note exists when status is rejected
ALTER TABLE public.contributor_perfume_suggestions
ADD CONSTRAINT suggestions_rejection_note_required
CHECK (
  (status != 'rejected') OR
  (status = 'rejected' AND rejection_note IS NOT NULL AND length(trim(rejection_note)) > 0)
);

-- Ensure processed_by and processed_at are set when status is accepted/rejected
ALTER TABLE public.contributor_perfume_suggestions
ADD CONSTRAINT suggestions_processed_fields_required
CHECK (
  (status NOT IN ('accepted', 'rejected')) OR
  (status IN ('accepted', 'rejected') AND processed_by IS NOT NULL AND processed_at IS NOT NULL)
);

-- =====================================
-- TRIGGER FOR UPDATED_AT
-- =====================================

CREATE OR REPLACE FUNCTION public.update_contributor_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contributor_suggestions_updated_at
  BEFORE UPDATE ON public.contributor_perfume_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contributor_suggestions_updated_at();

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON TABLE public.contributor_perfume_suggestions IS 'Perfume suggestions submitted by contributors (write-only for contributors)';
COMMENT ON COLUMN public.contributor_perfume_suggestions.status IS 'Workflow status: pending → in_review → accepted/rejected';
COMMENT ON COLUMN public.contributor_perfume_suggestions.rough_notes IS 'Rough note description from contributor (e.g., "citrus, woody, fresh")';
COMMENT ON COLUMN public.contributor_perfume_suggestions.contributor_notes IS 'Additional comments or context from contributor';
COMMENT ON COLUMN public.contributor_perfume_suggestions.reference_url IS 'Optional URL reference (brand site, Fragrantica, etc.)';
COMMENT ON COLUMN public.contributor_perfume_suggestions.rejection_note IS 'Feedback for contributor explaining why suggestion was rejected';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contributor_perfume_suggestions'
  ) THEN
    RAISE EXCEPTION 'contributor_perfume_suggestions table not created';
  END IF;

  RAISE NOTICE '✅ Contributor suggestions table created successfully';
  RAISE NOTICE '   - Simple submission form for contributors';
  RAISE NOTICE '   - Workflow tracking (pending → in_review → accepted/rejected)';
  RAISE NOTICE '   - Complete audit trail with rejection feedback';
END $$;
