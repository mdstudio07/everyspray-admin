// ========================================
// RBAC TYPES FOR SUPABASE INTEGRATION
// ========================================
// Comprehensive TypeScript types for the production RBAC system

// =====================================
// CORE ENUM TYPES (MATCHING DATABASE)
// =====================================

// User roles - matches public.app_role enum
export type AppRole = 'super_admin' | 'team_member' | 'contributor';

// Granular permissions - matches public.app_permission enum
export type AppPermission =
  // Perfume management
  | 'perfumes.create'
  | 'perfumes.update'
  | 'perfumes.delete'
  | 'perfumes.approve'
  // Brand management
  | 'brands.create'
  | 'brands.update'
  | 'brands.delete'
  | 'brands.approve'
  // Notes management
  | 'notes.create'
  | 'notes.update'
  | 'notes.delete'
  | 'notes.approve'
  // Suggestions management
  | 'suggestions.create'
  | 'suggestions.review'
  | 'suggestions.moderate'
  // User and system management
  | 'users.manage'
  | 'users.suspend'
  | 'analytics.view';

// Trust levels for user progression
export type TrustLevel = 'new' | 'trusted' | 'expert';

// =====================================
// DATABASE TABLE INTERFACES
// =====================================

// User roles table interface
export interface UserRoleRecord {
  id: number;
  user_id: string;
  role: AppRole;
  assigned_at: string;
  assigned_by: string | null;
}

// Role permissions mapping interface
export interface RolePermission {
  id: number;
  role: AppRole;
  permission: AppPermission;
}

// Role audit log interface
export interface RoleAuditLog {
  id: number;
  user_id: string;
  old_role: AppRole | null;
  new_role: AppRole | null;
  changed_by: string;
  reason: string | null;
  changed_at: string;
}

// Extended user profile interface
export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  country: string | null;
  bio: string | null;
  is_suspended: boolean;
  contribution_count: number;
  approval_rate: number;
  trust_level: TrustLevel;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

// Public user profile (safe for exposure)
export interface PublicUserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  contribution_count: number;
  trust_level: TrustLevel;
  created_at: string;
}

// =====================================
// JWT CLAIMS INTERFACE
// =====================================

// JWT token claims structure
export interface JWTClaims {
  sub: string; // User ID
  email: string;
  user_role: AppRole;
  aal: string; // Authentication Assurance Level
  amr: string[]; // Authentication Methods References
  iss: string; // Issuer
  aud: string; // Audience
  exp: number; // Expiration time
  iat: number; // Issued at
  session_id?: string;
}

// =====================================
// ENHANCED AUTH INTERFACES
// =====================================

// Enhanced user interface with role and profile
export interface AuthUser {
  id: string;
  email: string;
  role: AppRole;
  profile: UserProfile | null;
  permissions: AppPermission[];
  created_at: string;
  updated_at: string;
}

// Enhanced auth state with RBAC support
export interface AuthState {
  user: AuthUser | null;
  userRole: AppRole | null;
  permissions: AppPermission[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// =====================================
// PERMISSION CHECKING INTERFACES
// =====================================

// Permission check result
export interface PermissionCheck {
  permission: AppPermission;
  granted: boolean;
  reason?: string;
}

// Batch permission check result
export interface BatchPermissionCheck {
  permissions: PermissionCheck[];
  allGranted: boolean;
  anyGranted: boolean;
}

// Role capability summary
export interface RoleCapabilities {
  role: AppRole;
  permissions: AppPermission[];
  canManageUsers: boolean;
  canApproveContent: boolean;
  canViewAnalytics: boolean;
  canModerate: boolean;
}

// =====================================
// AUTH STORE INTERFACES
// =====================================

// Auth store actions interface
export interface AuthActions {
  // Authentication methods
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;

  // Permission methods
  hasPermission: (permission: AppPermission) => boolean;
  hasAnyPermission: (permissions: AppPermission[]) => boolean;
  hasAllPermissions: (permissions: AppPermission[]) => boolean;

  // Role checking methods
  isSuperAdmin: () => boolean;
  isTeamMember: () => boolean;
  isContributor: () => boolean;
  isTeamMemberOrHigher: () => boolean;

  // Profile methods
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;

  // Role management (super admin only)
  changeUserRole: (userId: string, newRole: AppRole, reason?: string) => Promise<{ error?: string }>;
  suspendUser: (userId: string, reason?: string) => Promise<{ error?: string }>;

  // Internal helpers
  extractRoleFromJWT: (accessToken: string) => AppRole | null;
  refreshPermissions: () => Promise<void>;
  clearError: () => void;
}

// Combined auth store interface
export interface AuthStore extends AuthState, AuthActions {}

// =====================================
// API RESPONSE INTERFACES
// =====================================

// Supabase auth response
export interface SupabaseAuthResponse {
  user: {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
  } | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    user: unknown;
  } | null;
}

// Profile update response
export interface ProfileUpdateResponse {
  success: boolean;
  profile?: UserProfile;
  error?: string;
}

// Role change response
export interface RoleChangeResponse {
  success: boolean;
  old_role?: AppRole;
  new_role?: AppRole;
  audit_entry?: RoleAuditLog;
  error?: string;
}

// =====================================
// FORM AND INPUT INTERFACES
// =====================================

// Login form data
export interface LoginForm {
  email: string;
  password: string;
  remember?: boolean;
}

// Registration form data
export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  username?: string;
  fullName?: string;
}

// Profile update form data
export interface ProfileUpdateForm {
  username?: string;
  full_name?: string;
  bio?: string;
  country?: string;
  avatar_url?: string;
}

// Role change form data
export interface RoleChangeForm {
  user_id: string;
  new_role: AppRole;
  reason?: string;
}

// =====================================
// UTILITY TYPES
// =====================================

// Resource ownership check
export interface ResourceOwnership {
  resource_id: string;
  owner_id: string;
  resource_type: string;
}

// Permission context for complex authorization
export interface PermissionContext {
  resource?: ResourceOwnership;
  conditions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// Role hierarchy mapping
export interface RoleHierarchy {
  role: AppRole;
  level: number;
  inherits_from: AppRole[];
  can_assign_roles: AppRole[];
}

// =====================================
// ERROR INTERFACES
// =====================================

// Auth error types
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'PERMISSION_DENIED'
  | 'ROLE_CHANGE_FAILED'
  | 'PROFILE_UPDATE_FAILED'
  | 'SESSION_EXPIRED'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

// Detailed auth error
export interface AuthError {
  code: AuthErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// =====================================
// CONSTANTS AND DEFAULTS
// =====================================

// Default permissions by role
export const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  super_admin: [
    'perfumes.create', 'perfumes.update', 'perfumes.delete', 'perfumes.approve',
    'brands.create', 'brands.update', 'brands.delete', 'brands.approve',
    'notes.create', 'notes.update', 'notes.delete', 'notes.approve',
    'suggestions.create', 'suggestions.review', 'suggestions.moderate',
    'users.manage', 'users.suspend', 'analytics.view'
  ],
  team_member: [
    'perfumes.create', 'perfumes.update',
    'brands.create', 'brands.update',
    'notes.create', 'notes.update',
    'suggestions.create', 'suggestions.review'
  ],
  contributor: [
    'suggestions.create'
  ]
};

// Role hierarchy levels
export const ROLE_LEVELS: Record<AppRole, number> = {
  contributor: 1,
  team_member: 2,
  super_admin: 3
};

// Default trust level progression
export const TRUST_LEVEL_THRESHOLDS = {
  trusted: { contribution_count: 10, approval_rate: 80 },
  expert: { contribution_count: 50, approval_rate: 90 }
} as const;

// =====================================
// TYPE GUARDS
// =====================================

// Type guard for AppRole
export function isValidAppRole(role: string): role is AppRole {
  return ['super_admin', 'team_member', 'contributor'].includes(role);
}

// Type guard for AppPermission
export function isValidAppPermission(permission: string): permission is AppPermission {
  const validPermissions: AppPermission[] = [
    'perfumes.create', 'perfumes.update', 'perfumes.delete', 'perfumes.approve',
    'brands.create', 'brands.update', 'brands.delete', 'brands.approve',
    'notes.create', 'notes.update', 'notes.delete', 'notes.approve',
    'suggestions.create', 'suggestions.review', 'suggestions.moderate',
    'users.manage', 'users.suspend', 'analytics.view'
  ];
  return validPermissions.includes(permission as AppPermission);
}

// Type guard for TrustLevel
export function isValidTrustLevel(level: string): level is TrustLevel {
  return ['new', 'trusted', 'expert'].includes(level);
}

// =====================================
// BACKWARDS COMPATIBILITY
// =====================================

// Legacy UserRole type (for existing code compatibility)
export type UserRole = AppRole;

// Legacy User interface (for existing code compatibility)
export interface User {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// Legacy Permission interface (for existing code compatibility)
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  roles: UserRole[];
}