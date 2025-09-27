'use client';

import { RouteProtection } from '@/lib/auth/route-protection';
import AdminLayout from '@/components/layouts/admin-layout';

export default function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtection allowedRoles={['team_member', 'super_admin']}>
      <AdminLayout>
        {children}
      </AdminLayout>
    </RouteProtection>
  );
}