-- ========================================
-- IMAGES TABLE - SHARED IMAGE STORAGE
-- ========================================
-- This migration creates a centralized images table for storing all image metadata.
-- All images (perfumes, brands, notes) are stored here with references to their entities.
--
-- Key Features:
-- - Shared across all entities (perfumes, brands, notes)
-- - Deduplication support via SHA256 hash
-- - Supabase Storage integration via storage_path and url
-- - Metadata tracking (file size, dimensions, mime type)
-- - User tracking (who uploaded)
-- ========================================

CREATE TABLE public.images (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File information
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL UNIQUE, -- Supabase Storage path (must be unique)
  url TEXT NOT NULL, -- Full public URL for serving
  thumbnail_url TEXT, -- Optional thumbnail URL (resized version)

  -- File metadata
  file_size INTEGER NOT NULL, -- Size in bytes
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  width INTEGER, -- Image width in pixels
  height INTEGER, -- Image height in pixels

  -- Deduplication
  sha256_hash TEXT, -- SHA256 hash for detecting duplicate uploads

  -- Image metadata
  alt_text TEXT, -- Accessibility alt text

  -- Entity tracking (what this image belongs to)
  entity_type TEXT CHECK (entity_type IN ('perfume', 'brand', 'note', 'user_avatar')),
  entity_id UUID, -- ID of the entity (perfume_id, brand_id, note_id, or user_id)

  -- User tracking
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- TABLE CONSTRAINTS
-- =====================================

-- Ensure file size is positive
ALTER TABLE public.images ADD CONSTRAINT images_file_size_positive
CHECK (file_size > 0);

-- Ensure dimensions are positive (if provided)
ALTER TABLE public.images ADD CONSTRAINT images_dimensions_positive
CHECK (
  (width IS NULL OR width > 0) AND
  (height IS NULL OR height > 0)
);

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON TABLE public.images IS 'Centralized image storage for all entities (perfumes, brands, notes, user avatars)';
COMMENT ON COLUMN public.images.storage_path IS 'Unique Supabase Storage path (e.g., perfumes/abc123.webp)';
COMMENT ON COLUMN public.images.url IS 'Full public URL for serving the image';
COMMENT ON COLUMN public.images.thumbnail_url IS 'Optional thumbnail URL (resized/optimized version)';
COMMENT ON COLUMN public.images.sha256_hash IS 'SHA256 hash for deduplication (prevents duplicate uploads)';
COMMENT ON COLUMN public.images.entity_type IS 'Type of entity this image belongs to';
COMMENT ON COLUMN public.images.entity_id IS 'ID of the entity this image belongs to';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'images'
  ) THEN
    RAISE EXCEPTION 'images table not created';
  END IF;

  RAISE NOTICE '✅ Images table created successfully';
  RAISE NOTICE '   - Shared storage for perfumes, brands, notes, user avatars';
  RAISE NOTICE '   - Deduplication support via SHA256 hash';
  RAISE NOTICE '   - Supabase Storage integration';
END $$;
