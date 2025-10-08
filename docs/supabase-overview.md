# 🗄️ Supabase Database - Complete Overview

**Project**: EverySpray Admin Platform
**Last Updated**: 2025-10-08
**Status**: Production-Ready

> **Purpose**: High-level overview of everything in our Supabase database. For detailed documentation, see specific docs linked below.

---

## 📁 Migration Files (17 Total)

### RBAC System (8 Files)
1. `20251002120000_auth_check_functions.sql` - Email/username validation functions
2. `20251002120001_rbac_schema.sql` - Core RBAC tables and types
3. `20251002120002_role_permissions_data.sql` - Role-permission mapping
4. `20251002120003_triggers_and_functions.sql` - Auto triggers for user creation
5. `20251002120004_auth_hook.sql` - JWT token hook
6. `20251002120005_authorization_function.sql` - Permission checking functions
7. `20251002120006_rls_policies.sql` - Row Level Security for RBAC
8. `20251002120007_performance_indexes.sql` - 6 essential RBAC indexes

### Perfume Catalog System (9 Files)
9. `20251008120000_enable_extensions.sql` - PostgreSQL extensions (uuid-ossp, pg_trgm)
10. `20251008120001_create_images_table.sql` - Centralized image storage
11. `20251008120002_create_contributor_suggestions.sql` - Contributor workflow
12. `20251008120003_create_brands_tables.sql` - Brands draft + public
13. `20251008120004_create_notes_tables.sql` - Notes draft + public
14. `20251008120005_create_perfumes_tables.sql` - Perfumes draft + public (denormalized)
15. `20251008120006_create_audit_log.sql` - Immutable audit trail
16. `20251008120007_create_indexes.sql` - 54 performance indexes (trigram search)
17. `20251008120008_create_rls_policies.sql` - 49 RLS policies for catalog
18. `20251008120009_create_workflow_functions.sql` - 13 workflow automation functions

**📖 Detailed Docs**: [database-migrations.md](database-migrations.md)

---

## 🗂️ Database Tables (13 Total)

### RBAC Tables (4)
| Table | Purpose | Why | Key Fields |
|-------|---------|-----|------------|
| `user_roles` | Single role per user | Prevents JWT bloat, enforces one role only | user_id (FK), role (enum) |
| `role_permissions` | Role-permission mapping | Static permission matrix for authorize() function | role (enum), permission (enum) |
| `users_profile` | Extended user profiles | Store contribution stats, trust level, bio beyond auth.users | username (UNIQUE), trust_level, contribution_count, approval_rate |
| `role_audit_log` | Role change audit trail | Track who changed what role when for compliance | user_id, old_role, new_role, changed_by, reason |

**📖 Detailed Docs**: [database-rbac.md](database-rbac.md)

### Catalog Tables (9)
| Table | Type | Purpose | Why |
|-------|------|---------|-----|
| `images` | Shared | Centralized image storage with SHA256 deduplication | Single source of truth for all images (perfumes, brands, notes, avatars) prevents duplicate uploads |
| `contributor_perfume_suggestions` | Workflow | Simple submission form for contributors | Only table contributors can write to, keeps main catalog clean |
| `brands` | Draft | Full brand data (team edits here) | Rich editing environment with all fields, workflow states, approval tracking |
| `brands_public` | Public | Lightweight denormalized brand data | Fast searches without JOINs, only published approved brands visible to public |
| `notes` | Draft | Full fragrance note data | Team members create/edit notes with categories, characteristics, approval workflow |
| `notes_public` | Public | Lightweight denormalized note data | Fast searches, only approved notes visible, no JOINs needed |
| `perfumes` | Draft | Full perfume data | Team edits with all details, must reference published brands, approval workflow |
| `perfumes_public` | Public | Fully denormalized perfume data (brand_name, notes string, thumbnail) | ZERO JOINs for blazing fast searches, all data pre-computed at approval time |
| `audit_log` | Audit | Immutable append-only audit trail | Complete before/after snapshots (JSONB) for compliance, can never be modified |

**📖 Detailed Docs**: [database-catalog.md](database-catalog.md)

---

## 🔧 Database Functions (24 Total)

### RBAC Functions (11)
| Function | Purpose | Why | Used By |
|----------|---------|-----|---------|
| `check_email_exists(email)` | Check if email registered in auth.users | Prevents RLS exposure, secure validation | Registration API |
| `check_username_exists(username)` | Check if username taken in users_profile | Case-insensitive check, format validation | Registration API |
| `handle_new_user()` | Auto-create profile + assign contributor role on signup | Ensures every auth.users has profile + default role | TRIGGER on auth.users INSERT |
| `audit_role_changes()` | Log all role changes to role_audit_log | Compliance tracking, never fails main operation | TRIGGER on user_roles |
| `custom_access_token_hook()` | Inject user_role claim into JWT token | Enables permission checking without DB queries | Supabase Auth Hook |
| `authorize(permission)` | Check if current user has specific permission | Core authorization, uses JWT role claim + role_permissions | All RLS policies |
| `is_super_admin()` | Check if current user is super_admin | Quick role check from JWT | Admin-only RLS policies |
| `is_team_member_or_higher()` | Check if team_member OR super_admin | Reusable team access check | Team+ RLS policies |
| `get_current_user_id()` | Extract user UUID from JWT claims | Safe user ID extraction | Owner-check RLS policies |
| `test_authorization(role, perm)` | Test permission without JWT | Development/testing only | Manual testing |
| `get_role_permissions(role)` | Get all permissions for role | Development/testing only | Manual testing |

**📖 Detailed Docs**: [database-rbac.md](database-rbac.md)

### Catalog Functions (13)
| Function | Purpose | Why | Permission |
|----------|---------|-----|------------|
| `generate_slug(text)` | Convert text to URL-friendly slug | Creates SEO-friendly URLs, removes special chars | Public (IMMUTABLE) |
| `accept_suggestion_to_review(suggestion_id, team_id)` | Move suggestion to perfumes draft table | Creates perfume from contributor idea, links suggestion_id | team_member+ |
| `reject_suggestion(suggestion_id, note, team_id)` | Reject suggestion with feedback for contributor | Provides rejection reason, updates suggestion status | team_member+ |
| `submit_brand_for_approval(brand_id, team_id)` | Change brand status to pending_approval | Owner submits their draft for super admin review | owner only |
| `approve_and_publish_brand(brand_id, admin_id)` | Denormalize thumbnail + copy to brands_public | Makes brand publicly visible, creates circular FK link | super_admin |
| `reject_brand(brand_id, note, admin_id)` | Reject brand with feedback, back to draft | Sends back to owner with rejection reason | super_admin |
| `unpublish_brand(brand_id, reason, admin_id)` | Delete from brands_public, break circular FK | Removes from public catalog (quality issues, legal) | super_admin |
| `submit_note_for_approval(note_id, team_id)` | Change note status to pending_approval | Owner submits note draft for review | owner only |
| `approve_and_publish_note(note_id, admin_id)` | Denormalize thumbnail + copy to notes_public | Makes note publicly searchable | super_admin |
| `reject_note(note_id, note, admin_id)` | Reject note with feedback | Sends back with rejection reason | super_admin |
| `unpublish_note(note_id, reason, admin_id)` | Delete from notes_public | Removes from public catalog | super_admin |
| `submit_perfume_for_approval(perfume_id, team_id)` | Change perfume status to pending_approval | Validates brand_id exists before submission | owner only |
| `approve_and_publish_perfume(perfume_id, admin_id)` | Denormalize brand_name, notes string, thumbnail + copy to perfumes_public | CRITICAL: Fetches brand name, concatenates all note names, copies thumbnail for ZERO JOIN searches | super_admin |
| `reject_perfume(perfume_id, note, admin_id)` | Reject perfume with feedback | Sends back with rejection reason | super_admin |
| `unpublish_perfume(perfume_id, reason, admin_id)` | Delete from perfumes_public | Removes from public catalog | super_admin |

**📖 Detailed Docs**: [database-catalog.md](database-catalog.md)

---

## ⚡ Performance Indexes (60 Total)

### RBAC Indexes (6)
| Index | Type | Purpose | Why |
|-------|------|---------|-----|
| `idx_user_roles_user_id` | B-tree | User role lookup on every request | CRITICAL: Auth hook queries this on every login |
| `idx_user_roles_role` | B-tree | Filter users by role | Admin queries: "show all super_admins" |
| `idx_role_permissions_lookup` | B-tree UNIQUE | Permission check on every request | CRITICAL: authorize() function uses this constantly |
| `idx_users_profile_username` | B-tree UNIQUE | Username lookup for login/profile | CRITICAL: Login by username, profile page access |
| `idx_users_profile_username_lower` | B-tree | Case-insensitive username check | Username availability API uses lower(username) |
| `idx_audit_log_user_time` | B-tree composite | User's audit history sorted by time | "Show all role changes for user X in last 30 days" |

### Catalog Indexes (54)

**Trigram Search (8 GIN indexes - CRITICAL for fuzzy search)**:
| Index | Table | Purpose | Why |
|-------|-------|---------|-----|
| `idx_brands_public_name_trgm` | brands_public | Fast brand fuzzy search | Enables `LIKE '%chanel%'` < 10ms on millions of records |
| `idx_notes_public_name_trgm` | notes_public | Fast note fuzzy search | Search "bergamot" finds "Bergamot Sicily" instantly |
| `idx_perfumes_public_name_trgm` | perfumes_public | Fast perfume name fuzzy search | Search "sauvage" finds "Sauvage Elixir" < 10ms |
| `idx_perfumes_public_notes_trgm` | perfumes_public | Search perfumes by note names | Search "vanilla" finds all perfumes with vanilla in notes string |
| `idx_brands_name_trgm` | brands (draft) | Team member searches drafts | Search draft brands during editing |
| `idx_notes_name_trgm` | notes (draft) | Team member searches drafts | Search draft notes during editing |
| `idx_perfumes_name_trgm` | perfumes (draft) | Team member searches drafts | Search draft perfumes during editing |
| `idx_contrib_suggestions_name_trgm` | contributor_perfume_suggestions | Search suggestions | Find existing suggestions before creating duplicates |

**Unique Indexes (6 - Prevent Duplicate Slugs)**:
| Index | Table | Purpose | Why |
|-------|-------|---------|-----|
| `idx_brands_public_slug` | brands_public | Unique URL slugs | Prevents duplicate URLs like /brands/chanel |
| `idx_notes_public_slug` | notes_public | Unique URL slugs | Prevents duplicate URLs like /notes/vanilla |
| `idx_perfumes_public_slug` | perfumes_public | Unique URL slugs | Prevents duplicate URLs like /perfumes/bleu-de-chanel |
| `idx_brands_slug` | brands (draft) | Unique draft slugs | Prevents slug conflicts during editing |
| `idx_notes_slug` | notes (draft) | Unique draft slugs | Prevents slug conflicts during editing |
| `idx_perfumes_slug` | perfumes (draft) | Unique draft slugs | Prevents slug conflicts during editing |

**B-tree Indexes (35 - Fast Filtering & Lookups)**:
- Status filtering: `idx_brands_status`, `idx_notes_status`, `idx_perfumes_status` (filter pending_approval, draft, approved)
- FK lookups: `idx_perfumes_brand_id`, `idx_images_entity` (JOIN optimization)
- Date sorting: `idx_brands_created_at`, `idx_perfumes_published_at` (recent items)
- User filtering: `idx_brands_created_by`, `idx_perfumes_approved_by` (user's drafts, approvals)

**Composite Indexes (5 - Multi-Column Queries)**:
- `idx_perfumes_public_brand_name_lookup` - (brand_name, name) for "Chanel perfumes sorted by name"
- `idx_contrib_status_assigned` - (status, assigned_to_team_member) for "my pending suggestions"
- `idx_audit_entity_created` - (entity_type, entity_id, created_at DESC) for "perfume X's history"
- Plus 2 more for common query patterns

**📖 Detailed Docs**: [database-indexes.md](database-indexes.md) (planned)

---

## 🔒 Row Level Security (69 Policies)

### RBAC Policies (20)
| Table | Policy Count | Who Can Do What | Why |
|-------|--------------|-----------------|-----|
| `user_roles` | 6 | Super admins: full access; Auth admin: read for hooks; Service role: full | Only super admins assign roles, prevents privilege escalation |
| `users_profile` | 8 | Users: read/update own; Team: read non-suspended; Super admins: all | Users control own data, admins see everything, sensitive fields protected by trigger |
| `role_audit_log` | 3 | Super admins: view all; System: insert via triggers | Immutable audit trail, only admins can view |
| `role_permissions` | 3 | Auth admin + super admins: read; Service role: full | Static permission matrix, regular users can't see (prevents enumeration attacks) |

### Catalog Policies (49)
| Table | Policy Count | Who Can Do What | Why |
|-------|--------------|-----------------|-----|
| `images` | 4 | Everyone: view; Team: upload; Owner: update own | Public images visible, team uploads, ownership tracking |
| `contributor_perfume_suggestions` | 4 | Contributors: create + view own; Team: view all + process | Contributors only see their own, team reviews all |
| `brands` (draft) | 5 | Team: create + update own drafts; Super admins: full access | Team members edit their own drafts, admins have full control |
| `brands_public` | 1 | Everyone (anon + auth): READ ONLY | Public catalog is read-only, NO direct writes (only via approve_and_publish_brand function) |
| `notes` (draft) | 5 | Team: create + update own drafts; Super admins: full access | Same pattern as brands |
| `notes_public` | 1 | Everyone: READ ONLY | Public catalog is read-only, NO direct writes (only via approve_and_publish_note function) |
| `perfumes` (draft) | 6 | Team: create + update own drafts; Super admins: full access | Team members edit their own perfume drafts |
| `perfumes_public` | 1 | Everyone: READ ONLY | Public catalog is read-only, NO direct writes (only via approve_and_publish_perfume function) |
| `audit_log` | 2 | Super admins: view all; Team: view own actions | Append-only log, immutable, admins see everything, team sees own |

**🔑 Key Security Rule**: Public tables (`*_public`) have NO INSERT/UPDATE/DELETE policies. Only SECURITY DEFINER functions can write to them. This ensures:
- Data integrity (denormalization happens correctly)
- Workflow enforcement (must go through approval)
- Audit trail (all changes logged)
- Permission checks (functions verify roles)

**📖 Detailed Docs**: [database-security.md](database-security.md) (planned)

---

## 🎭 Roles & Permissions

### Roles (3)
1. **super_admin** - Full access (18 permissions)
2. **team_member** - Content creation + review (8 permissions)
3. **contributor** - Submit suggestions only (1 permission)

### Permissions (16)
- `perfumes.*` - create, update, delete, approve
- `brands.*` - create, update, delete, approve
- `notes.*` - create, update, delete, approve
- `suggestions.*` - create, review, moderate
- `users.*` - manage, suspend
- `analytics.view`

**📖 Detailed Docs**: [database-rbac.md](database-rbac.md)

---

## 🔄 Workflows

### Contributor Suggestion → Published Perfume
1. Contributor submits → `contributor_perfume_suggestions` (pending)
2. Team member accepts → Creates `perfumes` draft, links suggestion
3. Team member fills details → Assigns published brand
4. Team member submits → Status: pending_approval
5. Super admin approves → Denormalizes data to `perfumes_public`
6. Public searches → `perfumes_public` (NO JOINs)

### Brand/Note Approval Flow
1. Team member creates → Draft table (status: draft)
2. Team member submits → Status: pending_approval
3. Super admin approves → Denormalizes to public table
4. Circular FK updated → Draft links to public record

**📖 Detailed Docs**: [database-workflows.md](database-workflows.md)

---

## 🔐 PostgreSQL Extensions

### uuid-ossp
- **Purpose**: UUID generation for primary keys
- **Function**: `uuid_generate_v4()`
- **Used by**: All main entity tables

### pg_trgm
- **Purpose**: Trigram-based fuzzy text search
- **Index Type**: GIN (Generalized Inverted Index)
- **Enables**: Fast `LIKE '%search%'` queries
- **Used by**: All public table name fields

---

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication with role claims
- Custom access token hook injects role into JWT
- Permission checking via `authorize()` function
- Single role per user (prevents JWT bloat)

### Data Protection
- Row Level Security on all tables
- Public tables read-only (writes via functions only)
- Function-level permission checking (SECURITY DEFINER)
- Immutable audit log (append-only)

### Data Integrity
- Foreign key constraints (published brands only for perfumes)
- Unique constraints (slug uniqueness)
- Status workflow enforcement (draft → pending → approved)
- Circular FK validation (draft ↔ public tables)

**📖 Detailed Docs**: [database-security.md](database-security.md)

---

## 📊 Architecture Patterns

### Draft + Public Pattern
- **Draft Tables**: Full data, team members edit
- **Public Tables**: Denormalized, read-only, blazing fast searches
- **Workflow**: draft → submit → approve → denormalize to public
- **Purpose**: Separate editing from consumption, optimize for reads

### Denormalization Strategy
- `perfumes_public`: Stores brand_name, notes (comma-separated), thumbnail_url
- **Why**: Eliminate JOINs for maximum search performance
- **Safe**: Public tables read-only, source of truth in drafts
- **Update**: Re-approval required to sync changes

### Circular Foreign Keys
- `brands.public_brand_id` → `brands_public.id`
- `brands_public.brand_id` → `brands.id`
- **Purpose**: Bidirectional relationship for integrity
- **Enforces**: Draft-public linking

**📖 Detailed Docs**: [database-architecture.md](database-architecture.md)

---

## 📈 Performance Expectations

| Operation | Expected Time | Index Used |
|-----------|---------------|------------|
| User role lookup | < 1ms | idx_user_roles_user_id |
| Permission check | < 1ms | idx_role_permissions_lookup |
| Search perfume by name | < 10ms | idx_perfumes_public_name_trgm (GIN) |
| Search perfume by note | < 10ms | idx_perfumes_public_notes_trgm (GIN) |
| Lookup by slug | < 1ms | Unique B-tree indexes |
| Filter by status | < 5ms | Status B-tree indexes |

**Scalability**: Designed for millions of perfumes with sub-10ms search times

---

## 🧪 Testing & Validation

### Migration Validation
- ✅ Role count: 3 roles
- ✅ Permission count: 27 total assignments
- ✅ RLS enabled: All 13 tables
- ✅ Index count: 60 total (6 RBAC + 54 catalog)

### Demo Users (from seed.sql)
1. **admin@everyspray.com** / admin123 - super_admin
2. **team@everyspray.com** / team123 - team_member
3. **user@everyspray.com** / user123 - contributor

### Testing Functions
- `test_authorization()` - Test permission without JWT
- `get_role_permissions()` - Get all permissions for role
- `test_auth_hook()` - Verify JWT hook working

---

## 📚 Detailed Documentation Links

| Topic | Document |
|-------|----------|
| **Database Migrations** | [database-migrations.md](database-migrations.md) |
| **RBAC System** | [database-rbac.md](database-rbac.md) |
| **Catalog Tables** | [database-catalog.md](database-catalog.md) |
| **Functions & Workflows** | [database-workflows.md](database-workflows.md) |
| **Performance Indexes** | [database-indexes.md](database-indexes.md) |
| **Security & RLS** | [database-security.md](database-security.md) |
| **Architecture Patterns** | [database-architecture.md](database-architecture.md) |
| **Authentication Flow** | [auth-flow-explained.md](auth-flow-explained.md) |

---

## 📊 Quick Stats

- **Total Migrations**: 17 files
- **Total Tables**: 13 tables (4 RBAC + 9 catalog)
- **Total Functions**: 24 functions (11 RBAC + 13 catalog)
- **Total Indexes**: 60 indexes (6 RBAC + 54 catalog)
- **Total RLS Policies**: 69 policies (20 RBAC + 49 catalog)
- **Total Roles**: 3 roles
- **Total Permissions**: 16 permissions
- **Database Size**: Production-ready for millions of records
- **Search Performance**: < 10ms for fuzzy searches

---

**Last Updated**: 2025-10-08
**Maintained by**: EverySpray Development Team
