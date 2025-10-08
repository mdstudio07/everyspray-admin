# 📊 Complete Supabase Database Documentation

**Project**: EverySpray Admin Platform
**Total Migration Files**: 8 (Optimized & Cleaned)
**Last Updated**: 2025-10-08
**Status**: Production-Ready (Cleaned & Optimized)

---

## 📁 Migration Files Overview

| File | Lines | Purpose |
|------|-------|---------|
| `20251002120000_auth_check_functions.sql` | ~95 | Email/username validation functions |
| `20251002120001_rbac_schema.sql` | 130 | Core RBAC tables and types |
| `20251002120002_role_permissions_data.sql` | 151 | Role-permission mapping |
| `20251002120003_triggers_and_functions.sql` | 290 | Auto triggers for user creation |
| `20251002120004_auth_hook.sql` | 242 | JWT token hook |
| `20251002120005_authorization_function.sql` | ~220 | Permission checking functions (cleaned) |
| `20251002120006_rls_policies.sql` | 287 | Row Level Security |
| `20251002120007_performance_indexes.sql` | ~228 | Essential indexes only (6 total) |
| `seed.sql` | 188 | Demo user data |

---

## 🗂️ Database Tables

### 1. **user_roles**
**Purpose**: Single role per user (avoids JWT bloat)

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `user_id` | uuid | References auth.users (CASCADE) |
| `role` | app_role | Enum: super_admin, team_member, contributor |
| `assigned_at` | timestamptz | When role was assigned |
| `assigned_by` | uuid | Who assigned the role |

**Constraints**:
- UNIQUE(user_id) - ensures single role per user

---

### 2. **role_permissions**
**Purpose**: Static mapping of roles to permissions

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `role` | app_role | Role enum |
| `permission` | app_permission | Permission enum (16 total) |

**Constraints**:
- UNIQUE(role, permission)

---

### 3. **users_profile**
**Purpose**: Extended user profiles with contribution tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | References auth.users |
| `username` | varchar(50) | UNIQUE username |
| `full_name` | varchar(100) | Display name |
| `avatar_url` | text | Profile picture |
| `country` | varchar(100) | User country |
| `bio` | text | User biography |
| `is_suspended` | boolean | Suspension status |
| `contribution_count` | integer | Total contributions |
| `approval_rate` | decimal(5,2) | % of approved contributions |
| `trust_level` | varchar(20) | new, trusted, expert |
| `last_login` | timestamptz | Last login time |
| `created_at` | timestamptz | Account creation |
| `updated_at` | timestamptz | Last update |

**Constraints**:
- username: 3-50 chars, alphanumeric + underscore/hyphen
- contribution_count >= 0
- approval_rate: 0-100

---

### 4. **role_audit_log**
**Purpose**: Complete audit trail for role changes

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Primary key |
| `user_id` | uuid | User whose role changed |
| `old_role` | app_role | Previous role |
| `new_role` | app_role | New role |
| `changed_by` | uuid | Admin who made change |
| `reason` | text | Why the change was made |
| `changed_at` | timestamptz | When it happened |

---

### 5. **users_profile_public** (VIEW)
**Purpose**: Public-safe profile data (column-level security)

**Exposed Columns**:
- id, username, avatar_url, contribution_count, trust_level, created_at

**Filters**:
- Only shows non-suspended users

---

## 🔐 Custom Types (Enums)

### **app_role**
```sql
'super_admin' | 'team_member' | 'contributor'
```

### **app_permission** (16 total)
```sql
-- Perfume management
'perfumes.create'
'perfumes.update'
'perfumes.delete'
'perfumes.approve'

-- Brand management
'brands.create'
'brands.update'
'brands.delete'
'brands.approve'

-- Notes management
'notes.create'
'notes.update'
'notes.delete'
'notes.approve'

-- Suggestions management
'suggestions.create'
'suggestions.review'
'suggestions.moderate'

-- User and system
'users.manage'
'users.suspend'
'analytics.view'
```

---

## 🎯 Permission Matrix

### **Super Admin** (18 permissions - ALL)
- ✅ perfumes.* (create, update, delete, approve)
- ✅ brands.* (create, update, delete, approve)
- ✅ notes.* (create, update, delete, approve)
- ✅ suggestions.* (create, review, moderate)
- ✅ users.* (manage, suspend)
- ✅ analytics.view

### **Team Member** (8 permissions)
- ✅ perfumes.create, perfumes.update
- ✅ brands.create, brands.update
- ✅ notes.create, notes.update
- ✅ suggestions.create, suggestions.review
- ❌ NO: delete, approve, moderate, user management

### **Contributor** (1 permission)
- ✅ suggestions.create ONLY
- ❌ NO: anything else

---

## 🔧 Database Functions

### **Auth Check Functions** (2 - Cleaned)

#### 1. `check_email_exists(p_email)`
- **Returns**: boolean
- **Purpose**: Secure email validation without exposing RLS
- **Used by**: Registration API
- **Security**: SECURITY DEFINER, explicit search_path

#### 2. `check_username_exists(p_username)`
- **Returns**: boolean
- **Purpose**: Check username availability
- **Validation**: 3-20 chars, alphanumeric + underscore
- **Used by**: Registration API

**REMOVED**: ~~`generate_username_from_email()`~~ - Users provide their own username

---

### **User Creation & Triggers** (3 functions, 6 triggers)

#### 1. `handle_new_user()` (TRIGGER)
- **Fires**: AFTER INSERT on auth.users
- **Actions**:
  - Creates users_profile record
  - Assigns default 'contributor' role
  - Race-condition safe
  - ON CONFLICT DO NOTHING for role assignment

#### 2. `audit_role_changes()` (TRIGGER)
- **Fires**: AFTER INSERT/UPDATE/DELETE on user_roles
- **Actions**:
  - Logs all role changes to role_audit_log
  - Extracts current user from JWT claims
  - Tracks old role → new role transitions
  - Never fails (WARNING on error, doesn't block)

#### 3. `update_updated_at_column()` (TRIGGER)
- **Fires**: BEFORE UPDATE on users_profile
- **Actions**: Auto-updates `updated_at` timestamp

#### 4. `protect_sensitive_profile_fields()` (TRIGGER)
- **Fires**: BEFORE UPDATE on users_profile
- **Actions**:
  - Prevents non-admins from modifying:
    - is_suspended
    - contribution_count
    - approval_rate
    - trust_level
  - Restores original values if user tries to modify

---

### **JWT Auth Hook** (1 function + testing)

#### `custom_access_token_hook(event)`
**⚠️ MUST BE CONFIGURED IN SUPABASE DASHBOARD**

- **Purpose**: Adds `user_role` claim to JWT tokens
- **When**: Called during token generation
- **Process**:
  1. Extracts user_id from event
  2. Fetches role from user_roles table
  3. Adds `user_role` claim to JWT
  4. Defaults to 'contributor' if no role found
  5. Adds security claims (aal, amr)
- **Error Handling**: Never fails (returns original event on error)
- **Permissions**: Only supabase_auth_admin can execute

**Configuration Steps** (in Supabase Dashboard):
```
1. Go to Authentication > Hooks
2. Create "Custom Access Token" hook
3. Function: custom_access_token_hook
4. Enable hook
```

---

### **Authorization Functions** (4 - Cleaned)

#### Core Authorization

##### 1. `authorize(requested_permission)`
- **Returns**: boolean
- **Purpose**: Check if current user has specific permission
- **Logic**:
  1. Extracts role from JWT (request.jwt.claims)
  2. Queries role_permissions table
  3. Returns true if role has permission
- **Used by**: RLS policies

##### 2. `is_super_admin()`
- **Returns**: boolean
- **Checks**: JWT claim user_role == 'super_admin'

##### 3. `is_team_member_or_higher()`
- **Returns**: boolean
- **Checks**: Role is team_member OR super_admin

##### 4. `get_current_user_id()`
- **Returns**: uuid
- **Extracts**: User ID from JWT claims (sub)

**REMOVED**: ~~`get_current_user_role()`, `authorize_any()`, `authorize_all()`, `is_owner()`, `authorize_or_owner()`~~ - Not used anywhere

---

### **Testing Functions** (2 - For Development)

#### 1. `test_authorization(test_role, test_permission)`
- **Returns**: boolean
- **Purpose**: Test if a role has permission without JWT
- **Usage**: Development/testing only

#### 2. `get_role_permissions(check_role)`
- **Returns**: array of permissions
- **Purpose**: Get all permissions for a role
- **Usage**: Development/testing only

---

## 🔒 Row Level Security (RLS) Policies

### **user_roles** (6 policies)

| Policy | Role | Operation | Condition |
|--------|------|-----------|-----------|
| Super admins can read all | super_admin | SELECT | Always |
| Super admins can update | super_admin | UPDATE | Always |
| Super admins can insert | super_admin | INSERT | Always |
| Super admins can delete | super_admin | DELETE | Always |
| Auth admin can read | supabase_auth_admin | SELECT | Always |
| Service role full access | service_role | ALL | Always |

---

### **users_profile** (8 policies)

| Policy | Role | Operation | Condition |
|--------|------|-----------|-----------|
| Users read own profile | authenticated | SELECT | user_id = current_user |
| Users update own profile | authenticated | UPDATE | user_id = current_user |
| Super admins read all | super_admin | SELECT | Always |
| Super admins update all | super_admin | UPDATE | Always |
| Team read public profiles | team_member+ | SELECT | NOT suspended |
| Prevent direct creation | authenticated | INSERT | FALSE (trigger only) |
| Service role insert | service_role | INSERT | Always |
| Auth admin insert | supabase_auth_admin | INSERT | Always |

**Note**: Sensitive field protection enforced by `protect_sensitive_profile_fields()` trigger

---

### **role_audit_log** (3 policies)

| Policy | Role | Operation | Condition |
|--------|------|-----------|-----------|
| Super admins view logs | super_admin | SELECT | Always |
| System insert audit | ALL | INSERT | Always (trigger) |
| Service role full access | service_role | ALL | Always |

---

### **role_permissions** (3 policies)

| Policy | Role | Operation | Condition |
|--------|------|-----------|-----------|
| Auth admin read | supabase_auth_admin | SELECT | Always |
| Super admins read | super_admin | SELECT | Always |
| Service role full access | service_role | ALL | Always |

**Security**: Regular users CANNOT see permission matrix (prevents enumeration attacks)

---

## ⚡ Performance Indexes (6 Essential - Cleaned)

### **user_roles** (2 indexes)

```sql
idx_user_roles_user_id              ON (user_id)           -- CRITICAL: Auth hook
idx_user_roles_role                 ON (role)              -- USEFUL: Admin queries
```

---

### **role_permissions** (1 index)

```sql
idx_role_permissions_lookup (UNIQUE) ON (role, permission) -- CRITICAL: authorize()
```

---

### **users_profile** (2 indexes)

```sql
idx_users_profile_username (UNIQUE)  ON (username)         -- CRITICAL: Login/profile
idx_users_profile_username_lower     ON (lower(username))  -- CRITICAL: Username check
```

---

### **role_audit_log** (1 index)

```sql
idx_audit_log_user_time              ON (user_id, changed_at DESC) -- USEFUL: Audit queries
```

**REMOVED**: 22 premature optimization indexes for analytics, leaderboards, and complex filtering
- Add them back when you actually build those features

---

## 📊 Monitoring Functions

### Index Health

#### `get_index_usage_stats()`
**Returns**: table with index usage metrics
- index_name, index_size, index_scans, tuples_read, usage_ratio

#### `get_unused_indexes()`
**Returns**: indexes with 0 scans
- Suggests candidates for removal

#### `validate_rbac_indexes()`
**Returns**: index count validation
- Ensures all expected indexes exist (6 essential)

**Purpose**: DevOps tools for performance monitoring and optimization

---

## 🌱 Seed Data (Demo Users)

### 1. Super Admin
```
Email: admin@everyspray.com
Password: admin123
UUID: 11111111-1111-1111-1111-111111111111
Role: super_admin
Stats: 250 contributions, 98.5% approval rate, expert trust
```

### 2. Team Member
```
Email: team@everyspray.com
Password: team123
UUID: 22222222-2222-2222-2222-222222222222
Role: team_member
Stats: 150 contributions, 95.2% approval rate, expert trust
```

### 3. Contributor
```
Email: user@everyspray.com
Password: user123
UUID: 33333333-3333-3333-3333-333333333333
Role: contributor
Stats: 45 contributions, 87.3% approval rate, trusted
```

---

## 🔄 Data Flow

### User Registration Flow
```
1. User submits email/password/username → Supabase Auth creates auth.users record
2. TRIGGER: handle_new_user() fires
   ↓
3. INSERT into users_profile (id, username, full_name)
   ↓
4. INSERT into user_roles (user_id, role = 'contributor')
   ↓
5. TRIGGER: audit_role_changes() logs to role_audit_log
   ↓
6. User can now login
```

### JWT Token Generation Flow
```
1. User logs in → Supabase Auth validates credentials
   ↓
2. AUTH HOOK: custom_access_token_hook() fires
   ↓
3. Fetch user role from user_roles table
   ↓
4. Add 'user_role' claim to JWT token
   ↓
5. Return JWT with claims:
   {
     sub: user_id,
     email: user@example.com,
     user_role: 'contributor',  ← ADDED BY HOOK
     aal: 'aal1',
     amr: ['password']
   }
```

### Permission Check Flow
```
1. User makes request to protected resource
   ↓
2. RLS Policy calls authorize('perfumes.create')
   ↓
3. authorize() extracts role from JWT (request.jwt.claims)
   ↓
4. Query role_permissions: WHERE role = JWT.user_role AND permission = 'perfumes.create'
   ↓
5. Return true/false
   ↓
6. RLS allows/denies query
```

---

## 🛡️ Security Features

### ✅ Implemented

1. **Single Role Per User** - UNIQUE constraint prevents JWT bloat
2. **Explicit search_path** - All SECURITY DEFINER functions set search_path
3. **JWT-Based Auth** - All permissions via JWT claims (not database queries)
4. **Append-Only Audit** - role_audit_log has no UPDATE/DELETE policies
5. **Column-Level Security** - users_profile_public view hides sensitive data
6. **Trigger Protection** - Sensitive profile fields protected by trigger
7. **Permission Hiding** - Regular users can't see role_permissions table
8. **Race Condition Safety** - handle_new_user() uses retry loops
9. **Error Handling** - All functions handle errors gracefully (never fail auth)
10. **Default Deny** - RLS policies deny by default, allow explicitly

### ⚠️ Required Setup

1. **Auth Hook Configuration** - Must be enabled in Supabase Dashboard
2. **Service Role Key** - Keep secure, only for backend operations
3. **Environment Variables** - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

---

## 📈 Performance Expectations

| Operation | Expected Time | Index Used |
|-----------|---------------|------------|
| User role lookup | < 1ms | idx_user_roles_user_id |
| Permission check | < 1ms | idx_role_permissions_lookup |
| Username check | < 1ms | idx_users_profile_username_lower |
| Audit query | < 10ms | idx_audit_log_user_time |

---

## 🧪 Testing & Validation

### Migration Validation
Each migration includes validation:
- ✅ Role count check (3 roles)
- ✅ Permission count check (27 total assignments)
- ✅ RLS enabled on all tables (4 tables)
- ✅ Index count check (6 essential indexes)

### Testing Functions
```sql
-- Test auth hook
SELECT test_auth_hook('user-uuid');

-- Test permission check
SELECT test_authorization('super_admin', 'perfumes.delete');

-- Test role permissions
SELECT get_role_permissions('team_member');

-- Check index usage
SELECT * FROM get_index_usage_stats();
```

---

## 📝 Cleanup Summary

### What Was Removed (Aggressive Cleanup)

#### Functions Removed (6):
- ❌ `generate_username_from_email()` - Users provide their own username
- ❌ `get_current_user_role()` - Not used anywhere
- ❌ `authorize_any()` - Not used anywhere
- ❌ `authorize_all()` - Not used anywhere
- ❌ `is_owner()` - Not used anywhere
- ❌ `authorize_or_owner()` - Not used anywhere

#### API Endpoints Removed (1):
- ❌ `/api/generate-username` - No longer needed

#### Indexes Removed (22):
- ❌ All leaderboard indexes (contribution_count, approval_rate)
- ❌ All analytics indexes (composite, partial indexes)
- ❌ All audit log transition indexes
- ❌ All country/profile completion indexes
- ❌ All high-value/new user indexes

**Kept**: Only 6 essential indexes for RBAC functionality

---

## 🎯 When to Add More Features

### Indexes to Add Later:
- **Leaderboard features** → `idx_users_profile_contribution_count`
- **Analytics dashboard** → Composite indexes on users_profile
- **Advanced filtering** → Partial indexes for specific queries
- **Full-text search** → GIN indexes on bio/full_name

### Functions to Add Later:
- **Ownership checks** → `is_owner()`, `authorize_or_owner()`
- **Batch operations** → `authorize_any()`, `authorize_all()`

**Philosophy**: Start simple, add complexity only when needed

---

**Last Updated**: 2025-10-08
**Database Version**: Production-Ready (Cleaned & Optimized)
**Total Objects**: 4 tables, 1 view, 2 enums, 11 functions, 20 policies, 6 indexes
**Cleanup**: Removed 6 unused functions, 1 API endpoint, 22 premature indexes
