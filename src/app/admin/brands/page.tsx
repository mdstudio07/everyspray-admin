'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandTable } from '@/components/admin/brands/brand-table';

/**
 * Brands Listing Page
 *
 * Main page for managing brands
 * Features: search, filter, sort, pagination, create, edit, delete
 */

export default function BrandsPage() {
  const router = useRouter();

  const handleCreateBrand = () => {
    router.push('/admin/brands/create');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b bg-background">
        <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
              <p className="text-sm text-muted-foreground">
                Manage perfume brands, view details, and approve submissions
              </p>
            </div>
            <Button onClick={handleCreateBrand} className="cursor-pointer w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Create Brand
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Full Width */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <BrandTable />
      </div>
    </div>
  );
}
