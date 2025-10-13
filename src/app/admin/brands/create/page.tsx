'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandForm } from '@/components/admin/brands/brand-form';
import { useBrandFormStore } from '@/lib/stores/brand-form';
import { useBrandImageStore } from '@/lib/stores/brand-image-upload';
import { toast } from 'react-hot-toast';

/**
 * Brand Create Page
 *
 * Page for creating a new brand
 * Uses BrandForm component with create mode
 */

export default function BrandCreatePage() {
  const router = useRouter();
  const { clearForm } = useBrandFormStore();
  const { resetImages } = useBrandImageStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Clear form on mount (fresh start)
  React.useEffect(() => {
    clearForm();
    resetImages();
  }, [clearForm, resetImages]);

  const handleSubmit = async (data: unknown) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual Supabase API call
      console.log('Creating brand:', data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Brand created successfully!');

      // Clear form and images
      clearForm();
      resetImages();

      // Redirect to brands listing
      router.push('/admin/brands');
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error('Failed to create brand. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (confirm('Are you sure? Unsaved changes will be lost.')) {
      clearForm();
      resetImages();
      router.push('/admin/brands');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={handleBack}
              className="cursor-pointer w-fit"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Brands
            </Button>

            {/* Page Title */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">Create Brand</h1>
              <p className="text-sm text-muted-foreground">
                Add a new perfume brand to the database
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
        <BrandForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
