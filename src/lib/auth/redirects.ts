import type { UserRole } from '@/types/auth.types';
import { ROLES } from './roles';

export const getDefaultRedirectPath = (role: UserRole): string => {
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

export const getLoginRedirectPath = (role: UserRole, intendedPath?: string): string => {
  // If user has intended path and has permission, redirect there
  if (intendedPath && isAllowedPath(role, intendedPath)) {
    return intendedPath;
  }

  // Otherwise redirect to default path for their role
  return getDefaultRedirectPath(role);
};

export const isAllowedPath = (role: UserRole, path: string): boolean => {
  // Public paths (auth pages)
  if (path.startsWith('/login') || path.startsWith('/register')) {
    return true;
  }

  // Contributor paths (allow contributors and super admins for testing)
  if (path.startsWith('/contribute')) {
    return role === ROLES.CONTRIBUTOR || role === ROLES.SUPER_ADMIN;
  }

  // Admin paths (team_member + super_admin)
  if (path.startsWith('/admin')) {
    // Super admin only paths
    if (path.includes('(super-only)') ||
        path.includes('/users') ||
        path.includes('/team-management') ||
        path.includes('/analytics')) {
      return role === ROLES.SUPER_ADMIN;
    }

    // Regular admin paths
    return role === ROLES.TEAM_MEMBER || role === ROLES.SUPER_ADMIN;
  }

  // API routes are handled separately
  if (path.startsWith('/api')) {
    return true;
  }

  // Default to contributor access for root paths
  return true;
};