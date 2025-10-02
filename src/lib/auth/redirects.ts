// ========================================
// RBAC-ENHANCED REDIRECT UTILITIES
// ========================================
// Updated redirect logic with new RBAC types and enhanced path validation

import type { AppRole } from '@/types/rbac.types';

// =====================================
// ROLE CONSTANTS
// =====================================

const ROLES = {
  CONTRIBUTOR: 'contributor' as const,
  TEAM_MEMBER: 'team_member' as const,
  SUPER_ADMIN: 'super_admin' as const,
} as const;

// =====================================
// DEFAULT REDIRECT PATHS BY ROLE
// =====================================

export const getDefaultRedirectPath = (role: AppRole): string => {
  switch (role) {
    case ROLES.CONTRIBUTOR:
      return '/contribute/dashboard';
    case ROLES.TEAM_MEMBER:
      return '/admin/dashboard';
    case ROLES.SUPER_ADMIN:
      return '/admin/dashboard';
    default:
      return '/contribute/dashboard';
  }
};

// =====================================
// LOGIN REDIRECT LOGIC
// =====================================

export const getLoginRedirectPath = (role: AppRole, intendedPath?: string): string => {
  // If user has intended path and has permission, redirect there
  if (intendedPath && isAllowedPath(role, intendedPath)) {
    return intendedPath;
  }

  // Otherwise redirect to default path for their role
  return getDefaultRedirectPath(role);
};

// =====================================
// PATH ACCESS VALIDATION
// =====================================

export const isAllowedPath = (role: AppRole, path: string): boolean => {
  // Public paths (auth pages, landing pages)
  if (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/auth') ||
    path === '/' ||
    path.startsWith('/ui-testing') // Allow UI testing page for development
  ) {
    return true;
  }

  // Super admin has access to ALL paths
  if (role === ROLES.SUPER_ADMIN) {
    return true;
  }

  // Contributor paths
  if (path.startsWith('/contribute')) {
    return role === ROLES.CONTRIBUTOR;
  }

  // Admin paths (only team_member reaches here, super_admin already passed)
  if (path.startsWith('/admin')) {
    // Super admin only paths - team members can't access
    if (
      path.includes('(super-only)') ||
      path.includes('/users') ||
      path.includes('/team-management') ||
      path.includes('/analytics')
    ) {
      return false; // Team members blocked from super-admin paths
    }

    // Regular admin paths (team members can access)
    return role === ROLES.TEAM_MEMBER;
  }

  // API routes are handled separately by middleware
  if (path.startsWith('/api')) {
    return true;
  }

  // Static assets and other public paths
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.startsWith('/static') ||
    path.includes('.') // Files with extensions (images, etc.)
  ) {
    return true;
  }

  // Default deny for unknown paths
  return false;
};

// =====================================
// ROLE HIERARCHY UTILITIES
// =====================================

// Check if role has higher or equal privileges than required role
export const hasRoleAccess = (userRole: AppRole, requiredRole: AppRole): boolean => {
  const roleHierarchy = {
    [ROLES.CONTRIBUTOR]: 1,
    [ROLES.TEAM_MEMBER]: 2,
    [ROLES.SUPER_ADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Get minimum role required for a path
export const getMinimumRoleForPath = (path: string): AppRole => {
  if (path.startsWith('/contribute')) {
    return ROLES.CONTRIBUTOR;
  }

  if (path.startsWith('/admin')) {
    // Super admin only paths
    if (
      path.includes('(super-only)') ||
      path.includes('/users') ||
      path.includes('/team-management') ||
      path.includes('/analytics')
    ) {
      return ROLES.SUPER_ADMIN;
    }

    // Regular admin paths
    return ROLES.TEAM_MEMBER;
  }

  // Default to contributor for other paths
  return ROLES.CONTRIBUTOR;
};

// =====================================
// NAVIGATION HELPERS
// =====================================

// Get navigation items based on user role
export const getNavigationItems = (role: AppRole) => {
  const baseItems = [
    {
      label: 'Dashboard',
      href: getDefaultRedirectPath(role),
      icon: 'Dashboard',
    },
  ];

  switch (role) {
    case ROLES.CONTRIBUTOR:
      return [
        ...baseItems,
        {
          label: 'Create Perfume',
          href: '/contribute/perfume/create',
          icon: 'Plus',
        },
        {
          label: 'Create Brand',
          href: '/contribute/brand/create',
          icon: 'Plus',
        },
        {
          label: 'My Contributions',
          href: '/contribute/my-contributions',
          icon: 'FileText',
        },
        {
          label: 'Profile',
          href: '/contribute/profile',
          icon: 'User',
        },
        {
          label: 'Achievements',
          href: '/contribute/achievements',
          icon: 'Trophy',
        },
      ];

    case ROLES.TEAM_MEMBER:
      return [
        ...baseItems,
        {
          label: 'Perfumes',
          href: '/admin/perfumes',
          icon: 'Package',
        },
        {
          label: 'Brands',
          href: '/admin/brands',
          icon: 'Tag',
        },
        {
          label: 'Notes',
          href: '/admin/notes',
          icon: 'Database',
        },
        {
          label: 'Moderation',
          href: '/admin/moderation',
          icon: 'Shield',
        },
        {
          label: 'Settings',
          href: '/admin/settings',
          icon: 'Settings',
        },
      ];

    case ROLES.SUPER_ADMIN:
      return [
        ...baseItems,
        {
          label: 'Perfumes',
          href: '/admin/perfumes',
          icon: 'Package',
        },
        {
          label: 'Brands',
          href: '/admin/brands',
          icon: 'Tag',
        },
        {
          label: 'Notes',
          href: '/admin/notes',
          icon: 'Database',
        },
        {
          label: 'Moderation',
          href: '/admin/moderation',
          icon: 'Shield',
        },
        {
          label: 'Users',
          href: '/admin/users',
          icon: 'User',
        },
        {
          label: 'Team Management',
          href: '/admin/team-management',
          icon: 'User',
        },
        {
          label: 'Analytics',
          href: '/admin/analytics',
          icon: 'BarChart3',
        },
        {
          label: 'Settings',
          href: '/admin/settings',
          icon: 'Settings',
        },
      ];

    default:
      return baseItems;
  }
};

// =====================================
// ERROR HANDLING
// =====================================

// Get appropriate error message for access denial
export const getAccessDeniedMessage = (role: AppRole, path: string): string => {
  const requiredRole = getMinimumRoleForPath(path);

  if (role === ROLES.CONTRIBUTOR && requiredRole !== ROLES.CONTRIBUTOR) {
    return 'This page requires admin privileges. Please contact an administrator if you need access.';
  }

  if (role === ROLES.TEAM_MEMBER && requiredRole === ROLES.SUPER_ADMIN) {
    return 'This page is restricted to super administrators only.';
  }

  return 'You do not have permission to access this page.';
};

// Get suggested alternative path for denied access
export const getSuggestedPath = (role: AppRole, deniedPath: string): string => {
  // If user tried to access super admin area but is team member, suggest regular admin
  if (role === ROLES.TEAM_MEMBER && deniedPath.includes('super-only')) {
    return '/admin/dashboard';
  }

  // If user tried to access admin area but is contributor, suggest contributor area
  if (role === ROLES.CONTRIBUTOR && deniedPath.startsWith('/admin')) {
    return '/contribute/dashboard';
  }

  // Default to role-appropriate dashboard
  return getDefaultRedirectPath(role);
};

// =====================================
// VALIDATION UTILITIES
// =====================================

// Validate if a path exists in the application
export const isValidPath = (path: string): boolean => {
  const validPaths = [
    '/',
    '/ui-testing',
    '/login',
    '/register',
    '/contribute/dashboard',
    '/contribute/perfume/create',
    '/contribute/brand/create',
    '/contribute/my-contributions',
    '/contribute/profile',
    '/contribute/achievements',
    '/admin/dashboard',
    '/admin/perfumes',
    '/admin/brands',
    '/admin/notes',
    '/admin/moderation',
    '/admin/settings',
    '/admin/users',
    '/admin/team-management',
    '/admin/analytics',
  ];

  return validPaths.includes(path) || path.startsWith('/api');
};

// Check if redirect would cause a loop
export const wouldCauseRedirectLoop = (
  fromPath: string,
  toPath: string,
  role: AppRole
): boolean => {
  // If redirecting to the same path
  if (fromPath === toPath) {
    return true;
  }

  // If redirecting to a path that would also be denied
  if (!isAllowedPath(role, toPath)) {
    return true;
  }

  return false;
};

// =====================================
// EXPORTS FOR BACKWARDS COMPATIBILITY
// =====================================

export { ROLES };

// Legacy export for existing code
export type UserRole = AppRole;