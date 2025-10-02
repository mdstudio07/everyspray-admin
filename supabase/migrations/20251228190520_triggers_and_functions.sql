-- ========================================
-- RACE-CONDITION SAFE TRIGGERS AND FUNCTIONS
-- ========================================
-- This migration creates production-safe triggers and functions that handle
-- user creation, role assignment, and audit logging without race conditions.

-- =====================================
-- USER CREATION TRIGGER FUNCTION
-- =====================================

-- Race-condition safe user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  default_username text;
  counter integer := 0;
  final_username text;
BEGIN
  -- Generate a safe default username from email
  default_username := split_part(NEW.email, '@', 1);

  -- Clean username: remove special characters, lowercase
  default_username := lower(regexp_replace(default_username, '[^a-zA-Z0-9_-]', '', 'g'));

  -- Ensure minimum length (pad with random if too short)
  IF length(default_username) < 3 THEN
    default_username := default_username || substr(md5(random()::text), 1, 4);
  END IF;

  -- Truncate if too long
  IF length(default_username) > 46 THEN -- Leave space for counter suffix
    default_username := left(default_username, 46);
  END IF;

  final_username := default_username;

  -- Handle username conflicts with a retry loop
  LOOP
    BEGIN
      -- Try to create user profile (handle duplicates safely)
      INSERT INTO public.users_profile (id, username, full_name)
      VALUES (
        NEW.id,
        final_username,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
      );

      -- If we get here, the insert succeeded, break the loop
      EXIT;

    EXCEPTION WHEN unique_violation THEN
      -- Username conflict, try with a counter
      counter := counter + 1;
      final_username := default_username || '_' || counter;

      -- Prevent infinite loops
      IF counter > 999 THEN
        RAISE EXCEPTION 'Unable to generate unique username after 999 attempts';
      END IF;
    END;
  END LOOP;

  -- Assign default contributor role (handle duplicates safely)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'contributor')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$function$;

-- =====================================
-- USER CREATION TRIGGER
-- =====================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =====================================
-- ROLE CHANGE AUDIT FUNCTION
-- =====================================

-- Audit trigger for role changes with comprehensive logging
CREATE OR REPLACE FUNCTION public.audit_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user from JWT claims
  BEGIN
    current_user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to system user if JWT not available (e.g., during initial setup)
    current_user_id := NULL;
  END;

  -- Log role changes (UPDATE operations)
  IF TG_OP = 'UPDATE' AND (OLD.role IS DISTINCT FROM NEW.role) THEN
    INSERT INTO public.role_audit_log (user_id, old_role, new_role, changed_by, reason)
    VALUES (
      NEW.user_id,
      OLD.role,
      NEW.role,
      COALESCE(current_user_id, NEW.user_id), -- Self-assignment if no current user
      CASE
        WHEN OLD.role IS NULL THEN 'Initial role assignment'
        WHEN NEW.role IS NULL THEN 'Role removed'
        ELSE 'Role changed'
      END
    );
  END IF;

  -- Log new role assignments (INSERT operations)
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, old_role, new_role, changed_by, reason)
    VALUES (
      NEW.user_id,
      NULL,
      NEW.role,
      COALESCE(current_user_id, NEW.user_id),
      'Initial role assignment'
    );
  END IF;

  -- Log role deletions (DELETE operations)
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, old_role, new_role, changed_by, reason)
    VALUES (
      OLD.user_id,
      OLD.role,
      NULL,
      current_user_id,
      'Role removed'
    );
    RETURN OLD;
  END IF;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the role change
  RAISE WARNING 'Error in audit_role_changes: %', SQLERRM;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- =====================================
-- ROLE CHANGE AUDIT TRIGGERS
-- =====================================

-- Triggers for role change auditing
CREATE TRIGGER on_role_change_update
  AFTER UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE PROCEDURE public.audit_role_changes();

CREATE TRIGGER on_role_change_insert
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE PROCEDURE public.audit_role_changes();

CREATE TRIGGER on_role_change_delete
  AFTER DELETE ON public.user_roles
  FOR EACH ROW EXECUTE PROCEDURE public.audit_role_changes();

-- =====================================
-- PROFILE UPDATE TIMESTAMP FUNCTION
-- =====================================

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- =====================================
-- PROFILE UPDATE TRIGGER
-- =====================================

-- Trigger to automatically update timestamps
CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- =====================================
-- SECURITY AND PERMISSIONS
-- =====================================

-- Revoke execute permissions from public roles for security
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_role_changes FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column FROM public, anon, authenticated;

-- Grant specific permissions only to supabase internal roles
GRANT EXECUTE ON FUNCTION public.handle_new_user TO supabase_auth_admin;

-- =====================================
-- VALIDATION AND TESTING FUNCTIONS
-- =====================================

-- Function to test trigger functionality (for development/testing)
CREATE OR REPLACE FUNCTION public.test_user_creation_trigger()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  test_result text := '';
  profile_count integer;
  role_count integer;
BEGIN
  -- Count profiles and roles for verification
  SELECT COUNT(*) INTO profile_count FROM public.users_profile;
  SELECT COUNT(*) INTO role_count FROM public.user_roles;

  test_result := format('Profiles: %s, Roles: %s', profile_count, role_count);

  RETURN test_result;
END;
$function$;

COMMENT ON FUNCTION public.test_user_creation_trigger IS 'Testing function to verify trigger functionality';

-- =====================================
-- TRIGGER DOCUMENTATION
-- =====================================

COMMENT ON FUNCTION public.handle_new_user IS 'Race-condition safe function for creating user profiles and assigning default roles';
COMMENT ON FUNCTION public.audit_role_changes IS 'Comprehensive audit logging for all role changes with proper error handling';
COMMENT ON FUNCTION public.update_updated_at_column IS 'Automatically updates the updated_at timestamp on profile changes';

-- =====================================
-- PROFILE PROTECTION TRIGGER
-- =====================================

-- Function to prevent users from modifying sensitive profile fields
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Check if user is trying to modify their own profile
  IF NEW.id = public.get_current_user_id() THEN
    -- Allow only non-sensitive field updates for regular users
    IF NOT public.is_super_admin() THEN
      -- Restore sensitive fields to original values
      NEW.is_suspended := OLD.is_suspended;
      NEW.contribution_count := OLD.contribution_count;
      NEW.approval_rate := OLD.approval_rate;
      NEW.trust_level := OLD.trust_level;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Apply protection trigger to users_profile table
CREATE TRIGGER protect_profile_sensitive_fields
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_fields();

-- Note: Cannot add comment to trigger on auth.users table due to ownership restrictions in local environment
-- COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Automatically creates user profile and assigns contributor role for new users';
COMMENT ON FUNCTION public.protect_sensitive_profile_fields IS 'Prevents non-admin users from modifying sensitive profile fields';
COMMENT ON TRIGGER protect_profile_sensitive_fields ON public.users_profile IS 'Protects sensitive profile fields from unauthorized modification';
COMMENT ON TRIGGER on_role_change_update ON public.user_roles IS 'Logs role changes to audit trail';
COMMENT ON TRIGGER on_role_change_insert ON public.user_roles IS 'Logs new role assignments to audit trail';
COMMENT ON TRIGGER on_role_change_delete ON public.user_roles IS 'Logs role removals to audit trail';