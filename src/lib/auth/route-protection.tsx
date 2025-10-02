'use client';

// ========================================
// ENHANCED ROUTE PROTECTION WITH RBAC
// ========================================
// Comprehensive route protection system with permission-based access control,
// role hierarchy validation, and production-ready security features.

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { isAllowedPath, getDefaultRedirectPath } from './redirects';
import type { AppRole, AppPermission } from '@/types/rbac.types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// =====================================
// ROUTE PROTECTION INTERFACES
// =====================================

interface RouteProtectionProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  requiredPermissions?: AppPermission[];
  fallbackPath?: string;
  requireAll?: boolean; // If true, user needs ALL permissions; if false, ANY permission
  allowOwnership?: boolean; // Allow access if user owns the resource
  resourceOwnerId?: string; // ID of resource owner for ownership checks
}

interface PermissionGuardProps {
  children: ReactNode;
  permission: AppPermission;
  fallback?: ReactNode;
  className?: string;
}

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
  className?: string;
}

// =====================================
// LOADING COMPONENT
// =====================================

const AuthLoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <LoadingSpinner size="lg" type="loading" />
      <p className="text-muted-foreground text-sm">Verifying access...</p>
    </div>
  </div>
);

// =====================================
// MAIN ROUTE PROTECTION COMPONENT
// =====================================

export function RouteProtection({
  children,
  allowedRoles,
  requiredPermissions,
  fallbackPath,
  requireAll = false,
  allowOwnership = false,
  resourceOwnerId
}: RouteProtectionProps) {
  const {
    user,
    isLoading,
    isInitialized,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized || isLoading) return;

    // Not authenticated - redirect to login
    if (!user) {
      const currentPath = window.location.pathname;
      const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
      return;
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const redirectPath = fallbackPath || getDefaultRedirectPath(user.role);
      console.warn(`Access denied: User role '${user.role}' not in allowed roles:`, allowedRoles);
      router.push(redirectPath);
      return;
    }

    // Check permission-based access
    if (requiredPermissions && requiredPermissions.length > 0) {
      let hasAccess = false;

      if (requireAll) {
        hasAccess = hasAllPermissions(requiredPermissions);
      } else {
        hasAccess = hasAnyPermission(requiredPermissions);
      }

      // Check ownership if allowed and user doesn't have permissions
      if (!hasAccess && allowOwnership && resourceOwnerId) {
        hasAccess = user.id === resourceOwnerId;
      }

      if (!hasAccess) {
        const redirectPath = fallbackPath || getDefaultRedirectPath(user.role);
        console.warn(`Access denied: User lacks required permissions:`, requiredPermissions);
        router.push(redirectPath);
        return;
      }
    }

    // Check path-based access (legacy compatibility)
    const currentPath = window.location.pathname;
    if (!isAllowedPath(user.role, currentPath)) {
      const redirectPath = fallbackPath || getDefaultRedirectPath(user.role);
      console.warn(`Access denied: Path '${currentPath}' not allowed for role '${user.role}'`);
      router.push(redirectPath);
      return;
    }
  }, [
    user,
    isLoading,
    isInitialized,
    allowedRoles,
    requiredPermissions,
    fallbackPath,
    requireAll,
    allowOwnership,
    resourceOwnerId,
    router,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  ]);

  // Show loading state while auth initializes
  if (!isInitialized || isLoading) {
    return <AuthLoadingScreen />;
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Role check failed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  // Permission check failed
  if (requiredPermissions && requiredPermissions.length > 0) {
    let hasAccess = false;

    if (requireAll) {
      hasAccess = hasAllPermissions(requiredPermissions);
    } else {
      hasAccess = hasAnyPermission(requiredPermissions);
    }

    // Check ownership if allowed
    if (!hasAccess && allowOwnership && resourceOwnerId) {
      hasAccess = user.id === resourceOwnerId;
    }

    if (!hasAccess) {
      return null;
    }
  }

  return <>{children}</>;
}

// =====================================
// PERMISSION GUARD COMPONENT
// =====================================

export function PermissionGuard({
  children,
  permission,
  fallback = null,
  className
}: PermissionGuardProps) {
  const { hasPermission } = useAuthStore();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

// =====================================
// ROLE GUARD COMPONENT
// =====================================

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  className
}: RoleGuardProps) {
  const { userRole } = useAuthStore();

  if (!userRole || !allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return (
    <div className={className}>
      {children}
    </div>
  );
}

// =====================================
// HIGHER-ORDER COMPONENTS
// =====================================

// Page-level authentication HOC
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: AppRole[],
  requiredPermissions?: AppPermission[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RouteProtection
        allowedRoles={allowedRoles}
        requiredPermissions={requiredPermissions}
      >
        <WrappedComponent {...props} />
      </RouteProtection>
    );
  };
}

// Permission-based HOC
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: AppPermission,
  fallbackComponent?: React.ComponentType<P>
) {
  return function PermissionProtectedComponent(props: P) {
    const { hasPermission } = useAuthStore();

    if (!hasPermission(permission)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Role-based HOC
export function withRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: AppRole[],
  fallbackComponent?: React.ComponentType<P>
) {
  return function RoleProtectedComponent(props: P) {
    const { userRole } = useAuthStore();

    if (!userRole || !allowedRoles.includes(userRole)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// =====================================
// UTILITY HOOKS
// =====================================

// Hook for checking permissions in components
export function usePermissions() {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    userRole,
    isSuperAdmin,
    isTeamMember,
    isContributor,
    isTeamMemberOrHigher
  } = useAuthStore();

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    permissions,
    userRole,
    isSuperAdmin,
    isTeamMember,
    isContributor,
    isTeamMemberOrHigher,
    canManageUsers: hasPermission('users.manage'),
    canViewAnalytics: hasPermission('analytics.view'),
    canApproveContent: hasAnyPermission(['perfumes.approve', 'brands.approve', 'notes.approve']),
    canCreateContent: hasAnyPermission(['perfumes.create', 'brands.create', 'notes.create']),
    canModerate: hasPermission('suggestions.moderate')
  };
}

// Hook for checking if user can access a specific path
export function usePathAccess() {
  const { userRole } = useAuthStore();
  const router = useRouter();

  const canAccessPath = (path: string): boolean => {
    if (!userRole) return false;
    return isAllowedPath(userRole, path);
  };

  const redirectToAllowedPath = () => {
    if (!userRole) {
      router.push('/login');
      return;
    }
    const defaultPath = getDefaultRedirectPath(userRole);
    router.push(defaultPath);
  };

  return {
    canAccessPath,
    redirectToAllowedPath,
    userRole
  };
}

// =====================================
// VALIDATION UTILITIES
// =====================================

// Validate if user has required access level
export function validateAccess(
  userRole: AppRole | null,
  userPermissions: AppPermission[],
  requirements: {
    allowedRoles?: AppRole[];
    requiredPermissions?: AppPermission[];
    requireAll?: boolean;
  }
): { hasAccess: boolean; reason?: string } {
  if (!userRole) {
    return { hasAccess: false, reason: 'User not authenticated' };
  }

  // Check role requirements
  if (requirements.allowedRoles && !requirements.allowedRoles.includes(userRole)) {
    return {
      hasAccess: false,
      reason: `Role '${userRole}' not in allowed roles: ${requirements.allowedRoles.join(', ')}`
    };
  }

  // Check permission requirements
  if (requirements.requiredPermissions && requirements.requiredPermissions.length > 0) {
    const hasPermissions = requirements.requireAll
      ? requirements.requiredPermissions.every(p => userPermissions.includes(p))
      : requirements.requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermissions) {
      return {
        hasAccess: false,
        reason: `Missing required permissions: ${requirements.requiredPermissions.join(', ')}`
      };
    }
  }

  return { hasAccess: true };
}

// =====================================
// USAGE EXAMPLES
// =====================================

/*
// Page-level protection
export default withAuth(MyPage, ['super_admin'], ['users.manage']);

// Component-level permission check
<PermissionGuard permission="perfumes.create">
  <CreatePerfumeButton />
</PermissionGuard>

// Role-based rendering
<RoleGuard allowedRoles={['super_admin', 'team_member']}>
  <AdminPanel />
</RoleGuard>

// Hook usage
function MyComponent() {
  const { hasPermission, canManageUsers } = usePermissions();

  return (
    <div>
      {hasPermission('perfumes.create') && <CreateButton />}
      {canManageUsers && <UserManagement />}
    </div>
  );
}

// Complex route protection
<RouteProtection
  allowedRoles={['team_member', 'super_admin']}
  requiredPermissions={['perfumes.create', 'brands.create']}
  requireAll={false} // User needs ANY of the permissions
  allowOwnership={true}
  resourceOwnerId={perfume.creator_id}
  fallbackPath="/contribute/dashboard"
>
  <EditPerfumePage />
</RouteProtection>
*/