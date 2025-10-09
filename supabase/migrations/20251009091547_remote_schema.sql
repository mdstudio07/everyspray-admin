drop extension if exists "pg_net";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_user_id uuid;
  v_role text;
  claims jsonb;
BEGIN
  -- ⚡ SECURITY HARDENING: Add statement timeout to prevent login blocking
  SET LOCAL statement_timeout = '1000ms';

  -- Extract user_id from event
  v_user_id := (event->>'user_id')::uuid;

  -- Default claims
  claims := event->'claims';

  -- Fetch user role from user_roles table
  BEGIN
    SELECT role::text INTO v_role
    FROM public.user_roles
    WHERE user_id = v_user_id
    LIMIT 1;

    -- Add role claim to JWT
    IF v_role IS NOT NULL THEN
      claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
    ELSE
      -- Default to contributor if no role found
      claims := jsonb_set(claims, '{user_role}', '"contributor"'::jsonb);
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- On error, default to contributor (never fail auth)
      claims := jsonb_set(claims, '{user_role}', '"contributor"'::jsonb);
  END;

  -- Add security claims
  claims := jsonb_set(claims, '{aal}',
    COALESCE(claims->'aal', (event->'claims'->'aal'), '"aal1"'::jsonb));
  claims := jsonb_set(claims, '{amr}',
    COALESCE(claims->'amr', (event->'claims'->'amr'), '["password"]'::jsonb));

  -- Return updated event
  RETURN jsonb_set(event, '{claims}', claims);
END;
$function$
;


