-- ========================================
-- PERFUMES TABLES (DRAFT + PUBLIC)
-- ========================================
-- This migration creates the perfumes draft and public tables.
--
-- Architecture:
-- - perfumes: Full detailed data (team members edit here)
-- - perfumes_public: Ultra-lightweight for fast searches (denormalized data)
--
-- Workflow:
-- 1. Team member creates perfume in perfumes table (status: draft)
-- 2. Team member submits for approval (status: pending_approval)
-- 3. Super admin approves → data DENORMALIZED and copied to perfumes_public
-- 4. Public users search perfumes_public (blazing fast, no JOINs)
--
-- Key Features:
-- - Denormalization: brand_name, notes (comma-separated), thumbnail all copied
-- - References brands_public and notes_public (not draft tables)
-- - Note arrays: top_note_ids, middle_note_ids, base_note_ids
-- - Suggestion tracking: Links back to contributor_perfume_suggestions
-- ========================================

-- =====================================
-- PERFUMES DRAFT TABLE (Full Data)
-- =====================================

CREATE TABLE public.perfumes (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_perfume_id UUID, -- Links to perfumes_public (set after approval)
  suggestion_id INTEGER REFERENCES public.contributor_perfume_suggestions(id) ON DELETE SET NULL,

  -- Basic information
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly slug (e.g., "bleu-de-chanel")
  description TEXT,

  -- Brand reference (MUST be published brand)
  brand_id UUID NOT NULL REFERENCES public.brands_public(id) ON DELETE RESTRICT,

  -- Perfume details
  launch_year INTEGER,
  perfumer TEXT, -- Nose/perfumer name(s)
  concentration TEXT, -- e.g., "Eau de Parfum", "Eau de Toilette", "Parfum"

  -- Images
  main_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
  additional_image_ids UUID[] DEFAULT '{}', -- Array of additional image UUIDs

  -- Notes (MUST be published notes)
  top_note_ids UUID[] DEFAULT '{}', -- References notes_public.id
  middle_note_ids UUID[] DEFAULT '{}', -- References notes_public.id
  base_note_ids UUID[] DEFAULT '{}', -- References notes_public.id

  -- Performance characteristics
  longevity TEXT, -- e.g., "Long lasting", "Moderate", "Weak"
  sillage TEXT, -- e.g., "Heavy", "Moderate", "Intimate"

  -- Pricing and demographics
  price_range TEXT, -- e.g., "$50-$100", "$100-$200"
  gender TEXT, -- e.g., "Masculine", "Feminine", "Unisex"

  -- Usage context
  season TEXT[] DEFAULT '{}', -- e.g., ["Spring", "Summer"]
  occasion TEXT[] DEFAULT '{}', -- e.g., ["Casual", "Office", "Evening"]

  -- Metadata
  source_url TEXT, -- Reference URL (brand site, Fragrantica, etc.)
  verified_data BOOLEAN DEFAULT false, -- Has data been verified by team

  -- Workflow tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_approval', 'approved', 'rejected', 'archived')
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
-- PERFUMES PUBLIC TABLE (Lightweight - DENORMALIZED)
-- =====================================

CREATE TABLE public.perfumes_public (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE RESTRICT, -- Link to full data

  -- Minimal search fields (ALL DENORMALIZED for speed)
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Must be unique in public table
  brand_name TEXT NOT NULL, -- DENORMALIZED from brands_public
  notes TEXT NOT NULL, -- DENORMALIZED: comma-separated string "Bergamot, Lavender, Ambroxan"
  thumbnail_url TEXT, -- DENORMALIZED from images table

  -- Publishing tracking
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- ADD BIDIRECTIONAL FOREIGN KEY
-- =====================================

-- Add FK from perfumes → perfumes_public (after perfumes_public exists)
ALTER TABLE public.perfumes
ADD CONSTRAINT fk_perfumes_public_perfume_id
FOREIGN KEY (public_perfume_id) REFERENCES public.perfumes_public(id) ON DELETE SET NULL;

-- =====================================
-- TABLE CONSTRAINTS
-- =====================================

-- Ensure launch year is reasonable
ALTER TABLE public.perfumes
ADD CONSTRAINT perfumes_launch_year_valid
CHECK (launch_year IS NULL OR (launch_year >= 1900 AND launch_year <= 2100));

-- Ensure rejection note exists when status is rejected
ALTER TABLE public.perfumes
ADD CONSTRAINT perfumes_rejection_note_required
CHECK (
  (status != 'rejected') OR
  (status = 'rejected' AND rejection_note IS NOT NULL AND length(trim(rejection_note)) > 0)
);

-- Ensure approved_by and approved_at are set when approved
ALTER TABLE public.perfumes
ADD CONSTRAINT perfumes_approved_fields_required
CHECK (
  (status != 'approved') OR
  (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
);

-- Ensure public_perfume_id is set when approved
ALTER TABLE public.perfumes
ADD CONSTRAINT perfumes_public_perfume_id_required
CHECK (
  (status != 'approved') OR
  (status = 'approved' AND public_perfume_id IS NOT NULL)
);

-- =====================================
-- TRIGGER FOR UPDATED_AT
-- =====================================

CREATE OR REPLACE FUNCTION public.update_perfumes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_perfumes_updated_at
  BEFORE UPDATE ON public.perfumes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_perfumes_updated_at();

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON TABLE public.perfumes IS 'Draft perfumes table with full detailed data (team members edit here)';
COMMENT ON TABLE public.perfumes_public IS 'Public perfumes table with DENORMALIZED data for blazing fast searches';
COMMENT ON COLUMN public.perfumes.public_perfume_id IS 'Link to perfumes_public record (set after approval)';
COMMENT ON COLUMN public.perfumes_public.perfume_id IS 'Link back to full perfume data in perfumes table';
COMMENT ON COLUMN public.perfumes.brand_id IS 'MUST reference published brand (brands_public.id)';
COMMENT ON COLUMN public.perfumes.top_note_ids IS 'Array of published note IDs for top notes';
COMMENT ON COLUMN public.perfumes.middle_note_ids IS 'Array of published note IDs for middle/heart notes';
COMMENT ON COLUMN public.perfumes.base_note_ids IS 'Array of published note IDs for base notes';
COMMENT ON COLUMN public.perfumes_public.brand_name IS 'DENORMALIZED brand name for fast search without JOIN';
COMMENT ON COLUMN public.perfumes_public.notes IS 'DENORMALIZED comma-separated note names (e.g., "Bergamot, Lavender, Ambroxan")';
COMMENT ON COLUMN public.perfumes_public.thumbnail_url IS 'DENORMALIZED thumbnail URL for fast display';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'perfumes'
  ) THEN
    RAISE EXCEPTION 'perfumes table not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'perfumes_public'
  ) THEN
    RAISE EXCEPTION 'perfumes_public table not created';
  END IF;

  RAISE NOTICE '✅ Perfumes tables created successfully';
  RAISE NOTICE '   - perfumes: Full detailed data for team members';
  RAISE NOTICE '   - perfumes_public: DENORMALIZED data for fast public searches';
  RAISE NOTICE '   - Bidirectional FK: perfumes ↔ perfumes_public';
  RAISE NOTICE '   - References brands_public and notes_public (published data only)';
END $$;
