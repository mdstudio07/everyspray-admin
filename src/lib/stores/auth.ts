// ========================================
// PRODUCTION-READY ZUSTAND AUTH STORE WITH RBAC
// ========================================
// Complete RBAC implementation with permission caching, JWT handling,
// and comprehensive error handling for production use.

import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';
import { createClient } from '@/lib/supabase/client';
import type {
  AuthStore,
  AuthUser,
  AppRole,
  AppPermission,
  JWTClaims,
  UserProfile,
  AuthError,
  AuthErrorCode
} from '@/types/rbac.types';

// =====================================
// PERMISSION CACHE AND UTILITIES
// =====================================

// Permission cache to reduce database calls
const permissionCache = new Map<AppRole, AppPermission[]>();

// Initialize permission cache with static mappings
const initializePermissionCache = (): void => {
  const rolePermissions: Record<AppRole, AppPermission[]> = {
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

  Object.entries(rolePermissions).forEach(([role, permissions]) => {
    permissionCache.set(role as AppRole, permissions);
  });
};

// Initialize cache on module load
initializePermissionCache();

// =====================================
// JWT AND ROLE EXTRACTION UTILITIES
// =====================================

// Safely extract role from JWT token
const extractRoleFromJWT = (accessToken: string): AppRole | null => {
  try {
    const decoded = jwtDecode<JWTClaims>(accessToken);

    // Validate token expiration
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      console.warn('JWT token has expired');
      return null;
    }

    // Validate role claim
    const role = decoded.user_role;
    if (!role || !['super_admin', 'team_member', 'contributor'].includes(role)) {
      console.warn('Invalid or missing user_role in JWT:', role);
      return 'contributor'; // Default fallback
    }

    return role;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

// Get permissions for a role from cache
const getPermissionsForRole = (role: AppRole): AppPermission[] => {
  return permissionCache.get(role) || [];
};

// =====================================
// ERROR HANDLING UTILITIES
// =====================================

// Create standardized auth error
const createAuthError = (code: AuthErrorCode, message: string, details?: Record<string, unknown>): AuthError => ({
  code,
  message,
  details,
  timestamp: new Date().toISOString()
});

// Transform Supabase errors to our error format
const transformSupabaseError = (error: unknown): AuthError => {
  const message = (error as { message?: string })?.message || 'An unknown error occurred';

  // Map common Supabase error messages to our error codes
  if (message.includes('Invalid login credentials') || message.includes('invalid credentials')) {
    return createAuthError('INVALID_CREDENTIALS', 'Invalid email or password');
  }
  if (message.includes('User not found')) {
    return createAuthError('USER_NOT_FOUND', 'User account not found');
  }
  if (message.includes('already registered') || message.includes('already exists')) {
    return createAuthError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists');
  }
  if (message.includes('Password should be at least')) {
    return createAuthError('WEAK_PASSWORD', 'Password must be at least 6 characters long');
  }
  if (message.includes('Denied')) {
    return createAuthError('PERMISSION_DENIED', 'Permission denied');
  }

  return createAuthError('UNKNOWN_ERROR', message, { originalError: String(error) });
};

// =====================================
// ZUSTAND AUTH STORE IMPLEMENTATION
// =====================================

export const useAuthStore = create<AuthStore>((set, get) => ({
  // =====================================
  // STATE
  // =====================================
  user: null,
  userRole: null,
  permissions: [],
  isLoading: true,
  isInitialized: false,
  error: null,

  // =====================================
  // AUTHENTICATION METHODS
  // =====================================

  signIn: async (email: string, password: string) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const authError = transformSupabaseError(error);
        set({ error: authError.message, isLoading: false });
        return { error: authError.message };
      }

      if (data.user && data.session) {
        // Extract role from JWT
        const role = extractRoleFromJWT(data.session.access_token);

        if (!role) {
          const authError = createAuthError('INVALID_CREDENTIALS', 'Unable to determine user role');
          set({ error: authError.message, isLoading: false });
          return { error: authError.message };
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users_profile')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.warn('Could not fetch user profile:', profileError);
        }

        // Normalize profile data to match UserProfile type
        const normalizedProfile: UserProfile | null = profileData ? {
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          country: profileData.country,
          bio: profileData.bio,
          last_login: profileData.last_login,
          is_suspended: profileData.is_suspended ?? false,
          contribution_count: profileData.contribution_count ?? 0,
          approval_rate: profileData.approval_rate ?? 0,
          trust_level: (profileData.trust_level as 'new' | 'trusted' | 'expert') ?? 'new',
          created_at: profileData.created_at ?? new Date().toISOString(),
          updated_at: profileData.updated_at ?? new Date().toISOString(),
        } : null;

        // Create auth user object
        const authUser: AuthUser = {
          id: data.user.id,
          email: data.user.email || '',
          role,
          profile: normalizedProfile,
          permissions: getPermissionsForRole(role),
          created_at: data.user.created_at,
          updated_at: data.user.updated_at || data.user.created_at,
        };

        set({
          user: authUser,
          userRole: role,
          permissions: getPermissionsForRole(role),
          isLoading: false,
          error: null
        });

        return {};
      }

      const authError = createAuthError('INVALID_CREDENTIALS', 'Authentication failed');
      set({ error: authError.message, isLoading: false });
      return { error: authError.message };

    } catch (error) {
      const authError = transformSupabaseError(error);
      set({ error: authError.message, isLoading: false });
      return { error: authError.message };
    }
  },

  signUp: async (email: string, password: string, metadata: Record<string, unknown> = {}) => {
    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) {
        const authError = transformSupabaseError(error);
        set({ error: authError.message, isLoading: false });
        return { error: authError.message };
      }

      set({ isLoading: false });
      return {};

    } catch (error) {
      const authError = transformSupabaseError(error);
      set({ error: authError.message, isLoading: false });
      return { error: authError.message };
    }
  },

  signOut: async () => {
    const supabase = createClient();
    set({ isLoading: true });

    try {
      await supabase.auth.signOut();
      set({
        user: null,
        userRole: null,
        permissions: [],
        error: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Error signing out:', error);
      // Force logout on error
      set({
        user: null,
        userRole: null,
        permissions: [],
        isLoading: false
      });
    }
  },

  initialize: async () => {
    const supabase = createClient();
    set({ isLoading: true });

    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && session?.access_token) {
        const role = extractRoleFromJWT(session.access_token);

        if (role) {
          // Fetch user profile
          const { data: profileData } = await supabase
            .from('users_profile')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Normalize profile data
          const normalizedProfile: UserProfile | null = profileData ? {
            id: profileData.id,
            username: profileData.username,
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
            country: profileData.country,
            bio: profileData.bio,
            last_login: profileData.last_login,
            is_suspended: profileData.is_suspended ?? false,
            contribution_count: profileData.contribution_count ?? 0,
            approval_rate: profileData.approval_rate ?? 0,
            trust_level: (profileData.trust_level as 'new' | 'trusted' | 'expert') ?? 'new',
            created_at: profileData.created_at ?? new Date().toISOString(),
            updated_at: profileData.updated_at ?? new Date().toISOString(),
          } : null;

          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            role,
            profile: normalizedProfile,
            permissions: getPermissionsForRole(role),
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at,
          };

          set({
            user: authUser,
            userRole: role,
            permissions: getPermissionsForRole(role),
            isLoading: false,
            isInitialized: true
          });
        } else {
          set({ user: null, userRole: null, permissions: [], isLoading: false, isInitialized: true });
        }
      } else {
        set({ user: null, userRole: null, permissions: [], isLoading: false, isInitialized: true });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user && session?.access_token) {
          const role = extractRoleFromJWT(session.access_token);

          if (role) {
            const { data: profileData } = await supabase
              .from('users_profile')
              .select('*')
              .eq('id', session.user.id)
              .single();

            // Normalize profile data
            const normalizedProfile: UserProfile | null = profileData ? {
              id: profileData.id,
              username: profileData.username,
              full_name: profileData.full_name,
              avatar_url: profileData.avatar_url,
              country: profileData.country,
              bio: profileData.bio,
              last_login: profileData.last_login,
              is_suspended: profileData.is_suspended ?? false,
              contribution_count: profileData.contribution_count ?? 0,
              approval_rate: profileData.approval_rate ?? 0,
              trust_level: (profileData.trust_level as 'new' | 'trusted' | 'expert') ?? 'new',
              created_at: profileData.created_at ?? new Date().toISOString(),
              updated_at: profileData.updated_at ?? new Date().toISOString(),
            } : null;

            const authUser: AuthUser = {
              id: session.user.id,
              email: session.user.email || '',
              role,
              profile: normalizedProfile,
              permissions: getPermissionsForRole(role),
              created_at: session.user.created_at,
              updated_at: session.user.updated_at || session.user.created_at,
            };

            set({
              user: authUser,
              userRole: role,
              permissions: getPermissionsForRole(role),
              error: null
            });
          }
        } else {
          set({
            user: null,
            userRole: null,
            permissions: [],
            error: null
          });
        }
      });

    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, userRole: null, permissions: [], isLoading: false, isInitialized: true });
    }
  },

  // =====================================
  // PERMISSION CHECKING METHODS
  // =====================================

  hasPermission: (permission: AppPermission) => {
    const { permissions } = get();
    return permissions.includes(permission);
  },

  hasAnyPermission: (permissionsToCheck: AppPermission[]) => {
    const { permissions } = get();
    return permissionsToCheck.some(permission => permissions.includes(permission));
  },

  hasAllPermissions: (permissionsToCheck: AppPermission[]) => {
    const { permissions } = get();
    return permissionsToCheck.every(permission => permissions.includes(permission));
  },

  // =====================================
  // ROLE CHECKING METHODS
  // =====================================

  isSuperAdmin: () => {
    const { userRole } = get();
    return userRole === 'super_admin';
  },

  isTeamMember: () => {
    const { userRole } = get();
    return userRole === 'team_member';
  },

  isContributor: () => {
    const { userRole } = get();
    return userRole === 'contributor';
  },

  isTeamMemberOrHigher: () => {
    const { userRole } = get();
    return userRole === 'team_member' || userRole === 'super_admin';
  },

  // =====================================
  // PROFILE MANAGEMENT METHODS
  // =====================================

  updateProfile: async (data: Partial<UserProfile>) => {
    const { user } = get();
    if (!user) {
      return { error: 'User not authenticated' };
    }

    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { data: updatedProfile, error } = await supabase
        .from('users_profile')
        .update(data as never) // Type assertion for Supabase update
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        const authError = transformSupabaseError(error);
        set({ error: authError.message, isLoading: false });
        return { error: authError.message };
      }

      // Normalize updated profile
      const normalizedProfile: UserProfile | null = updatedProfile ? {
        id: updatedProfile.id,
        username: updatedProfile.username,
        full_name: updatedProfile.full_name,
        avatar_url: updatedProfile.avatar_url,
        country: updatedProfile.country,
        bio: updatedProfile.bio,
        last_login: updatedProfile.last_login,
        is_suspended: updatedProfile.is_suspended ?? false,
        contribution_count: updatedProfile.contribution_count ?? 0,
        approval_rate: updatedProfile.approval_rate ?? 0,
        trust_level: (updatedProfile.trust_level as 'new' | 'trusted' | 'expert') ?? 'new',
        created_at: updatedProfile.created_at ?? new Date().toISOString(),
        updated_at: updatedProfile.updated_at ?? new Date().toISOString(),
      } : null;

      // Update user in store
      const updatedUser: AuthUser = {
        ...user,
        profile: normalizedProfile
      };

      set({ user: updatedUser, isLoading: false });
      return {};

    } catch (error) {
      const authError = transformSupabaseError(error);
      set({ error: authError.message, isLoading: false });
      return { error: authError.message };
    }
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    const supabase = createClient();

    try {
      const { data: profileData } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        // Normalize profile data
        const normalizedProfile: UserProfile = {
          id: profileData.id,
          username: profileData.username,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          country: profileData.country,
          bio: profileData.bio,
          last_login: profileData.last_login,
          is_suspended: profileData.is_suspended ?? false,
          contribution_count: profileData.contribution_count ?? 0,
          approval_rate: profileData.approval_rate ?? 0,
          trust_level: (profileData.trust_level as 'new' | 'trusted' | 'expert') ?? 'new',
          created_at: profileData.created_at ?? new Date().toISOString(),
          updated_at: profileData.updated_at ?? new Date().toISOString(),
        };

        const updatedUser: AuthUser = {
          ...user,
          profile: normalizedProfile
        };
        set({ user: updatedUser });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },

  // =====================================
  // ROLE MANAGEMENT METHODS (SUPER ADMIN ONLY)
  // =====================================

  changeUserRole: async (userId: string, newRole: AppRole) => {
    const { userRole } = get();
    if (userRole !== 'super_admin') {
      return { error: 'Permission denied: Only super admins can change user roles' };
    }

    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole } as never) // Type assertion for Supabase update
        .eq('user_id', userId);

      if (error) {
        const authError = transformSupabaseError(error);
        set({ error: authError.message, isLoading: false });
        return { error: authError.message };
      }

      set({ isLoading: false });
      return {};

    } catch (error) {
      const authError = transformSupabaseError(error);
      set({ error: authError.message, isLoading: false });
      return { error: authError.message };
    }
  },

  suspendUser: async (userId: string) => {
    const { userRole } = get();
    if (userRole !== 'super_admin') {
      return { error: 'Permission denied: Only super admins can suspend users' };
    }

    const supabase = createClient();
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase
        .from('users_profile')
        .update({ is_suspended: true } as never) // Type assertion for Supabase update
        .eq('id', userId);

      if (error) {
        const authError = transformSupabaseError(error);
        set({ error: authError.message, isLoading: false });
        return { error: authError.message };
      }

      set({ isLoading: false });
      return {};

    } catch (error) {
      const authError = transformSupabaseError(error);
      set({ error: authError.message, isLoading: false });
      return { error: authError.message };
    }
  },

  // =====================================
  // UTILITY METHODS
  // =====================================

  extractRoleFromJWT,

  refreshPermissions: async () => {
    const { userRole } = get();
    if (userRole) {
      const permissions = getPermissionsForRole(userRole);
      set({ permissions });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));