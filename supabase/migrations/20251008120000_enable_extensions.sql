-- ========================================
-- ENABLE POSTGRESQL EXTENSIONS
-- ========================================
-- This migration enables required PostgreSQL extensions for the perfume catalog system.
--
-- Extensions:
-- 1. uuid-ossp: Provides UUID generation functions for primary keys
-- 2. pg_trgm: Enables trigram-based text search for fuzzy/partial matching
--
-- Why these extensions:
-- - UUIDs provide better security and distributed system support than SERIAL
-- - Trigrams enable fast LIKE/ILIKE searches without full-text search overhead
-- ========================================

-- Enable UUID generation (for primary keys across all entities)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram search (for fast fuzzy text matching on names, descriptions)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================
-- VALIDATION
-- =====================================

DO $$
BEGIN
  -- Verify uuid-ossp extension
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
  ) THEN
    RAISE EXCEPTION 'uuid-ossp extension not installed';
  END IF;

  -- Verify pg_trgm extension
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm'
  ) THEN
    RAISE EXCEPTION 'pg_trgm extension not installed';
  END IF;

  RAISE NOTICE '✅ PostgreSQL extensions enabled successfully';
  RAISE NOTICE '   - uuid-ossp: UUID generation';
  RAISE NOTICE '   - pg_trgm: Trigram text search';
END $$;
