'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useBrandFormStore } from '@/lib/stores/brand-form';
import {
  useBrandImageStore,
  createImagePreview,
  validateImageFile,
  BRAND_IMAGE_DIMENSIONS,
} from '@/lib/stores/brand-image-upload';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

/**
 * Brand Form Component
 *
 * Comprehensive form for creating/editing brands
 * Features: validation, image upload, auto-save, proper layout
 */

const brandFormSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  foundedYear: z.number().min(1700, 'Year must be after 1700').max(2025, 'Year cannot be in future'),
  country: z.string().min(2, 'Country is required'),
  founder: z.string().min(2, 'Founder name is required'),
  website: z.string().url('Must be a valid URL').or(z.literal('')),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected']),
  verifiedData: z.boolean(),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

interface BrandFormProps {
  mode: 'create' | 'edit';
  onSubmit: (data: BrandFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
}

export function BrandForm({ mode, onSubmit, isSubmitting = false }: BrandFormProps) {
  const router = useRouter();
  const { formData, setField, resetForm } = useBrandFormStore();
  const {
    logoPreview,
    logoUrl,
    bannerPreview,
    bannerUrl,
    setLogo,
    setBanner,
    removeLogo,
    removeBanner,
  } = useBrandImageStore();

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: formData.name,
      slug: formData.slug,
      description: formData.description,
      foundedYear: formData.foundedYear || 2000,
      country: formData.country,
      founder: formData.founder,
      website: formData.website,
      status: formData.status,
      verifiedData: formData.verifiedData,
    },
  });

  // Auto-generate slug from name
  const watchName = form.watch('name');
  React.useEffect(() => {
    if (mode === 'create' && watchName) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      form.setValue('slug', slug);
      setField('slug', slug);
    }
  }, [watchName, mode, form, setField]);

  // Persist form data on change (debounced)
  const debouncedSave = React.useMemo(
    () => {
      let timeout: NodeJS.Timeout;
      return (data: Partial<BrandFormValues>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
              setField(key as keyof typeof formData, value as never);
            }
          });
        }, 500);
      };
    },
    [setField]
  );

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      debouncedSave(value as Partial<BrandFormValues>);
    });
    return () => subscription.unsubscribe();
  }, [form, debouncedSave]);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    const preview = createImagePreview(file);
    setLogo(file, preview);
    toast.success('Logo selected');
  };

  // Handle banner upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    const preview = createImagePreview(file);
    setBanner(file, preview);
    toast.success('Banner selected');
  };

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data) => {
    // Check if images are uploaded
    if (!logoPreview && !logoUrl) {
      toast.error('Please upload a brand logo');
      return;
    }
    if (!bannerPreview && !bannerUrl) {
      toast.error('Please upload a banner image');
      return;
    }

    await onSubmit(data);
  });

  // Handle cancel
  const handleCancel = () => {
    if (confirm('Are you sure? Unsaved changes will be lost.')) {
      resetForm();
      router.push('/admin/brands');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Brand Images */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Images</CardTitle>
          <CardDescription>Upload logo and banner image for the brand</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo ({BRAND_IMAGE_DIMENSIONS.logo.description})</Label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              {(logoPreview || logoUrl) ? (
                <div className="relative h-32 w-32 rounded-lg border bg-muted overflow-hidden">
                  <img
                    src={logoPreview || logoUrl || ''}
                    alt="Logo preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 hover:bg-muted transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="mt-2 text-xs text-muted-foreground">Upload Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              )}
              <div className="flex-1 space-y-1">
                <p className="text-sm text-muted-foreground">
                  Recommended: {BRAND_IMAGE_DIMENSIONS.logo.width}x{BRAND_IMAGE_DIMENSIONS.logo.height}px
                </p>
                <p className="text-sm text-muted-foreground">
                  Max file size: 5MB. Formats: JPEG, PNG, WebP
                </p>
              </div>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Banner ({BRAND_IMAGE_DIMENSIONS.banner.description})</Label>
            <div className="space-y-4">
              {/* Preview */}
              {(bannerPreview || bannerUrl) ? (
                <div className="relative w-full h-48 rounded-lg border bg-muted overflow-hidden">
                  <img
                    src={bannerPreview || bannerUrl || ''}
                    alt="Banner preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/50 hover:bg-muted transition-colors">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <span className="mt-2 text-sm text-muted-foreground">Upload Banner</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {BRAND_IMAGE_DIMENSIONS.banner.width}x{BRAND_IMAGE_DIMENSIONS.banner.height}px recommended
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </label>
              )}
              <p className="text-sm text-muted-foreground">
                Max file size: 5MB. Formats: JPEG, PNG, WebP
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Essential brand details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Brand Name */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Chanel, Dior, Tom Ford"
                {...form.register('name')}
              />
              <div className="min-h-[20px]">
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., chanel, dior, tom-ford"
                {...form.register('slug')}
                disabled={mode === 'edit'}
              />
              <div className="min-h-[20px]">
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                placeholder="e.g., France, Italy, USA"
                {...form.register('country')}
              />
              <div className="min-h-[20px]">
                {form.formState.errors.country && (
                  <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>
                )}
              </div>
            </div>

            {/* Founded Year */}
            <div className="space-y-2">
              <Label htmlFor="foundedYear">Founded Year *</Label>
              <Input
                id="foundedYear"
                type="number"
                placeholder="e.g., 1910"
                {...form.register('foundedYear', { valueAsNumber: true })}
              />
              <div className="min-h-[20px]">
                {form.formState.errors.foundedYear && (
                  <p className="text-sm text-destructive">{form.formState.errors.foundedYear.message}</p>
                )}
              </div>
            </div>

            {/* Founder */}
            <div className="space-y-2">
              <Label htmlFor="founder">Founder *</Label>
              <Input
                id="founder"
                placeholder="e.g., Coco Chanel"
                {...form.register('founder')}
              />
              <div className="min-h-[20px]">
                {form.formState.errors.founder && (
                  <p className="text-sm text-destructive">{form.formState.errors.founder.message}</p>
                )}
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://www.example.com"
                {...form.register('website')}
              />
              <div className="min-h-[20px]">
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Brand Description *</Label>
            <textarea
              id="description"
              placeholder="Tell us about the brand's history, philosophy, and signature style..."
              rows={6}
              {...form.register('description')}
              className={`flex w-full rounded-md border ${
                form.formState.errors.description ? 'border-destructive' : 'border-input'
              } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
            />
            <div className="min-h-[20px]">
              {form.formState.errors.description && (
                <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status & Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Status & Settings</CardTitle>
          <CardDescription>Publication status and verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as BrandFormValues['status'])}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <div className="min-h-[20px]">
                {form.formState.errors.status && (
                  <p className="text-sm text-destructive">{form.formState.errors.status.message}</p>
                )}
              </div>
            </div>

            {/* Verified Data */}
            <div className="space-y-2">
              <Label>Data Verification</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="verifiedData"
                  checked={form.watch('verifiedData')}
                  onCheckedChange={(checked) => form.setValue('verifiedData', checked as boolean)}
                />
                <Label
                  htmlFor="verifiedData"
                  className="text-sm font-normal cursor-pointer"
                >
                  Mark as verified data
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Check if all information has been verified from official sources
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting ? (mode === 'create' ? 'Creating...' : 'Saving...') : (mode === 'create' ? 'Create Brand' : 'Save Changes')}
        </Button>
      </div>
    </form>
  );
}
