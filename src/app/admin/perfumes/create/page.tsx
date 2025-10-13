'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PerfumeForm } from '@/components/admin/perfumes/perfume-form';
import { usePerfumeTableStore } from '@/lib/stores/perfume-table';
import type { Perfume } from '@/lib/data/dummy-perfumes';
import { toast } from 'react-hot-toast';

/**
 * Create Perfume Page
 *
 * Professional full-page layout for creating new perfumes
 * Follows Rule 41-55: Proper spacing, hierarchy, and responsive design
 */

export default function CreatePerfumePage() {
  const router = useRouter();
  const { refreshData } = usePerfumeTableStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleCancel = () => {
    router.push('/admin/perfumes');
  };

  const handleSubmit = async (data: Partial<Perfume>, isDraft: boolean) => {
    setIsSubmitting(true);

    try {
      // Create perfume object
      const newPerfume: Partial<Perfume> = {
        id: `perfume-${Date.now()}`,
        ...data,
        slug: data.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || '',
        brandId: 'brand-temp', // TODO: Link to actual brand
        status: isDraft ? 'draft' : 'pending_approval',
        createdBy: 'user-current', // TODO: Get from auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Creating perfume:', newPerfume);

      // TODO: Replace with actual Supabase mutation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Perfume ${isDraft ? 'saved as draft' : 'submitted for approval'}!`);

      // Refresh table data
      refreshData();

      // Navigate back to perfumes list
      router.push('/admin/perfumes');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to create perfume');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header - Fixed at top */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="w-fit cursor-pointer hover:bg-accent"
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Perfumes
            </Button>

            {/* Title Section */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Create New Perfume</h1>
              <p className="text-sm text-muted-foreground">
                Add a new perfume to the database. All fields marked with * are required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full width */}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PerfumeForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
