# 🔐 Complete Auth + RBAC Flow Explanation

**Project**: EverySpray Admin Platform
**Date**: 2025-10-07
**Status**: Production-Ready Implementation

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [The Two-Layer Protection System](#the-two-layer-protection-system)
3. [Layer 1: Edge Middleware (Server-Side)](#layer-1-edge-middleware-server-side)
4. [Layer 2: Supabase Middleware (Session Management)](#layer-2-supabase-middleware-session-management)
5. [Client-Side Auth State](#client-side-auth-state)
6. [Complete Request Flow](#complete-request-flow)
7. [Why We Keep Both Middlewares](#why-we-keep-both-middlewares)
8. [File Structure](#file-structure)

---

## 🎯 Overview

Our application uses **Supabase Auth** following their **official documentation** with a **two-layer protection system**:

### Authentication Stack
- **Supabase Auth**: User authentication (JWT tokens, sessions)
- **Next.js Middleware**: Edge-based route protection
- **Zustand Store**: Client-side auth state management

### Role-Based Access Control (RBAC)
- **3 Roles**: `super_admin`, `team_member`, `contributor`
- **JWT Claims**: Role stored in Supabase JWT tokens
- **Path-Based**: Different routes for different roles

---

## 🏗️ The Two-Layer Protection System

### Why Two Middlewares?

We have **TWO middleware files**, each serving a different purpose:

```
1. middleware.ts (Root)              → RBAC Protection (Role-based access)
2. src/lib/supabase/middleware.ts    → Session Management (Cookie handling)
```

**They work together, NOT in conflict!**

---

## 🛡️ Layer 1: Edge Middleware (Server-Side)

**File**: `middleware.ts` (root of project)

### Purpose
Checks **role-based permissions** BEFORE the page loads.

### When It Runs
- **Edge Runtime**: Runs at Cloudflare/Vercel Edge (closest to user)
- **Before Every Request**: Page hasn't loaded yet
- **Server-Side Only**: Can't be bypassed by client

### What It Does

```typescript
User visits /admin/users
    ↓
1. Check if path should skip middleware (static assets, images, etc.)
    ↓ No
2. Create Supabase client with cookies
    ↓
3. Call supabase.auth.getUser() → Validate JWT token
    ↓
4. Extract user role from JWT claims (user_metadata.role or app_metadata.user_role)
    ↓
5. Check path permission:
   - /admin/users requires super_admin role
   - User has team_member role
    ↓
6. Access DENIED → Redirect to /admin/dashboard
```

### Path Permission Rules

```typescript
const PATH_PERMISSIONS = {
  '/contribute': ['contributor', 'super_admin'],
  '/admin': ['team_member', 'super_admin'],
  '/admin/users': ['super_admin'],           // Super admin only
  '/admin/team-management': ['super_admin'], // Super admin only
  '/admin/analytics': ['super_admin'],       // Super admin only
};
```

### Redirect Logic

```typescript
// Case 1: Authenticated user on auth page → Redirect to dashboard
if (user && isAuthPage) {
  redirect to /contribute/dashboard (contributor)
  redirect to /admin/dashboard (team_member or super_admin)
}

// Case 2: Unauthenticated user on protected page → Redirect to login
if (!user && !isAuthPage) {
  redirect to /login?redirect=/intended-path
}

// Case 3: Authenticated but wrong role → Redirect to their dashboard
if (user && !hasPathAccess(role, path)) {
  redirect to role-appropriate dashboard
}
```

### Why This Middleware Exists
✅ **Fast**: Runs at edge, before server rendering
✅ **Secure**: Server-side, can't be bypassed
✅ **Simple**: One JWT check per request
✅ **RBAC**: Role-based access control

---

## 🔄 Layer 2: Supabase Middleware (Session Management)

**File**: `src/lib/supabase/middleware.ts`

### Purpose
Manages **Supabase session cookies** and keeps user authenticated.

### When It Runs
- **After** Edge Middleware
- **Before** Page Server Components
- **On Every Request** (that passes Edge Middleware)

### What It Does

```typescript
User request arrives (already passed Edge Middleware)
    ↓
1. Create Supabase Server Client
    ↓
2. Get all cookies from request
    ↓
3. Call supabase.auth.getUser() → Refresh session if needed
    ↓
4. Update cookies with new session tokens (if refreshed)
    ↓
5. Pass updated cookies to response
    ↓
6. Continue to page
```

### Key Function: `updateSession()`

```typescript
export const updateSession = async (request: NextRequest) => {
  // Create Supabase client
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookies) { /* Update response cookies */ }
    }
  });

  // Validate user and refresh session
  const { data: { user } } = await supabase.auth.getUser();

  // Return response with updated cookies
  return supabaseResponse;
};
```

### Why This Middleware Exists
✅ **Session Management**: Keeps Supabase sessions alive
✅ **Cookie Handling**: Properly syncs auth cookies
✅ **Token Refresh**: Auto-refreshes expired JWT tokens
✅ **Official Pattern**: Recommended by Supabase docs

---

## 💻 Client-Side Auth State

**File**: `src/lib/stores/auth.ts`

### Purpose
Manages auth state in React components (read-only, not for protection).

### What It Does

```typescript
// Zustand store
const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  // Initialize on app load
  initialize: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      set({ user: { ...data.user, role: profile.role }, isLoading: false });
    }
  },

  // Listen to auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      // Update store
    } else {
      // Clear store
    }
  })
}));
```

### When It Runs
- **Client-Side Only**: In browser, after page loads
- **After Middleware**: Page already rendered
- **For UI Updates**: Show/hide buttons, user info, etc.

### Why This Exists
✅ **UI State**: Show user email, role badge, etc.
✅ **Conditional Rendering**: Hide admin buttons from contributors
✅ **Navigation**: Get current user role for menus
✅ **NOT FOR PROTECTION**: Middleware already handled security

---

## 🚫 What We DON'T Use (Removed Redundancy)

### ❌ Layout-Level Protection (REMOVED)

Previously, we had this in layout files:

```typescript
// ❌ OLD (Redundant)
export default function AdminLayout({ children }) {
  return (
    <RouteProtection allowedRoles={['team_member', 'super_admin']}>
      <AdminLayout>{children}</AdminLayout>
    </RouteProtection>
  );
}
```

**Why we removed it:**
1. ⚠️ **Duplicate checks**: Middleware already validated access
2. ⚠️ **Performance**: Wasting time checking twice
3. ⚠️ **Loading flicker**: Client-side check after page starts loading
4. ⚠️ **Unnecessary complexity**: Middleware is enough

### ✅ Current (Clean)

```typescript
// ✅ CURRENT (Clean)
export default function AdminLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}
```

**Protection happens at middleware level ONLY.**

### When to Use `<RouteProtection>`?

**Only for page-specific permissions**, NOT role-based:

```typescript
// ✅ GOOD: Page-specific permission check
<RouteProtection
  requiredPermissions={['perfumes.delete']}
  allowOwnership={true}
  resourceOwnerId={perfume.createdBy}
>
  <DeleteButton />
</RouteProtection>

// ❌ BAD: Role-based check (middleware handles this)
<RouteProtection allowedRoles={['super_admin']}>
  <AdminPanel />
</RouteProtection>
```

**Rule**: Use middleware for roles, use `<RouteProtection>` only for granular permissions.

---

## 🔁 Complete Request Flow

### Scenario 1: Unauthenticated User Visits `/admin/dashboard`

```
1. Browser Request → /admin/dashboard
   ↓
2. Edge Middleware (middleware.ts)
   ↓ Check auth
   ✗ No user found
   ↓
3. Redirect → /login?redirect=/admin/dashboard
   ↓
4. Browser loads /login page
   ↓
5. User enters credentials
   ↓
6. Supabase Auth → Create session
   ↓
7. Redirect → /admin/dashboard (from ?redirect param)
   ↓
8. Edge Middleware
   ✓ User authenticated, role: team_member
   ✓ Path /admin/dashboard allowed for team_member
   ↓
9. Supabase Middleware → Update session cookies
   ↓
10. Page Renders → Admin Dashboard
   ↓
11. Client Auth Store → Initialize user state
   ↓
12. UI Updates → Show user email, role badge
```

### Scenario 2: Team Member Tries to Access `/admin/users` (Super Admin Only)

```
1. Browser Request → /admin/users
   ↓
2. Edge Middleware (middleware.ts)
   ↓ Check auth
   ✓ User authenticated, role: team_member
   ↓ Check permissions
   ✗ /admin/users requires super_admin
   ✗ User is team_member
   ↓
3. Redirect → /admin/dashboard (their default dashboard)
   ↓
4. User stays on admin dashboard
```

### Scenario 3: Super Admin Accesses `/admin/users` (Allowed)

```
1. Browser Request → /admin/users
   ↓
2. Edge Middleware (middleware.ts)
   ↓ Check auth
   ✓ User authenticated, role: super_admin
   ↓ Check permissions
   ✓ /admin/users allowed for super_admin
   ↓
3. Supabase Middleware → Update session cookies
   ↓
4. Page Renders → User Management Page
   ↓
5. Client Auth Store → User state available
   ↓
6. UI Shows → User management interface
```

### Scenario 4: Contributor Tries to Access `/admin/dashboard`

```
1. Browser Request → /admin/dashboard
   ↓
2. Edge Middleware (middleware.ts)
   ↓ Check auth
   ✓ User authenticated, role: contributor
   ↓ Check permissions
   ✗ /admin/* requires team_member or super_admin
   ✗ User is contributor
   ↓
3. Redirect → /contribute/dashboard (their dashboard)
   ↓
4. User lands on contributor dashboard
```

---

## 🤔 Why We Keep Both Middlewares

### ❌ Common Mistake: Deleting Supabase Middleware

**DON'T DO THIS!** Here's why:

### Edge Middleware (middleware.ts)
- ✅ **RBAC**: Checks role-based permissions
- ✅ **Redirects**: Sends users to correct pages
- ❌ **NOT FOR SESSION**: Doesn't manage Supabase sessions properly

### Supabase Middleware (src/lib/supabase/middleware.ts)
- ✅ **Session Management**: Keeps sessions alive
- ✅ **Cookie Syncing**: Properly updates auth cookies
- ✅ **Token Refresh**: Auto-refreshes JWT tokens
- ❌ **NOT FOR RBAC**: Doesn't check role permissions

### What Happens If You Delete Supabase Middleware?
1. ❌ Sessions expire faster (no auto-refresh)
2. ❌ Cookie sync issues between client/server
3. ❌ Supabase `getUser()` may fail randomly
4. ❌ Users logged out unexpectedly

### The Correct Setup (Current)
```
middleware.ts                       → RBAC protection
src/lib/supabase/middleware.ts     → Session management
src/lib/stores/auth.ts             → Client state
```

**Both middlewares work together!**

---

## 📁 File Structure

```
/
├── middleware.ts                          ← Edge RBAC Protection
│
├── src/
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── middleware.ts             ← Supabase Session Management
│   │   │   ├── client.ts                 ← Browser Supabase client
│   │   │   └── server.ts                 ← Server Supabase client
│   │   │
│   │   ├── stores/
│   │   │   └── auth.ts                   ← Client Auth State (Zustand)
│   │   │
│   │   └── auth/
│   │       ├── redirects.ts              ← Role redirect logic
│   │       ├── roles.ts                  ← Role checking utils
│   │       └── route-protection.tsx      ← Optional client guards
│   │
│   └── types/
│       └── rbac.types.ts                 ← TypeScript types for roles
```

---

## 🎓 Key Takeaways

### 1. **Two Middlewares, Two Jobs**
- **Edge Middleware** → RBAC (role permissions)
- **Supabase Middleware** → Session management (cookies)

### 2. **No Redundancy**
- They complement each other
- Edge checks **permissions**
- Supabase manages **sessions**

### 3. **Client State is NOT for Protection**
- Zustand store is for UI updates
- Middleware already handled security
- Never rely on client-side checks for auth

### 4. **Following Supabase Official Docs**
- Using `@supabase/ssr` package
- Following server-side auth patterns
- Cookie handling as recommended

### 5. **Fast, Secure, Smooth**
- **Fast**: Edge-based (runs at CDN)
- **Secure**: Server-side validation
- **Smooth**: No loading flickers

---

## 🔍 Debugging Tips

### Check Auth Flow
```typescript
// In Edge Middleware (middleware.ts)
console.log('User:', user?.email, 'Role:', getUserRoleFromJWT(user));
console.log('Path:', pathname, 'Allowed:', hasPathAccess(role, pathname));

// In Supabase Middleware (src/lib/supabase/middleware.ts)
const { data: { user } } = await supabase.auth.getUser();
console.log('Session active:', !!user);

// In Client Store (src/lib/stores/auth.ts)
console.log('Client user:', useAuthStore.getState().user);
```

### Common Issues

**Issue**: User logged out randomly
- **Cause**: Missing Supabase middleware
- **Fix**: Keep `src/lib/supabase/middleware.ts`

**Issue**: Wrong user accessing admin pages
- **Cause**: Edge middleware not checking roles
- **Fix**: Verify `PATH_PERMISSIONS` in `middleware.ts`

**Issue**: Redirect loops
- **Cause**: Middleware redirecting to protected page
- **Fix**: Ensure redirect targets are allowed for user role

---

**Last Updated**: 2025-10-07
**Follows**: Supabase Official Docs + Next.js 15 Patterns
