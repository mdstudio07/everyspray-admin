'use client';

import * as React from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, ImagePlus, Loader2 } from 'lucide-react';
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
import type { Perfume } from '@/lib/data/dummy-perfumes';
import { toast } from 'react-hot-toast';

/**
 * Perfume Form Component
 *
 * Professional, well-structured form for creating and editing perfumes
 * Follows Rule 41-55: Proper spacing, hierarchy, responsive design
 *
 * Features:
 * - Image upload with automatic 90x90px thumbnail generation
 * - Form validation with Zod + React Hook Form
 * - Responsive grid layout (mobile → tablet → desktop)
 * - Proper visual hierarchy and spacing
 * - Dark/light mode support
 * - Accessible with ARIA labels
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
  launchYear: number;
};

interface PerfumeFormProps {
  initialData?: Perfume;
  onSubmit: (data: Partial<Perfume>, isDraft: boolean) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing?: boolean;
}

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS = ['Casual', 'Office', 'Evening', 'Sport', 'Formal'];

export function PerfumeForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing = false,
}: PerfumeFormProps) {
  const [mainImage, setMainImage] = React.useState<string | null>(
    initialData?.mainImage || null
  );
  const [thumbnail, setThumbnail] = React.useState<string | null>(
    initialData?.thumbnail || null
  );
  const [isProcessingImage, setIsProcessingImage] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PerfumeFormData>({
    resolver: zodResolver(perfumeFormSchema) as Resolver<PerfumeFormData>,
    defaultValues: initialData
      ? {
          name: initialData.name,
          brandName: initialData.brandName,
          description: initialData.description,
          launchYear: initialData.launchYear,
          perfumer: initialData.perfumer,
          concentration: initialData.concentration,
          gender: initialData.gender,
          longevity: initialData.longevity,
          sillage: initialData.sillage,
          priceRange: initialData.priceRange,
          topNotes: initialData.topNotes.join(', '),
          middleNotes: initialData.middleNotes.join(', '),
          baseNotes: initialData.baseNotes.join(', '),
          season: initialData.season,
          occasion: initialData.occasion,
          verifiedData: initialData.verifiedData,
        }
      : {
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

  // Handle image upload with thumbnail generation
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
      setIsProcessingImage(true);

      // Generate thumbnail (90x90px) - this is the display thumbnail
      const thumbnailResult = await generateThumbnail(file, {
        width: 90,
        height: 90,
        quality: 0.95,
        fit: 'cover',
      });

      // Read main image as data URL (this is the full-size image)
      const mainImageUrl = await readFileAsDataURL(file);

      setMainImage(mainImageUrl);
      setThumbnail(thumbnailResult.dataUrl);

      toast.success('Image uploaded and thumbnail generated!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to process image');
    } finally {
      setIsProcessingImage(false);
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

  // Handle form submission
  const handleSubmit = async (data: PerfumeFormData, isDraft: boolean) => {
    const perfumeData: Partial<Perfume> = {
      name: data.name,
      brandName: data.brandName,
      description: data.description,
      launchYear: data.launchYear,
      perfumer: data.perfumer,
      concentration: data.concentration,
      thumbnail: thumbnail || '', // 90x90 thumbnail for table display
      mainImage: mainImage || '', // Full-size image
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
      verifiedData: data.verifiedData,
    };

    await onSubmit(perfumeData, isDraft);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <form className="p-6 sm:p-8">
        <div className="space-y-8">
          {/* Section 1: Image Upload */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Perfume Image</h2>
              <p className="text-sm text-muted-foreground">
                Upload a high-quality image. A 90x90px thumbnail will be generated automatically.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
              {/* Image Preview Column */}
              <div className="flex flex-col items-center gap-4 sm:items-start">
                {/* Main Image Preview */}
                <div className="relative">
                  {mainImage ? (
                    <div className="relative overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={mainImage}
                        alt="Perfume preview"
                        className="h-64 w-44 object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md transition-transform hover:scale-110 hover:bg-destructive/90 cursor-pointer"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-64 w-44 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                      <ImagePlus className="h-10 w-10 text-muted-foreground/50" />
                      <p className="text-xs text-muted-foreground">No image</p>
                    </div>
                  )}
                </div>

                {/* Thumbnail Preview */}
                {thumbnail && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Generated Thumbnail (90x90)
                    </Label>
                    <div className="overflow-hidden rounded-md border bg-muted/30">
                      <img
                        src={thumbnail}
                        alt="Thumbnail"
                        className="h-20 w-20 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Controls Column */}
              <div className="flex flex-col justify-center space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  id="perfume-image-upload"
                  disabled={isProcessingImage || isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer"
                  disabled={isProcessingImage || isSubmitting}
                >
                  {isProcessingImage ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing image...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-5 w-5" />
                      {mainImage ? 'Change Image' : 'Upload Image'}
                    </>
                  )}
                </Button>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>• Accepted formats: JPEG, PNG, WebP</p>
                  <p>• Maximum file size: 5MB</p>
                  <p>• Recommended: 400x600px or larger</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 2: Basic Information */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Basic Information</h2>
              <p className="text-sm text-muted-foreground">
                Essential details about the perfume
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Perfume Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Perfume Name *
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="e.g., Bleu de Chanel"
                  disabled={isSubmitting}
                  className={errors.name ? 'border-destructive' : ''}
                />
                <div className="min-h-[20px]">
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
              </div>

              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="brandName" className="text-sm font-medium">
                  Brand *
                </Label>
                <Input
                  id="brandName"
                  {...register('brandName')}
                  placeholder="e.g., Chanel"
                  disabled={isSubmitting}
                  className={errors.brandName ? 'border-destructive' : ''}
                />
                <div className="min-h-[20px]">
                  {errors.brandName && (
                    <p className="text-sm text-destructive">{errors.brandName.message}</p>
                  )}
                </div>
              </div>

              {/* Launch Year */}
              <div className="space-y-2">
                <Label htmlFor="launchYear" className="text-sm font-medium">
                  Launch Year *
                </Label>
                <Input
                  id="launchYear"
                  type="number"
                  {...register('launchYear', { valueAsNumber: true })}
                  placeholder="e.g., 2010"
                  disabled={isSubmitting}
                  className={errors.launchYear ? 'border-destructive' : ''}
                />
                <div className="min-h-[20px]">
                  {errors.launchYear && (
                    <p className="text-sm text-destructive">{errors.launchYear.message}</p>
                  )}
                </div>
              </div>

              {/* Perfumer */}
              <div className="space-y-2">
                <Label htmlFor="perfumer" className="text-sm font-medium">
                  Perfumer *
                </Label>
                <Input
                  id="perfumer"
                  {...register('perfumer')}
                  placeholder="e.g., Jacques Polge"
                  disabled={isSubmitting}
                  className={errors.perfumer ? 'border-destructive' : ''}
                />
                <div className="min-h-[20px]">
                  {errors.perfumer && (
                    <p className="text-sm text-destructive">{errors.perfumer.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description - Full Width */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description *
              </Label>
              <textarea
                id="description"
                {...register('description')}
                placeholder="Describe the perfume's character, mood, and overall impression..."
                disabled={isSubmitting}
                rows={4}
                className={`flex w-full rounded-md border ${
                  errors.description ? 'border-destructive' : 'border-input'
                } bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`}
              />
              <div className="min-h-[20px]">
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 3: Fragrance Notes */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Fragrance Notes</h2>
              <p className="text-sm text-muted-foreground">
                Separate multiple notes with commas (e.g., Bergamot, Lemon, Mint)
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Top Notes */}
              <div className="space-y-2">
                <Label htmlFor="topNotes" className="text-sm font-medium">
                  Top Notes *
                </Label>
                <Input
                  id="topNotes"
                  {...register('topNotes')}
                  placeholder="Bergamot, Lemon, Mint"
                  disabled={isSubmitting}
                  className={errors.topNotes ? 'border-destructive' : ''}
                />
                <div className="min-h-[20px]">
                  {errors.topNotes && (
                    <p className="text-sm text-destructive">{errors.topNotes.message}</p>
                  )}
                </div>
              </div>

              {/* Middle Notes */}
              <div className="space-y-2">
                <Label htmlFor="middleNotes" className="text-sm font-medium">
                  Middle Notes *
                </Label>
                <Input
                  id="middleNotes"
                  {...register('middleNotes')}
                  placeholder="Jasmine, Rose, Ginger"
                  disabled={isSubmitting}
                  className={errors.middleNotes ? 'border-destructive' : ''}
                />
                <div className="min-h-[20px]">
                  {errors.middleNotes && (
                    <p className="text-sm text-destructive">{errors.middleNotes.message}</p>
                  )}
                </div>
              </div>

              {/* Base Notes */}
              <div className="space-y-2">
                <Label htmlFor="baseNotes" className="text-sm font-medium">
                  Base Notes *
                </Label>
                <Input
                  id="baseNotes"
                  {...register('baseNotes')}
                  placeholder="Cedarwood, Sandalwood"
                  disabled={isSubmitting}
                  className={errors.baseNotes ? 'border-destructive' : ''}
                />
                <div className="min-h-[20px]">
                  {errors.baseNotes && (
                    <p className="text-sm text-destructive">{errors.baseNotes.message}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 4: Classification */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Classification</h2>
              <p className="text-sm text-muted-foreground">
                Perfume characteristics and attributes
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Concentration */}
              <div className="space-y-2">
                <Label htmlFor="concentration" className="text-sm font-medium">
                  Type *
                </Label>
                <Select
                  onValueChange={(value) => setValue('concentration', value as PerfumeFormData['concentration'])}
                  defaultValue={initialData?.concentration}
                  disabled={isSubmitting}
                >
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

              {/* Gender */}
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-medium">
                  Gender *
                </Label>
                <Select
                  onValueChange={(value) => setValue('gender', value as PerfumeFormData['gender'])}
                  defaultValue={initialData?.gender}
                  disabled={isSubmitting}
                >
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

              {/* Price Range */}
              <div className="space-y-2">
                <Label htmlFor="priceRange" className="text-sm font-medium">
                  Price Range *
                </Label>
                <Select
                  onValueChange={(value) => setValue('priceRange', value as PerfumeFormData['priceRange'])}
                  defaultValue={initialData?.priceRange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select price" />
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

              {/* Longevity */}
              <div className="space-y-2">
                <Label htmlFor="longevity" className="text-sm font-medium">
                  Longevity *
                </Label>
                <Select
                  onValueChange={(value) => setValue('longevity', value as PerfumeFormData['longevity'])}
                  defaultValue={initialData?.longevity}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select longevity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weak">Weak (1-2 hours)</SelectItem>
                    <SelectItem value="Moderate">Moderate (3-6 hours)</SelectItem>
                    <SelectItem value="Long lasting">Long lasting (7-12 hours)</SelectItem>
                    <SelectItem value="Very long lasting">Very long lasting (12+ hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sillage */}
              <div className="space-y-2">
                <Label htmlFor="sillage" className="text-sm font-medium">
                  Sillage *
                </Label>
                <Select
                  onValueChange={(value) => setValue('sillage', value as PerfumeFormData['sillage'])}
                  defaultValue={initialData?.sillage}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sillage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Intimate">Intimate (Close to skin)</SelectItem>
                    <SelectItem value="Moderate">Moderate (Arm&apos;s length)</SelectItem>
                    <SelectItem value="Heavy">Heavy (Fills a room)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 5: Occasions & Seasons */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">Best For</h2>
              <p className="text-sm text-muted-foreground">
                When and where this perfume shines
              </p>
            </div>

            {/* Seasons */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Seasons * <span className="font-normal text-muted-foreground">(select at least one)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {SEASONS.map((season) => (
                  <Badge
                    key={season}
                    variant={selectedSeasons?.includes(season) ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-accent"
                    onClick={() => !isSubmitting && toggleSeason(season)}
                  >
                    {season}
                  </Badge>
                ))}
              </div>
              <div className="min-h-[20px]">
                {errors.season && (
                  <p className="text-sm text-destructive">{errors.season.message}</p>
                )}
              </div>
            </div>

            {/* Occasions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Occasions * <span className="font-normal text-muted-foreground">(select at least one)</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {OCCASIONS.map((occasion) => (
                  <Badge
                    key={occasion}
                    variant={selectedOccasions?.includes(occasion) ? 'default' : 'outline'}
                    className="cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-accent"
                    onClick={() => !isSubmitting && toggleOccasion(occasion)}
                  >
                    {occasion}
                  </Badge>
                ))}
              </div>
              <div className="min-h-[20px]">
                {errors.occasion && (
                  <p className="text-sm text-destructive">{errors.occasion.message}</p>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Section 6: Additional Options */}
          <section className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="verifiedData"
                defaultChecked={initialData?.verifiedData}
                onCheckedChange={(checked) => setValue('verifiedData', checked as boolean)}
                disabled={isSubmitting}
              />
              <div className="space-y-0.5">
                <Label htmlFor="verifiedData" className="cursor-pointer text-sm font-medium">
                  Mark as verified data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Check this if the perfume information has been verified from official sources
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Action Buttons - Sticky on mobile */}
          <div className="sticky bottom-0 flex flex-col-reverse gap-3 bg-card pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleFormSubmit((data) => handleSubmit(data, true))()}
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
              onClick={() => handleFormSubmit((data) => handleSubmit(data, false))()}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Submitting...'}
                </>
              ) : isEditing ? (
                'Update & Submit'
              ) : (
                'Submit for Approval'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
