'use client';

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandForm } from '@/components/admin/brands/brand-form';
import { useBrandFormStore } from '@/lib/stores/brand-form';
import { useBrandImageStore } from '@/lib/stores/brand-image-upload';
import { getBrandById } from '@/lib/data/dummy-brands';
import { toast } from 'react-hot-toast';

/**
 * Brand Edit Page
 *
 * Page for editing an existing brand
 * Uses BrandForm component with edit mode
 * Loads brand data by ID from URL params
 */

export default function BrandEditPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = params.id as string;

  const { loadBrand, clearForm } = useBrandFormStore();
  const { loadExistingImages, resetImages } = useBrandImageStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [brandNotFound, setBrandNotFound] = React.useState(false);

  // Load brand data on mount
  React.useEffect(() => {
    const brand = getBrandById(brandId);

    if (!brand) {
      setBrandNotFound(true);
      setIsLoading(false);
      toast.error('Brand not found');
      return;
    }

    // Load form data
    loadBrand(brand);

    // Load images
    loadExistingImages(brand.logo, brand.bannerImage);

    setIsLoading(false);
  }, [brandId, loadBrand, loadExistingImages]);

  const handleSubmit = async (data: unknown) => {
    setIsSubmitting(true);
    try {
      // TODO: Replace with actual Supabase API call
      console.log('Updating brand:', brandId, data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Brand updated successfully!');

      // Clear form and images
      clearForm();
      resetImages();

      // Redirect to brands listing
      router.push('/admin/brands');
    } catch (error) {
      console.error('Error updating brand:', error);
      toast.error('Failed to update brand. Please try again.');
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading brand...</p>
        </div>
      </div>
    );
  }

  // Brand not found
  if (brandNotFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Brand Not Found</h2>
          <p className="text-muted-foreground">The brand you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/admin/brands')} className="cursor-pointer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Brands
          </Button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold tracking-tight">Edit Brand</h1>
              <p className="text-sm text-muted-foreground">
                Update brand information and settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
        <BrandForm mode="edit" onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
