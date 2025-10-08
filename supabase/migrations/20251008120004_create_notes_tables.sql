-- ========================================
-- NOTES TABLES (DRAFT + PUBLIC)
-- ========================================
-- This migration creates the notes draft and public tables.
--
-- Architecture:
-- - notes: Full detailed data (team members edit here)
-- - notes_public: Ultra-lightweight for fast searches (name, slug, thumbnail only)
--
-- Workflow:
-- 1. Team member creates note in notes table (status: draft)
-- 2. Team member submits for approval (status: pending_approval)
-- 3. Super admin approves → data copied to notes_public (status: approved)
-- 4. Public users search notes_public (blazing fast, no JOINs)
--
-- Key Features:
-- - Denormalization: note_name copied to notes_public
-- - Bi-directional FK: notes ↔ notes_public
-- - Slug uniqueness in public table only
-- - Categories and subcategories for organization
-- ========================================

-- =====================================
-- NOTES DRAFT TABLE (Full Data)
-- =====================================

CREATE TABLE public.notes (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_note_id UUID, -- Links to notes_public (set after approval)

  -- Basic information
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly slug (e.g., "bergamot", "vanilla-bourbon")
  description TEXT,

  -- Categorization
  category TEXT, -- Main category (e.g., "Citrus", "Floral", "Woody", "Spicy")
  subcategory TEXT, -- Subcategory for finer detail (e.g., "Fresh Citrus", "White Floral")

  -- Image
  image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,

  -- Additional information
  origin TEXT, -- Where this note typically comes from (e.g., "Mediterranean", "India")
  characteristics TEXT[] DEFAULT '{}', -- Array of characteristics (e.g., ["fresh", "sweet", "citrusy"])

  -- Workflow tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_approval', 'approved', 'rejected')
  ),

  -- User tracking
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Rejection feedback
  rejection_note TEXT,

  -- Timestamps
  rejected_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- NOTES PUBLIC TABLE (Lightweight)
-- =====================================

CREATE TABLE public.notes_public (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE RESTRICT, -- Link to full data

  -- Minimal search fields (DENORMALIZED for speed)
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Must be unique in public table
  thumbnail_url TEXT, -- Denormalized from images table

  -- Publishing tracking
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- ADD BIDIRECTIONAL FOREIGN KEY
-- =====================================

-- Add FK from notes → notes_public (after notes_public exists)
ALTER TABLE public.notes
ADD CONSTRAINT fk_notes_public_note_id
FOREIGN KEY (public_note_id) REFERENCES public.notes_public(id) ON DELETE SET NULL;

-- =====================================
-- TABLE CONSTRAINTS
-- =====================================

-- Ensure rejection note exists when status is rejected
ALTER TABLE public.notes
ADD CONSTRAINT notes_rejection_note_required
CHECK (
  (status != 'rejected') OR
  (status = 'rejected' AND rejection_note IS NOT NULL AND length(trim(rejection_note)) > 0)
);

-- Ensure approved_by and approved_at are set when approved
ALTER TABLE public.notes
ADD CONSTRAINT notes_approved_fields_required
CHECK (
  (status != 'approved') OR
  (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
);

-- Ensure public_note_id is set when approved
ALTER TABLE public.notes
ADD CONSTRAINT notes_public_note_id_required
CHECK (
  (status != 'approved') OR
  (status = 'approved' AND public_note_id IS NOT NULL)
);

-- =====================================
-- TRIGGER FOR UPDATED_AT
-- =====================================

CREATE OR REPLACE FUNCTION public.update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notes_updated_at();

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON TABLE public.notes IS 'Draft notes table with full detailed data (team members edit here)';
COMMENT ON TABLE public.notes_public IS 'Public notes table with lightweight data for fast searches';
COMMENT ON COLUMN public.notes.public_note_id IS 'Link to notes_public record (set after approval)';
COMMENT ON COLUMN public.notes_public.note_id IS 'Link back to full note data in notes table';
COMMENT ON COLUMN public.notes.slug IS 'URL-friendly slug (not unique in draft, unique in public)';
COMMENT ON COLUMN public.notes_public.slug IS 'URL-friendly slug (UNIQUE in public table for direct lookups)';
COMMENT ON COLUMN public.notes.category IS 'Main category (e.g., Citrus, Floral, Woody, Spicy)';
COMMENT ON COLUMN public.notes.subcategory IS 'Subcategory for finer detail (e.g., Fresh Citrus, White Floral)';
COMMENT ON COLUMN public.notes.characteristics IS 'Array of characteristics (e.g., ["fresh", "sweet", "citrusy"])';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notes'
  ) THEN
    RAISE EXCEPTION 'notes table not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notes_public'
  ) THEN
    RAISE EXCEPTION 'notes_public table not created';
  END IF;

  RAISE NOTICE '✅ Notes tables created successfully';
  RAISE NOTICE '   - notes: Full detailed data for team members';
  RAISE NOTICE '   - notes_public: Lightweight data for fast public searches';
  RAISE NOTICE '   - Bidirectional FK: notes ↔ notes_public';
  RAISE NOTICE '   - Categories and characteristics support';
END $$;
