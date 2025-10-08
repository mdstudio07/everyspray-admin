-- ========================================
-- BRANDS TABLES (DRAFT + PUBLIC)
-- ========================================
-- This migration creates the brands draft and public tables.
--
-- Architecture:
-- - brands: Full detailed data (team members edit here)
-- - brands_public: Ultra-lightweight for fast searches (name, slug, thumbnail only)
--
-- Workflow:
-- 1. Team member creates brand in brands table (status: draft)
-- 2. Team member submits for approval (status: pending_approval)
-- 3. Super admin approves → data copied to brands_public (status: approved)
-- 4. Public users search brands_public (blazing fast, no JOINs)
--
-- Key Features:
-- - Denormalization: brand_name copied to brands_public
-- - Bi-directional FK: brands ↔ brands_public
-- - Slug uniqueness in public table only
-- ========================================

-- =====================================
-- BRANDS DRAFT TABLE (Full Data)
-- =====================================

CREATE TABLE public.brands (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  public_brand_id UUID, -- Links to brands_public (set after approval)

  -- Basic information
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- URL-friendly slug (e.g., "chanel", "tom-ford")
  description TEXT,

  -- Brand details
  country TEXT, -- Country of origin
  founded_year INTEGER, -- Year brand was founded
  founder TEXT, -- Founder name(s)

  -- Images
  logo_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,
  cover_image_id UUID REFERENCES public.images(id) ON DELETE SET NULL,

  -- Links
  website_url TEXT,
  instagram_url TEXT,
  wikipedia_url TEXT,

  -- Additional information
  story TEXT, -- Brand story/history
  specialty TEXT, -- What the brand is known for

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
-- BRANDS PUBLIC TABLE (Lightweight)
-- =====================================

CREATE TABLE public.brands_public (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE RESTRICT, -- Link to full data

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

-- Add FK from brands → brands_public (after brands_public exists)
ALTER TABLE public.brands
ADD CONSTRAINT fk_brands_public_brand_id
FOREIGN KEY (public_brand_id) REFERENCES public.brands_public(id) ON DELETE SET NULL;

-- =====================================
-- TABLE CONSTRAINTS
-- =====================================

-- Ensure founded year is reasonable
ALTER TABLE public.brands
ADD CONSTRAINT brands_founded_year_valid
CHECK (founded_year IS NULL OR (founded_year >= 1700 AND founded_year <= 2100));

-- Ensure rejection note exists when status is rejected
ALTER TABLE public.brands
ADD CONSTRAINT brands_rejection_note_required
CHECK (
  (status != 'rejected') OR
  (status = 'rejected' AND rejection_note IS NOT NULL AND length(trim(rejection_note)) > 0)
);

-- Ensure approved_by and approved_at are set when approved
ALTER TABLE public.brands
ADD CONSTRAINT brands_approved_fields_required
CHECK (
  (status != 'approved') OR
  (status = 'approved' AND approved_by IS NOT NULL AND approved_at IS NOT NULL)
);

-- Ensure public_brand_id is set when approved
ALTER TABLE public.brands
ADD CONSTRAINT brands_public_brand_id_required
CHECK (
  (status != 'approved') OR
  (status = 'approved' AND public_brand_id IS NOT NULL)
);

-- =====================================
-- TRIGGER FOR UPDATED_AT
-- =====================================

CREATE OR REPLACE FUNCTION public.update_brands_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.update_brands_updated_at();

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON TABLE public.brands IS 'Draft brands table with full detailed data (team members edit here)';
COMMENT ON TABLE public.brands_public IS 'Public brands table with lightweight data for fast searches';
COMMENT ON COLUMN public.brands.public_brand_id IS 'Link to brands_public record (set after approval)';
COMMENT ON COLUMN public.brands_public.brand_id IS 'Link back to full brand data in brands table';
COMMENT ON COLUMN public.brands.slug IS 'URL-friendly slug (not unique in draft, unique in public)';
COMMENT ON COLUMN public.brands_public.slug IS 'URL-friendly slug (UNIQUE in public table for direct lookups)';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brands'
  ) THEN
    RAISE EXCEPTION 'brands table not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'brands_public'
  ) THEN
    RAISE EXCEPTION 'brands_public table not created';
  END IF;

  RAISE NOTICE '✅ Brands tables created successfully';
  RAISE NOTICE '   - brands: Full detailed data for team members';
  RAISE NOTICE '   - brands_public: Lightweight data for fast public searches';
  RAISE NOTICE '   - Bidirectional FK: brands ↔ brands_public';
END $$;
