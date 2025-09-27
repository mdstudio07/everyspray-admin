import type { UserRole } from '@/types/auth.types';

export const ROLES = {
  CONTRIBUTOR: 'contributor',
  TEAM_MEMBER: 'team_member',
  SUPER_ADMIN: 'super_admin',
} as const;

export const isContributor = (role: UserRole): boolean => {
  return role === ROLES.CONTRIBUTOR;
};

export const isTeamMember = (role: UserRole): boolean => {
  return role === ROLES.TEAM_MEMBER;
};

export const isSuperAdmin = (role: UserRole): boolean => {
  return role === ROLES.SUPER_ADMIN;
};

export const isAdmin = (role: UserRole): boolean => {
  return isTeamMember(role) || isSuperAdmin(role);
};

export const canAccessAdminSection = (role: UserRole): boolean => {
  return isAdmin(role);
};

export const canAccessSuperAdminSection = (role: UserRole): boolean => {
  return isSuperAdmin(role);
};

export const canAccessContributorSection = (role: UserRole): boolean => {
  return isContributor(role);
};

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  [ROLES.CONTRIBUTOR]: 1,
  [ROLES.TEAM_MEMBER]: 2,
  [ROLES.SUPER_ADMIN]: 3,
} as const;

export const hasPermissionLevel = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};