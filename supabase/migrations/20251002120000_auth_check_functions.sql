-- =====================================================
-- AUTH CHECK FUNCTIONS FOR EMAIL & USERNAME VALIDATION
-- =====================================================
-- These functions provide secure checks without exposing RLS
-- They are called through API endpoints with rate limiting

-- =====================================================
-- FUNCTION: Check if email exists
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_email_exists(
  p_email TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Validate input
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Check if email exists in auth.users table (case-insensitive)
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE LOWER(email) = LOWER(p_email)
  ) INTO v_exists;

  RETURN v_exists;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.check_email_exists IS
'Securely checks if an email address is already registered. Returns true if exists, false otherwise.';

-- =====================================================
-- FUNCTION: Check if username exists
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_username_exists(
  p_username TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Validate input
  IF p_username IS NULL OR p_username = '' THEN
    RAISE EXCEPTION 'Username is required';
  END IF;

  -- Validate username format (3-20 chars, alphanumeric + underscore)
  IF NOT p_username ~ '^[a-zA-Z0-9_]{3,20}$' THEN
    RAISE EXCEPTION 'Invalid username format';
  END IF;

  -- Check if username exists in users_profile table (case-insensitive)
  SELECT EXISTS (
    SELECT 1
    FROM users_profile
    WHERE LOWER(username) = LOWER(p_username)
  ) INTO v_exists;

  RETURN v_exists;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_username_exists(TEXT) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.check_username_exists IS
'Securely checks if a username is already taken. Returns true if exists, false otherwise.';

-- =====================================================
-- TESTING QUERIES (Run these to verify functions work)
-- =====================================================

-- Test email exists check (should return true for existing demo users)
-- SELECT check_email_exists('admin@everyspray.com');

-- Test username exists check (should return true for existing demo users)
-- SELECT check_username_exists('admin');
