# Configure Custom Access Token Hook in Supabase

## Problem
When logging in, you get this error:
```
code: "unexpected_failure"
message: "Error running hook URI: pg-functions://postgres/public/custom_access_token_hook"
```

This can mean TWO things:
1. ❌ The auth hook exists but **is not configured in Supabase Dashboard**
2. ❌ The hook function has a **PostgreSQL compatibility issue** (STABLE vs VOLATILE)

**Both issues are now fixed in the latest migrations!**

---

## Solution: Configure in Supabase Dashboard

### Step 1: Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **EverySpray Admin**
3. Navigate to **Authentication** → **Hooks** (left sidebar)

### Step 2: Enable Custom Access Token Hook
1. Find the **"Custom Access Token"** section
2. Click **"Enable Hook"** or **"Add a new hook"**
3. Configure the hook:
   - **Hook Type**: Custom Access Token
   - **Method**: Postgres Function
   - **Schema**: `public`
   - **Function**: `custom_access_token_hook`
   - **Enabled**: ✅ Toggle ON

### Step 3: Verify Configuration
After enabling, you should see:
```
Hook URI: pg-functions://postgres/public/custom_access_token_hook
Status: Enabled ✅
```

### Step 4: Test Login
1. Try logging in with: `admin@everyspray.com` / `admin123`
2. The hook should now execute successfully
3. JWT token will contain the `user_role` claim

---

## What the Hook Does

The `custom_access_token_hook()` function:
1. Runs **during token generation** (on login/refresh)
2. Fetches the user's role from `user_roles` table
3. Adds `user_role` claim to the JWT token
4. Used by middleware for role-based access control

### Example JWT Token (After Hook):
```json
{
  "sub": "user-uuid-here",
  "email": "admin@everyspray.com",
  "user_role": "super_admin",  ← Added by hook
  "aal": "aal1",
  "amr": ["password"]
}
```

---

## Troubleshooting

### If Hook Still Doesn't Work:

#### Check 1: Verify Function Exists
Run this in Supabase SQL Editor:
```sql
SELECT * FROM pg_proc
WHERE proname = 'custom_access_token_hook';
```

**Expected**: Should return 1 row

#### Check 2: Test Function Manually
```sql
SELECT custom_access_token_hook(
  '{"user_id": "test-uuid", "claims": {}}'::jsonb
);
```

**Expected**: Should return JSON with `user_role` claim

#### Check 3: Check Function Permissions
```sql
SELECT proname, proowner, prosecdef
FROM pg_proc
WHERE proname = 'custom_access_token_hook';
```

**Expected**:
- `prosecdef`: `true` (SECURITY DEFINER)
- `proowner`: Should be postgres or supabase_admin

#### Check 4: Verify Hook is Enabled
In Supabase Dashboard → Authentication → Hooks:
- Custom Access Token hook should show **"Enabled"**
- Hook URI should be: `pg-functions://postgres/public/custom_access_token_hook`

---

## Local Development

For **local development** (Supabase local), the hook is automatically active because it's in your migrations. No configuration needed locally.

For **production/staging**, you **must configure it in the Supabase Dashboard**.

---

## Migration File Reference

The hook is created in:
- **File**: `supabase/migrations/20251002120004_auth_hook.sql`
- **Updated in**: `supabase/migrations/20251008150000_security_hardening.sql` (added timeout)

---

## Security Notes

✅ **Safe to enable** because:
1. Function uses `SECURITY DEFINER` with explicit `search_path`
2. Has 1000ms statement timeout (prevents hanging)
3. Never fails authentication (defaults to 'contributor' on error)
4. Only reads from `user_roles` table (no modifications)
5. No sensitive data exposed

---

## Contact Support

If you still have issues after enabling the hook:
1. Check Supabase project logs: Dashboard → Logs
2. Look for errors related to `custom_access_token_hook`
3. Contact Supabase support with project ID

---

**Last Updated**: 2025-10-09
