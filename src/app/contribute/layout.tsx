'use client';

import { RouteProtection } from '@/lib/auth/route-protection';
import ContributorLayout from '@/components/layouts/contributor-layout';

export default function ContributeLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteProtection allowedRoles={['contributor']}>
      <ContributorLayout>
        {children}
      </ContributorLayout>
    </RouteProtection>
  );
}