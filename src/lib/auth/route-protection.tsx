'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/auth';
import { isAllowedPath, getDefaultRedirectPath } from './redirects';
import type { UserRole } from '@/types/auth.types';

interface RouteProtectionProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[] | undefined;
  fallbackPath?: string;
}

export function RouteProtection({
  children,
  allowedRoles,
  fallbackPath
}: RouteProtectionProps) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  
  useEffect(() => {
    if (isLoading) return;

    // Not authenticated
    if (!user) {
      router.push('/login');
      return;
    }

    // Check role-based access
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      const redirectPath = fallbackPath || getDefaultRedirectPath(user.role);
      router.push(redirectPath);
      return;
    }

    // Check path-based access
    const currentPath = window.location.pathname;
    if (!isAllowedPath(user.role, currentPath)) {
      const redirectPath = fallbackPath || getDefaultRedirectPath(user.role);
      router.push(redirectPath);
      return;
    }
  }, [user, isLoading, allowedRoles, fallbackPath, router]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Role check failed
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

// Higher-order component for page-level protection
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <RouteProtection allowedRoles={allowedRoles}>
        <WrappedComponent {...props} />
      </RouteProtection>
    );
  };
}