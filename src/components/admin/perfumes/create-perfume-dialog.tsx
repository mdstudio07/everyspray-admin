'use client';

import * as React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, ImagePlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  generateThumbnail,
  validateImageFile,
  readFileAsDataURL,
} from '@/lib/utils/image-thumbnail';
import { usePerfumeTableStore } from '@/lib/stores/perfume-table';
import type { Perfume } from '@/lib/data/dummy-perfumes';
import { toast } from 'react-hot-toast';

/**
 * Create Perfume Dialog
 *
 * Full-featured perfume creation form with:
 * - Image upload with automatic thumbnail generation (90x90px)
 * - All perfume fields
 * - Form validation with Zod
 * - Save as draft or submit
 * - Smooth animations and transitions
 * - Responsive design
 */

// Zod schema for form validation
const perfumeFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  brandName: z.string().min(1, 'Brand is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  launchYear: z.preprocess(
    (val) => (val === '' || val === undefined ? undefined : Number(val)),
    z.number().int().min(1900, 'Year must be 1900 or later').max(2100, 'Year must be 2100 or earlier')
  ),
  perfumer: z.string().min(1, 'Perfumer is required'),
  concentration: z.enum(['Parfum', 'EDP', 'EDT', 'EDC']),
  gender: z.enum(['Masculine', 'Feminine', 'Unisex']),
  longevity: z.enum(['Weak', 'Moderate', 'Long lasting', 'Very long lasting']),
  sillage: z.enum(['Intimate', 'Moderate', 'Heavy']),
  priceRange: z.enum(['$0-$50', '$50-$100', '$100-$200', '$200-$500', '$500+']),
  topNotes: z.string().min(1, 'At least one top note required'),
  middleNotes: z.string().min(1, 'At least one middle note required'),
  baseNotes: z.string().min(1, 'At least one base note required'),
  season: z.array(z.string()).min(1, 'Select at least one season'),
  occasion: z.array(z.string()).min(1, 'Select at least one occasion'),
  verifiedData: z.boolean(),
});

type PerfumeFormData = z.infer<typeof perfumeFormSchema> & {
  launchYear: number; // Override to ensure number type
};

interface CreatePerfumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS = ['Casual', 'Office', 'Evening', 'Sport', 'Formal'];

export function CreatePerfumeDialog({ open, onOpenChange }: CreatePerfumeDialogProps) {
  const { refreshData } = usePerfumeTableStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [mainImage, setMainImage] = React.useState<string | null>(null);
  const [thumbnail, setThumbnail] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PerfumeFormData>({
    resolver: zodResolver(perfumeFormSchema) as Resolver<PerfumeFormData>,
    defaultValues: {
      concentration: 'EDP',
      gender: 'Unisex',
      longevity: 'Moderate',
      sillage: 'Moderate',
      priceRange: '$100-$200',
      season: [],
      occasion: [],
      verifiedData: false,
    },
  });

  const selectedSeasons = watch('season');
  const selectedOccasions = watch('occasion');

  // Handle image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    try {
      setIsSubmitting(true);

      // Generate thumbnail (90x90px)
      const thumbnailResult = await generateThumbnail(file, {
        width: 90,
        height: 90,
        quality: 0.95,
        fit: 'cover',
      });

      // Read main image as data URL
      const mainImageUrl = await readFileAsDataURL(file);

      setMainImage(mainImageUrl);
      setThumbnail(thumbnailResult.dataUrl);

      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to process image');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setMainImage(null);
    setThumbnail(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle season
  const toggleSeason = (season: string) => {
    const current = selectedSeasons || [];
    const updated = current.includes(season)
      ? current.filter((s) => s !== season)
      : [...current, season];
    setValue('season', updated);
  };

  // Toggle occasion
  const toggleOccasion = (occasion: string) => {
    const current = selectedOccasions || [];
    const updated = current.includes(occasion)
      ? current.filter((o) => o !== occasion)
      : [...current, occasion];
    setValue('occasion', updated);
  };

  // Submit form (Draft or Submit)
  const onSubmit = async (data: PerfumeFormData, isDraft: boolean = false) => {
    setIsSubmitting(true);

    try {
      // Create perfume object
      const newPerfume: Partial<Perfume> = {
        id: `perfume-${Date.now()}`,
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        brandName: data.brandName,
        brandId: 'brand-temp', // TODO: Link to actual brand
        description: data.description,
        launchYear: data.launchYear,
        perfumer: data.perfumer,
        concentration: data.concentration,
        thumbnail: thumbnail || '',
        mainImage: mainImage || '',
        topNotes: data.topNotes.split(',').map((n) => n.trim()),
        middleNotes: data.middleNotes.split(',').map((n) => n.trim()),
        baseNotes: data.baseNotes.split(',').map((n) => n.trim()),
        allNotes: [data.topNotes, data.middleNotes, data.baseNotes]
          .flatMap((n) => n.split(',').map((note) => note.trim()))
          .join(', '),
        longevity: data.longevity,
        sillage: data.sillage,
        gender: data.gender,
        priceRange: data.priceRange,
        season: data.season as Perfume['season'],
        occasion: data.occasion as Perfume['occasion'],
        status: isDraft ? 'draft' : 'pending_approval',
        verifiedData: data.verifiedData,
        createdBy: 'user-current', // TODO: Get from auth
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('Creating perfume:', newPerfume);

      // TODO: Replace with actual Supabase mutation
      // For now, just simulate success
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(`Perfume ${isDraft ? 'saved as draft' : 'submitted for approval'}!`);

      // Refresh table
      refreshData();

      // Reset form and close dialog
      reset();
      handleRemoveImage();
      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to create perfume');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Perfume</DialogTitle>
          <DialogDescription>
            Add a new perfume to the database. Fill in all required fields and upload an image.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label>Perfume Image</Label>
            <div className="flex items-start gap-4">
              {/* Image Preview */}
              <div className="flex-shrink-0">
                {mainImage ? (
                  <div className="relative">
                    <img
                      src={mainImage}
                      alt="Preview"
                      className="h-48 w-32 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-48 w-32 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/50">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Thumbnail Preview */}
              {thumbnail && (
                <div className="flex-shrink-0">
                  <Label className="text-xs text-muted-foreground">Thumbnail (90x90)</Label>
                  <img
                    src={thumbnail}
                    alt="Thumbnail"
                    className="mt-1 h-20 w-20 rounded-md border object-cover"
                  />
                </div>
              )}

              {/* Upload Button */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="perfume-image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </>
                  )}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  JPEG, PNG or WebP. Max 5MB. Thumbnail will be generated automatically.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Perfume Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Bleu de Chanel"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandName">Brand *</Label>
              <Input
                id="brandName"
                {...register('brandName')}
                placeholder="Chanel"
              />
              {errors.brandName && (
                <p className="text-sm text-destructive">{errors.brandName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="launchYear">Launch Year *</Label>
              <Input
                id="launchYear"
                type="number"
                {...register('launchYear', { valueAsNumber: true })}
                placeholder="2010"
              />
              {errors.launchYear && (
                <p className="text-sm text-destructive">{errors.launchYear.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfumer">Perfumer *</Label>
              <Input
                id="perfumer"
                {...register('perfumer')}
                placeholder="Jacques Polge"
              />
              {errors.perfumer && (
                <p className="text-sm text-destructive">{errors.perfumer.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="A sophisticated masculine fragrance..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <Separator />

          {/* Fragrance Notes */}
          <div className="space-y-4">
            <Label>Fragrance Notes *</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="topNotes" className="text-xs text-muted-foreground">
                  Top Notes
                </Label>
                <Input
                  id="topNotes"
                  {...register('topNotes')}
                  placeholder="Bergamot, Lemon, Mint"
                />
                {errors.topNotes && (
                  <p className="text-sm text-destructive">{errors.topNotes.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleNotes" className="text-xs text-muted-foreground">
                  Middle Notes
                </Label>
                <Input
                  id="middleNotes"
                  {...register('middleNotes')}
                  placeholder="Jasmine, Rose, Ginger"
                />
                {errors.middleNotes && (
                  <p className="text-sm text-destructive">{errors.middleNotes.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseNotes" className="text-xs text-muted-foreground">
                  Base Notes
                </Label>
                <Input
                  id="baseNotes"
                  {...register('baseNotes')}
                  placeholder="Cedarwood, Sandalwood, Amber"
                />
                {errors.baseNotes && (
                  <p className="text-sm text-destructive">{errors.baseNotes.message}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Separate multiple notes with commas
            </p>
          </div>

          <Separator />

          {/* Classification */}
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="concentration">Type *</Label>
              <Select onValueChange={(value) => setValue('concentration', value as PerfumeFormData['concentration'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parfum">Parfum</SelectItem>
                  <SelectItem value="EDP">Eau de Parfum (EDP)</SelectItem>
                  <SelectItem value="EDT">Eau de Toilette (EDT)</SelectItem>
                  <SelectItem value="EDC">Eau de Cologne (EDC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select onValueChange={(value) => setValue('gender', value as PerfumeFormData['gender'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculine">Masculine</SelectItem>
                  <SelectItem value="Feminine">Feminine</SelectItem>
                  <SelectItem value="Unisex">Unisex</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange">Price Range *</Label>
              <Select onValueChange={(value) => setValue('priceRange', value as PerfumeFormData['priceRange'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="$0-$50">$0-$50</SelectItem>
                  <SelectItem value="$50-$100">$50-$100</SelectItem>
                  <SelectItem value="$100-$200">$100-$200</SelectItem>
                  <SelectItem value="$200-$500">$200-$500</SelectItem>
                  <SelectItem value="$500+">$500+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="longevity">Longevity *</Label>
              <Select onValueChange={(value) => setValue('longevity', value as PerfumeFormData['longevity'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select longevity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weak">Weak</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Long lasting">Long lasting</SelectItem>
                  <SelectItem value="Very long lasting">Very long lasting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sillage">Sillage *</Label>
              <Select onValueChange={(value) => setValue('sillage', value as PerfumeFormData['sillage'])}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sillage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Intimate">Intimate</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Heavy">Heavy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Seasons */}
          <div className="space-y-3">
            <Label>Seasons * (select at least one)</Label>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map((season) => (
                <Badge
                  key={season}
                  variant={selectedSeasons?.includes(season) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => toggleSeason(season)}
                >
                  {season}
                </Badge>
              ))}
            </div>
            {errors.season && (
              <p className="text-sm text-destructive">{errors.season.message}</p>
            )}
          </div>

          {/* Occasions */}
          <div className="space-y-3">
            <Label>Occasions * (select at least one)</Label>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occasion) => (
                <Badge
                  key={occasion}
                  variant={selectedOccasions?.includes(occasion) ? 'default' : 'outline'}
                  className="cursor-pointer px-3 py-1"
                  onClick={() => toggleOccasion(occasion)}
                >
                  {occasion}
                </Badge>
              ))}
            </div>
            {errors.occasion && (
              <p className="text-sm text-destructive">{errors.occasion.message}</p>
            )}
          </div>

          {/* Verified Data */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="verifiedData"
              onCheckedChange={(checked) => setValue('verifiedData', checked as boolean)}
            />
            <Label htmlFor="verifiedData" className="cursor-pointer font-normal">
              Mark as verified data
            </Label>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit((data) => onSubmit(data, true))()}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save as Draft'
              )}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit((data) => onSubmit(data, false))()}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Approval'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
