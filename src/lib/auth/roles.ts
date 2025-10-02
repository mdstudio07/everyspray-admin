// ========================================
// RBAC ROLE UTILITIES AND HELPERS
// ========================================
// Updated role checking utilities with new RBAC types and enhanced functionality

import type { AppRole, AppPermission } from '@/types/rbac.types';

// =====================================
// ROLE CONSTANTS
// =====================================

export const ROLES = {
  CONTRIBUTOR: 'contributor' as const,
  TEAM_MEMBER: 'team_member' as const,
  SUPER_ADMIN: 'super_admin' as const,
} as const;

// =====================================
// BASIC ROLE CHECKING FUNCTIONS
// =====================================

export const isContributor = (role: AppRole): boolean => {
  return role === ROLES.CONTRIBUTOR;
};

export const isTeamMember = (role: AppRole): boolean => {
  return role === ROLES.TEAM_MEMBER;
};

export const isSuperAdmin = (role: AppRole): boolean => {
  return role === ROLES.SUPER_ADMIN;
};

export const isAdmin = (role: AppRole): boolean => {
  return isTeamMember(role) || isSuperAdmin(role);
};

// =====================================
// SECTION ACCESS FUNCTIONS
// =====================================

export const canAccessAdminSection = (role: AppRole): boolean => {
  return isAdmin(role);
};

export const canAccessSuperAdminSection = (role: AppRole): boolean => {
  return isSuperAdmin(role);
};

export const canAccessContributorSection = (role: AppRole): boolean => {
  return isContributor(role) || isSuperAdmin(role); // Super admins can access all sections
};

// =====================================
// ROLE HIERARCHY
// =====================================

export const ROLE_HIERARCHY = {
  [ROLES.CONTRIBUTOR]: 1,
  [ROLES.TEAM_MEMBER]: 2,
  [ROLES.SUPER_ADMIN]: 3,
} as const;

export const hasPermissionLevel = (userRole: AppRole, requiredRole: AppRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

// Get role level for comparison
export const getRoleLevel = (role: AppRole): number => {
  return ROLE_HIERARCHY[role];
};

// Check if role A has higher privileges than role B
export const hasHigherPrivileges = (roleA: AppRole, roleB: AppRole): boolean => {
  return ROLE_HIERARCHY[roleA] > ROLE_HIERARCHY[roleB];
};

// =====================================
// PERMISSION-BASED ACCESS FUNCTIONS
// =====================================

// Static permission mappings (should match database role_permissions)
export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  [ROLES.SUPER_ADMIN]: [
    'perfumes.create', 'perfumes.update', 'perfumes.delete', 'perfumes.approve',
    'brands.create', 'brands.update', 'brands.delete', 'brands.approve',
    'notes.create', 'notes.update', 'notes.delete', 'notes.approve',
    'suggestions.create', 'suggestions.review', 'suggestions.moderate',
    'users.manage', 'users.suspend', 'analytics.view'
  ],
  [ROLES.TEAM_MEMBER]: [
    'perfumes.create', 'perfumes.update',
    'brands.create', 'brands.update',
    'notes.create', 'notes.update',
    'suggestions.create', 'suggestions.review'
  ],
  [ROLES.CONTRIBUTOR]: [
    'suggestions.create'
  ]
};

// Check if role has specific permission
export const roleHasPermission = (role: AppRole, permission: AppPermission): boolean => {
  return ROLE_PERMISSIONS[role].includes(permission);
};

// Get all permissions for a role
export const getRolePermissions = (role: AppRole): AppPermission[] => {
  return ROLE_PERMISSIONS[role];
};

// Check if role has any of the specified permissions
export const roleHasAnyPermission = (role: AppRole, permissions: AppPermission[]): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return permissions.some(permission => rolePermissions.includes(permission));
};

// Check if role has all of the specified permissions
export const roleHasAllPermissions = (role: AppRole, permissions: AppPermission[]): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return permissions.every(permission => rolePermissions.includes(permission));
};

// =====================================
// CAPABILITY CHECKING FUNCTIONS
// =====================================

// Content management capabilities
export const canCreateContent = (role: AppRole): boolean => {
  return roleHasAnyPermission(role, ['perfumes.create', 'brands.create', 'notes.create']);
};

export const canUpdateContent = (role: AppRole): boolean => {
  return roleHasAnyPermission(role, ['perfumes.update', 'brands.update', 'notes.update']);
};

export const canDeleteContent = (role: AppRole): boolean => {
  return roleHasAnyPermission(role, ['perfumes.delete', 'brands.delete', 'notes.delete']);
};

export const canApproveContent = (role: AppRole): boolean => {
  return roleHasAnyPermission(role, ['perfumes.approve', 'brands.approve', 'notes.approve']);
};

// User management capabilities
export const canManageUsers = (role: AppRole): boolean => {
  return roleHasPermission(role, 'users.manage');
};

export const canSuspendUsers = (role: AppRole): boolean => {
  return roleHasPermission(role, 'users.suspend');
};

// Analytics and reporting capabilities
export const canViewAnalytics = (role: AppRole): boolean => {
  return roleHasPermission(role, 'analytics.view');
};

// Moderation capabilities
export const canModerate = (role: AppRole): boolean => {
  return roleHasPermission(role, 'suggestions.moderate');
};

export const canReviewSuggestions = (role: AppRole): boolean => {
  return roleHasPermission(role, 'suggestions.review');
};

// =====================================
// ROLE VALIDATION FUNCTIONS
// =====================================

// Validate if a string is a valid role
export const isValidRole = (role: string): role is AppRole => {
  return Object.values(ROLES).includes(role as AppRole);
};

// Get default role for new users
export const getDefaultRole = (): AppRole => {
  return ROLES.CONTRIBUTOR;
};

// Get all available roles
export const getAllRoles = (): AppRole[] => {
  return Object.values(ROLES);
};

// Get roles that can be assigned by a specific role
export const getAssignableRoles = (assignerRole: AppRole): AppRole[] => {
  switch (assignerRole) {
    case ROLES.SUPER_ADMIN:
      return [ROLES.CONTRIBUTOR, ROLES.TEAM_MEMBER, ROLES.SUPER_ADMIN];
    case ROLES.TEAM_MEMBER:
      return [ROLES.CONTRIBUTOR]; // Team members can only promote to contributor
    default:
      return []; // Contributors cannot assign roles
  }
};

// Check if role A can assign role B
export const canAssignRole = (assignerRole: AppRole, targetRole: AppRole): boolean => {
  const assignableRoles = getAssignableRoles(assignerRole);
  return assignableRoles.includes(targetRole);
};

// =====================================
// ROLE TRANSITION VALIDATION
// =====================================

// Check if role transition is valid
export const isValidRoleTransition = (
  fromRole: AppRole,
  toRole: AppRole,
  assignerRole: AppRole
): { valid: boolean; reason?: string } => {
  // Cannot assign same role
  if (fromRole === toRole) {
    return { valid: false, reason: 'User already has this role' };
  }

  // Check if assigner can assign the target role
  if (!canAssignRole(assignerRole, toRole)) {
    return { valid: false, reason: `You cannot assign the ${toRole} role` };
  }

  // Super admins cannot be demoted by team members
  if (fromRole === ROLES.SUPER_ADMIN && assignerRole === ROLES.TEAM_MEMBER) {
    return { valid: false, reason: 'Team members cannot modify super admin roles' };
  }

  return { valid: true };
};

// =====================================
// ROLE DISPLAY UTILITIES
// =====================================

// Get human-readable role name
export const getRoleDisplayName = (role: AppRole): string => {
  switch (role) {
    case ROLES.CONTRIBUTOR:
      return 'Contributor';
    case ROLES.TEAM_MEMBER:
      return 'Team Member';
    case ROLES.SUPER_ADMIN:
      return 'Super Admin';
    default:
      return 'Unknown Role';
  }
};

// Get role description
export const getRoleDescription = (role: AppRole): string => {
  switch (role) {
    case ROLES.CONTRIBUTOR:
      return 'Can create suggestions and manage their own profile';
    case ROLES.TEAM_MEMBER:
      return 'Can create and update content, review suggestions';
    case ROLES.SUPER_ADMIN:
      return 'Full access to all features including user management';
    default:
      return 'No description available';
  }
};

// Get role badge color for UI
export const getRoleBadgeColor = (role: AppRole): string => {
  switch (role) {
    case ROLES.CONTRIBUTOR:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case ROLES.TEAM_MEMBER:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case ROLES.SUPER_ADMIN:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
};

// =====================================
// BACKWARDS COMPATIBILITY
// =====================================

// Legacy export for existing code
export type UserRole = AppRole;