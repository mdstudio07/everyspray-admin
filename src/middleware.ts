// ========================================
// NEXT.JS MIDDLEWARE - RBAC PROTECTION
// ========================================
// Edge-based authentication and authorization using Supabase JWT claims
// Runs BEFORE page loads for fast, secure, and smooth protection

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { AppRole } from '@/types/rbac.types';

// =====================================
// CONFIGURATION
// =====================================

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

// Paths that should skip middleware entirely
const SKIP_MIDDLEWARE_PATTERNS = [
  '/_next',
  '/favicon',
  '/static',
  '/.well-known',
  '/api/auth', // Supabase auth callbacks
];

// Role-based path permissions
const PATH_PERMISSIONS: Record<string, AppRole[]> = {
  '/contribute': ['contributor', 'super_admin'],
  '/admin': ['team_member', 'super_admin'],
  '/admin/users': ['super_admin'],
  '/admin/team-management': ['super_admin'],
  '/admin/analytics': ['super_admin'],
};

// Default dashboard by role
const DEFAULT_DASHBOARD: Record<AppRole, string> = {
  contributor: '/contribute/dashboard',
  team_member: '/admin/dashboard',
  super_admin: '/admin/dashboard',
};

// =====================================
// HELPER FUNCTIONS
// =====================================

/**
 * Check if path should skip middleware entirely
 */
function shouldSkipMiddleware(pathname: string): boolean {
  // Skip static assets and Next.js internals
  if (SKIP_MIDDLEWARE_PATTERNS.some((pattern) => pathname.startsWith(pattern))) {
    return true;
  }

  // Skip files with extensions (images, fonts, etc.)
  if (pathname.includes('.') && !pathname.endsWith('.html')) {
    return true;
  }

  return false;
}

/**
 * Check if path is public (no auth required)
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

/**
 * Check if user has access to path based on role
 */
function hasPathAccess(role: AppRole, pathname: string): boolean {
  // Find the most specific matching path permission
  const matchingPaths = Object.keys(PATH_PERMISSIONS)
    .filter((path) => pathname.startsWith(path))
    .sort((a, b) => b.length - a.length); // Sort by specificity (longest first)

  if (matchingPaths.length === 0) {
    // No specific permission required - allow access
    return true;
  }

  const mostSpecificPath = matchingPaths[0];
  const allowedRoles = PATH_PERMISSIONS[mostSpecificPath];

  return allowedRoles.includes(role);
}

/**
 * Extract user role from Supabase JWT claims
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserRoleFromJWT(user: any): AppRole | null {
  if (!user) return null;


  return user?.claims?.user_role

}

// =====================================
// MAIN MIDDLEWARE FUNCTION
// =====================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and Next.js internals
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  // Create Supabase client for edge runtime
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get user from Supabase (JWT validation happens here)

  const {data:user} = await supabase.auth.getClaims()


  const isAuthenticated = !!user;
  const isPublic = isPublicPath(pathname);


  // =====================================
  // CASE 1: User authenticated, on auth page → Redirect to dashboard
  // =====================================
  if (isAuthenticated && isPublic) {
    const role = getUserRoleFromJWT(user);
   
    const redirectUrl = request.nextUrl.clone();

    if (role && DEFAULT_DASHBOARD[role]) {
      redirectUrl.pathname = DEFAULT_DASHBOARD[role];
    } else {
      // Fallback if role not found
      redirectUrl.pathname = '/contribute/dashboard';
    }

    return NextResponse.redirect(redirectUrl);
  }

  // =====================================
  // CASE 2: User NOT authenticated, on protected page → Redirect to login
  // =====================================
  if (!isAuthenticated && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    // Store intended destination for post-login redirect
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // =====================================
  // CASE 3: User authenticated, check role-based access
  // =====================================
  if (isAuthenticated && !isPublic) {
    const role = getUserRoleFromJWT(user);
    console.log(role)

    // If role is undefined or not a valid role, default to contributor
    const validRoles: AppRole[] = ['super_admin', 'team_member', 'contributor'];
    const effectiveRole: AppRole = role && validRoles.includes(role) ? role : 'contributor';

    // Check if user has access to this path
    if (!hasPathAccess(effectiveRole, pathname)) {
      // Access denied - redirect to appropriate dashboard
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = DEFAULT_DASHBOARD[effectiveRole];
      return NextResponse.redirect(redirectUrl);
    }
  }

  // =====================================
  // CASE 4: All checks passed - allow access
  // =====================================
  return supabaseResponse;
}

// =====================================
// MIDDLEWARE CONFIGURATION
// =====================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - Files with extensions (.png, .jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*$).*)',
  ],
};
