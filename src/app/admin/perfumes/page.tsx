'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UniversalSearch, type SearchResult } from '@/components/common/universal-search';
import { PerfumeTable } from '@/components/admin/perfumes/perfume-table';
import type { Perfume } from '@/lib/data/dummy-perfumes';


export default function AdminPerfumesPage() {
  const router = useRouter();

  // Handle universal search selection
  const handleSearchSelect = React.useCallback(
    (result: SearchResult) => {
      console.log('Selected:', result);

      // Navigate based on result type
      switch (result.type) {
        case 'perfume':
          router.push(`/admin/perfumes/${result.id}`);
          break;
        case 'brand':
          router.push(`/admin/brands/${result.id}`);
          break;
        case 'note':
          router.push(`/admin/notes/${result.id}`);
          break;
      }
    },
    [router]
  );

  // Handle perfume view
  const handleViewPerfume = React.useCallback(
    (perfume: Perfume) => {
      console.log('View perfume:', perfume.id);
      // TODO: Create view-only perfume detail page
      router.push(`/admin/perfumes/${perfume.id}`);
    },
    [router]
  );

  // Handle perfume edit
  const handleEditPerfume = React.useCallback(
    (perfume: Perfume) => {
      console.log('Edit perfume:', perfume.id);
      router.push(`/admin/perfumes/${perfume.id}`);
    },
    [router]
  );

  // Handle add new perfume
  const handleAddPerfume = () => {
    router.push('/admin/perfumes/create');
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Page Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Perfumes</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                View, edit, and manage all perfume entries in the database
              </p>
            </div>

            {/* Add Button */}
            <Button onClick={handleAddPerfume} size="default" className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Add Perfume
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Universal Search Section */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Quick Search</h2>
                <p className="text-sm text-muted-foreground">
                  Search across perfumes, brands, and notes
                </p>
              </div>
              <UniversalSearch
                placeholder="Search perfumes, brands, notes..."
                onSelect={handleSearchSelect}
                maxResults={8}
                className="max-w-2xl"
              />
            </div>
          </Card>

          <Separator />

          {/* Perfume Table Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">All Perfumes</h2>
              <p className="text-sm text-muted-foreground">
                Filter, sort, and manage perfume entries
              </p>
            </div>

            <PerfumeTable onView={handleViewPerfume} onEdit={handleEditPerfume} />
          </div>
        </div>
      </div>

    </div>
  );
}
