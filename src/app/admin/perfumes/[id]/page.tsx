'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PerfumeForm } from '@/components/admin/perfumes/perfume-form';
import { usePerfumeTableStore } from '@/lib/stores/perfume-table';
import { getPerfumeById, type Perfume } from '@/lib/data/dummy-perfumes';
import { toast } from 'react-hot-toast';

/**
 * Edit Perfume Page
 *
 * Professional full-page layout for editing existing perfumes
 * Follows Rule 41-55: Proper spacing, hierarchy, and responsive design
 * Fetches and prefills form with existing perfume data
 */

export default function EditPerfumePage() {
  const router = useRouter();
  const params = useParams();
  const perfumeId = params.id as string;

  const { refreshData } = usePerfumeTableStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [perfume, setPerfume] = React.useState<Perfume | null>(null);

  // Fetch perfume data directly by ID (works on reload)
  React.useEffect(() => {
    const fetchPerfume = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with actual Supabase query
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Fetch directly by ID - works even after page reload
        const foundPerfume = getPerfumeById(perfumeId);

        if (!foundPerfume) {
          toast.error('Perfume not found');
          router.push('/admin/perfumes');
          return;
        }

        setPerfume(foundPerfume);
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to load perfume');
        router.push('/admin/perfumes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerfume();
  }, [perfumeId, router]);

  const handleCancel = () => {
    router.push('/admin/perfumes');
  };

  const handleSubmit = async (data: Partial<Perfume>, isDraft: boolean) => {
    setIsSubmitting(true);

    try {
      // Update perfume object
      const updatedPerfume: Partial<Perfume> = {
        ...perfume,
        ...data,
        slug: data.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || perfume?.slug || '',
        status: isDraft ? 'draft' : 'pending_approval',
        updatedAt: new Date().toISOString(),
      };

      console.log('Updating perfume:', updatedPerfume);

      // TODO: Replace with actual Supabase mutation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Perfume ${isDraft ? 'saved as draft' : 'submitted for approval'}!`);

      // Refresh table data
      refreshData();

      // Navigate back to perfumes list
      router.push('/admin/perfumes');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to update perfume');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state - Professional skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4">
              <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
              <div className="space-y-2">
                <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-96 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Skeleton - Full width aligned with heading */}
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border bg-card p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center gap-6 py-16">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              <div className="space-y-2 text-center">
                <p className="text-lg font-medium">Loading perfume data...</p>
                <p className="text-sm text-muted-foreground">Please wait while we fetch the details</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found - Already handled by redirect, but safety check
  if (!perfume) {
    return null;
  }

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
              <h1 className="text-3xl font-bold tracking-tight">Edit Perfume</h1>
              <p className="text-sm text-muted-foreground">
                Update perfume details for <span className="font-medium text-foreground">{perfume.name}</span>. All changes require approval.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full width aligned with heading */}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <PerfumeForm
          initialData={perfume}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          isEditing
        />
      </div>
    </div>
  );
}
