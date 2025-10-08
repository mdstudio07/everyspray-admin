-- ========================================
-- AUDIT LOG TABLE
-- ========================================
-- This migration creates a comprehensive audit log table for tracking ALL changes
-- across all entities in the perfume catalog system.
--
-- Purpose:
-- - Track creation, updates, approvals, rejections, publishing, unpublishing
-- - Store complete before/after snapshots as JSONB for full traceability
-- - Required for compliance, debugging, and rollback capabilities
--
-- Key Features:
-- - BIGSERIAL primary key (this table will grow VERY large)
-- - Entity tracking: perfume, brand, note, suggestion, image
-- - Action tracking: created, updated, approved, rejected, published, unpublished, reverted
-- - Complete data snapshots: before_data and after_data as JSONB
-- - User tracking: who performed the action
-- - Reason tracking: why the action was taken (required for rejections)
-- ========================================

CREATE TABLE public.audit_log (
  -- Primary identification (BIGSERIAL for high volume)
  id BIGSERIAL PRIMARY KEY,

  -- Entity identification
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('perfume', 'brand', 'note', 'suggestion', 'image', 'user_profile')
  ),
  entity_id TEXT NOT NULL, -- TEXT to handle both INTEGER (suggestions) and UUID (everything else)

  -- Action tracking
  action TEXT NOT NULL CHECK (
    action IN (
      'created',
      'updated',
      'approved',
      'rejected',
      'published',
      'unpublished',
      'reverted',
      'deleted',
      'restored'
    )
  ),

  -- User tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who performed the action

  -- Data snapshots (complete before/after state)
  before_data JSONB, -- State before the action (NULL for creation)
  after_data JSONB, -- State after the action (NULL for deletion)

  -- Contextual information
  reason TEXT, -- Why this action was taken (required for rejections, unpublish)
  metadata JSONB, -- Additional context (e.g., IP address, user agent, request ID)

  -- Timestamp (immutable - cannot be updated)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================
-- TABLE CONSTRAINTS
-- =====================================

-- Ensure reason exists for certain actions
ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_reason_required
CHECK (
  (action NOT IN ('rejected', 'unpublished', 'deleted')) OR
  (action IN ('rejected', 'unpublished', 'deleted') AND reason IS NOT NULL AND length(trim(reason)) > 0)
);

-- Ensure before_data is NULL for creation
ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_before_data_null_on_create
CHECK (
  (action != 'created') OR
  (action = 'created' AND before_data IS NULL)
);

-- Ensure after_data is NULL for deletion
ALTER TABLE public.audit_log
ADD CONSTRAINT audit_log_after_data_null_on_delete
CHECK (
  (action != 'deleted') OR
  (action = 'deleted' AND after_data IS NULL)
);

-- =====================================
-- IMMUTABILITY: PREVENT UPDATES/DELETES
-- =====================================

-- Audit logs should NEVER be updated (append-only)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log entries are immutable and cannot be modified';
END;
$$ LANGUAGE plpgsql;

-- Prevent UPDATE operations
CREATE TRIGGER trigger_prevent_audit_log_update
  BEFORE UPDATE ON public.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- Prevent DELETE operations (only super admins via explicit DROP can delete)
CREATE TRIGGER trigger_prevent_audit_log_delete
  BEFORE DELETE ON public.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_modification();

-- =====================================
-- HELPER FUNCTION: CREATE AUDIT LOG ENTRY
-- =====================================

CREATE OR REPLACE FUNCTION public.create_audit_log_entry(
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_action TEXT,
  p_user_id UUID,
  p_before_data JSONB DEFAULT NULL,
  p_after_data JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_audit_id BIGINT;
BEGIN
  -- Insert audit log entry
  INSERT INTO public.audit_log (
    entity_type,
    entity_id,
    action,
    user_id,
    before_data,
    after_data,
    reason,
    metadata
  ) VALUES (
    p_entity_type,
    p_entity_id,
    p_action,
    p_user_id,
    p_before_data,
    p_after_data,
    p_reason,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- =====================================
-- COMMENTS AND DOCUMENTATION
-- =====================================

COMMENT ON TABLE public.audit_log IS 'Complete audit trail for all changes across all entities (append-only)';
COMMENT ON COLUMN public.audit_log.entity_type IS 'Type of entity: perfume, brand, note, suggestion, image, user_profile';
COMMENT ON COLUMN public.audit_log.entity_id IS 'ID of the entity (TEXT to handle both SERIAL and UUID)';
COMMENT ON COLUMN public.audit_log.action IS 'Action performed: created, updated, approved, rejected, published, etc.';
COMMENT ON COLUMN public.audit_log.before_data IS 'Complete state before the action (NULL for creation)';
COMMENT ON COLUMN public.audit_log.after_data IS 'Complete state after the action (NULL for deletion)';
COMMENT ON COLUMN public.audit_log.reason IS 'Why this action was taken (required for rejections, unpublish, deletion)';
COMMENT ON COLUMN public.audit_log.metadata IS 'Additional context (IP address, user agent, request ID, etc.)';
COMMENT ON FUNCTION public.create_audit_log_entry IS 'Helper function to create audit log entries securely';

-- =====================================
-- VALIDATION
-- =====================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_log'
  ) THEN
    RAISE EXCEPTION 'audit_log table not created';
  END IF;

  RAISE NOTICE '✅ Audit log table created successfully';
  RAISE NOTICE '   - Tracks all changes across all entities';
  RAISE NOTICE '   - Complete before/after data snapshots (JSONB)';
  RAISE NOTICE '   - Immutable (append-only, no updates/deletes)';
  RAISE NOTICE '   - Helper function: create_audit_log_entry()';
END $$;
