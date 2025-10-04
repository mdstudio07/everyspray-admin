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
-- FUNCTION: Generate username from email
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_username_from_email(
  p_email TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_username TEXT;
  v_username TEXT;
  v_counter INTEGER := 0;
  v_exists BOOLEAN;
BEGIN
  -- Validate input
  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- Extract the part before @ and clean it
  v_base_username := LOWER(SPLIT_PART(p_email, '@', 1));

  -- Remove any non-alphanumeric characters except underscore
  v_base_username := REGEXP_REPLACE(v_base_username, '[^a-z0-9_]', '', 'g');

  -- Ensure it's at least 3 characters, pad with random suffix if needed
  IF LENGTH(v_base_username) < 3 THEN
    v_base_username := v_base_username || FLOOR(RANDOM() * 1000)::TEXT;
  END IF;

  -- Truncate to max 20 characters
  v_base_username := SUBSTRING(v_base_username, 1, 20);

  -- Try the base username first
  v_username := v_base_username;

  -- If it exists, append numbers until we find an available one
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM users_profile
      WHERE LOWER(username) = LOWER(v_username)
    ) INTO v_exists;

    EXIT WHEN NOT v_exists;

    v_counter := v_counter + 1;
    v_username := SUBSTRING(v_base_username, 1, 20 - LENGTH(v_counter::TEXT)) || v_counter::TEXT;

    -- Safety limit to prevent infinite loops
    IF v_counter > 9999 THEN
      -- Add random suffix if we've tried too many combinations
      v_username := SUBSTRING(v_base_username, 1, 15) || FLOOR(RANDOM() * 10000)::TEXT;
      EXIT;
    END IF;
  END LOOP;

  RETURN v_username;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.generate_username_from_email(TEXT) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION public.generate_username_from_email IS
'Generates a unique username from an email address. Ensures uniqueness by appending numbers if needed.';

-- =====================================================
-- TESTING QUERIES (Run these to verify functions work)
-- =====================================================

-- Test email exists check (should return true for existing demo users)
-- SELECT check_email_exists('admin@everyspray.com');

-- Test username exists check (should return true for existing demo users)
-- SELECT check_username_exists('admin');

-- Test username generation
-- SELECT generate_username_from_email('john.doe@example.com');
-- SELECT generate_username_from_email('test@gmail.com');
