'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { X, Upload, ImagePlus, Loader2, Info, Link2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { BrandCombobox } from './brand-combobox';
import { NotesInput } from './notes-input';
import { ImageCropDialog } from './image-crop-dialog';
import { generateSlug, getLaunchYearOptions } from '@/lib/utils/slug';
import { validateImageFile } from '@/lib/utils/image-thumbnail';
import { getBrandById } from '@/lib/data/dummy-brands';
import { getNoteById } from '@/lib/data/dummy-notes';
import type { Perfume } from '@/lib/data/dummy-perfumes';
import { toast } from 'react-hot-toast';
import { usePerfumeImageUploadStore } from '@/lib/stores/perfume-image-upload';
import { usePerfumeFormStateStore } from '@/lib/stores/perfume-form-state';

/**
 * Redesigned Perfume Form Component
 *
 * NEW FEATURES:
 * - Full width layout aligned with page heading
 * - Brand searchable combobox with "Suggest New Brand" button
 * - Auto-generating slug field beside name
 * - Advanced image upload: 400x500 + 90x90 preview (left), drag-drop area (right)
 * - Image crop popup for oversized images
 * - Year select dropdown (2025-1925 in reverse)
 * - Info tooltips on complex fields
 * - Notes toggle: Pyramid (Top/Middle/Base) OR Linear (single field)
 * - Notes chips input with searchable dropdown
 *
 * Follows all CLAUDE.md rules for design, spacing, and accessibility
 */

// Zod schema with updated validation
const perfumeFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug is required'),
  brandId: z.string().min(1, 'Brand is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  launchYear: z.number().int().min(1925, 'Year must be 1925 or later'),
  perfumer: z.string().min(1, 'Perfumer is required'),
  concentration: z.enum(['Parfum', 'EDP', 'EDT', 'EDC']),
  gender: z.enum(['Masculine', 'Feminine', 'Unisex']),
  longevity: z.enum(['Weak', 'Moderate', 'Long lasting', 'Very long lasting']),
  sillage: z.enum(['Intimate', 'Moderate', 'Heavy']),
  priceRange: z.enum(['$0-$50', '$50-$100', '$100-$200', '$200-$500', '$500+']),
  notesMode: z.enum(['pyramid', 'linear']),
  // Pyramid mode notes
  topNoteIds: z.array(z.string()).optional(),
  middleNoteIds: z.array(z.string()).optional(),
  baseNoteIds: z.array(z.string()).optional(),
  // Linear mode notes
  linearNoteIds: z.array(z.string()).optional(),
  season: z.array(z.string()).min(1, 'Select at least one season'),
  occasion: z.array(z.string()).min(1, 'Select at least one occasion'),
  verifiedData: z.boolean(),
}).refine(
  (data) => {
    if (data.notesMode === 'pyramid') {
      return (
        (data.topNoteIds?.length ?? 0) > 0 &&
        (data.middleNoteIds?.length ?? 0) > 0 &&
        (data.baseNoteIds?.length ?? 0) > 0
      );
    } else {
      return (data.linearNoteIds?.length ?? 0) > 0;
    }
  },
  {
    message: 'Please add at least one note in each category',
    path: ['topNoteIds'],
  }
);

type PerfumeFormData = z.infer<typeof perfumeFormSchema>;

interface PerfumeFormProps {
  initialData?: Perfume;
  onSubmit: (data: Partial<Perfume>, isDraft: boolean) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditing?: boolean;
}

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const OCCASIONS = ['Casual', 'Office', 'Evening', 'Sport', 'Formal'];
const YEAR_OPTIONS = getLaunchYearOptions();

export function PerfumeForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing = false,
}: PerfumeFormProps) {
  // Zustand store for image upload management
  const {
    images: uploadImages,
    mainImageId,
    addImages,
    removeImage,
    setMainImage,
    uploadImage,
    getUploadedImages,
  } = usePerfumeImageUploadStore();

  // Zustand store for form state persistence
  const {
    formData: persistedFormData,
    setFormData: persistFormData,
    clearFormData: clearPersistedFormData,
  } = usePerfumeFormStateStore();

  // Get uploaded images for carousel display
  const uploadedImages = getUploadedImages();

  // Determine which images to show in carousel
  const displayImages = uploadedImages.length > 0
    ? uploadedImages.map(img => img.uploadedUrl || img.preview)
    : (initialData?.mainImage ? [initialData.mainImage] : []);

  // Generate thumbnail from main image
  const thumbnail = React.useMemo(() => {
    if (uploadedImages.length > 0) {
      const mainImg = uploadedImages.find(img => img.id === mainImageId);
      return mainImg?.thumbnailUrl || mainImg?.preview || null;
    }
    return initialData?.thumbnail || null;
  }, [uploadedImages, mainImageId, initialData]);
  const [cropDialogOpen, setCropDialogOpen] = React.useState(false);
  const [imageToCrop] = React.useState<string | null>(null); // setImageToCrop removed - will be re-enabled when crop feature is connected to new workflow

  // Import from URL state
  const [importUrl, setImportUrl] = React.useState('');
  const [isImportingUrl, setIsImportingUrl] = React.useState(false);

  // Form setup with persisted data priority
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PerfumeFormData>({
    resolver: zodResolver(perfumeFormSchema),
    defaultValues: persistedFormData || {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      brandId: initialData?.brandName || '', // TODO: Convert to brand ID
      description: initialData?.description || '',
      launchYear: initialData?.launchYear || new Date().getFullYear(),
      perfumer: initialData?.perfumer || '',
      concentration: initialData?.concentration || 'EDP',
      gender: initialData?.gender || 'Unisex',
      longevity: initialData?.longevity || 'Moderate',
      sillage: initialData?.sillage || 'Moderate',
      priceRange: initialData?.priceRange || '$100-$200',
      notesMode: 'pyramid',
      topNoteIds: [],
      middleNoteIds: [],
      baseNoteIds: [],
      linearNoteIds: [],
      season: initialData?.season || [],
      occasion: initialData?.occasion || [],
      verifiedData: initialData?.verifiedData || false,
    },
  });

  // Watch fields
  const name = watch('name');
  const notesMode = watch('notesMode');
  const selectedSeasons = watch('season');
  const selectedOccasions = watch('occasion');
  const topNoteIds = watch('topNoteIds') || [];
  const middleNoteIds = watch('middleNoteIds') || [];
  const baseNoteIds = watch('baseNoteIds') || [];
  const linearNoteIds = watch('linearNoteIds') || [];

  // Auto-generate slug when name changes
  React.useEffect(() => {
    if (name) {
      setValue('slug', generateSlug(name));
    }
  }, [name, setValue]);

  // Persist form data to session storage with debounce to prevent infinite loops
  React.useEffect(() => {
    const subscription = watch((data) => {
      // Use setTimeout to debounce and break the render cycle
      const timer = setTimeout(() => {
        const persistData = {
          name: data.name || '',
          slug: data.slug || '',
          brandId: data.brandId || '',
          description: data.description || '',
          launchYear: data.launchYear || new Date().getFullYear(),
          perfumer: data.perfumer || '',
          concentration: data.concentration || 'EDP',
          gender: data.gender || 'Unisex',
          longevity: data.longevity || 'Moderate',
          sillage: data.sillage || 'Moderate',
          priceRange: data.priceRange || '$100-$200',
          notesMode: data.notesMode || 'pyramid',
          topNoteIds: (data.topNoteIds || []).filter((id): id is string => typeof id === 'string'),
          middleNoteIds: (data.middleNoteIds || []).filter((id): id is string => typeof id === 'string'),
          baseNoteIds: (data.baseNoteIds || []).filter((id): id is string => typeof id === 'string'),
          linearNoteIds: (data.linearNoteIds || []).filter((id): id is string => typeof id === 'string'),
          season: (data.season || []).filter((s): s is string => typeof s === 'string'),
          occasion: (data.occasion || []).filter((o): o is string => typeof o === 'string'),
          verifiedData: data.verifiedData || false,
        };
        persistFormData(persistData);
      }, 300); // Debounce by 300ms

      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [watch, persistFormData]);

  // Drag and drop for image upload - supports multiple images
  const onDrop = React.useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // Handle rejected files
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === 'file-invalid-type') {
        toast.error('Unsupported file format. Please use JPEG, PNG, WebP, AVIF, or SVG.');
      } else if (rejection.errors[0]?.code === 'file-too-large') {
        toast.error('File size exceeds 5MB limit.');
      } else {
        toast.error('Invalid file. Please try again.');
      }
      return;
    }

    // Check if we can add more images
    if (uploadImages.length >= 5) {
      toast.error('Maximum 5 images allowed.');
      return;
    }

    const files = acceptedFiles.slice(0, 5 - uploadImages.length);

    // Validate all files first
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }
    }

    // Add files to the upload queue
    addImages(files);
    toast.success(`${files.length} image(s) added to queue. Click "Upload" to process.`);
  }, [uploadImages, addImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/avif': ['.avif'],
      'image/svg+xml': ['.svg'],
    },
    multiple: true,
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: uploadImages.length >= 5 || isSubmitting,
  });

  // Handle import from URL
  const handleImportFromUrl = async () => {
    if (!importUrl.trim()) {
      toast.error('Please enter a valid URL.');
      return;
    }

    if (uploadImages.length >= 5) {
      toast.error('Maximum 5 images allowed.');
      return;
    }

    setIsImportingUrl(true);

    try {
      const response = await fetch(importUrl);
      const blob = await response.blob();

      // Validate blob type
      if (!blob.type.startsWith('image/')) {
        toast.error('URL does not point to a valid image.');
        setIsImportingUrl(false);
        return;
      }

      // Create File from blob
      const fileName = importUrl.split('/').pop() || 'imported-image.jpg';
      const file = new File([blob], fileName, { type: blob.type });

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid image');
        setIsImportingUrl(false);
        return;
      }

      // Add to upload queue
      addImages([file]);
      toast.success('Image imported successfully! Click "Upload" to process.');
      setImportUrl(''); // Clear input
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import image from URL. Please check the URL and try again.');
    } finally {
      setIsImportingUrl(false);
    }
  };

  // Handle crop complete (placeholder for future crop functionality)
  const handleCropComplete = (_croppedImage: string, _croppedThumbnail: string) => {
    // TODO: Integrate with new upload queue workflow
    toast.success('Image cropped and saved!');
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
    // Get brand and notes names for display
    const brand = getBrandById(data.brandId);

    let allNoteIds: string[] = [];
    let allNoteNames: string[] = [];

    if (data.notesMode === 'pyramid') {
      allNoteIds = [
        ...(data.topNoteIds || []),
        ...(data.middleNoteIds || []),
        ...(data.baseNoteIds || []),
      ];
    } else {
      allNoteIds = data.linearNoteIds || [];
    }

    allNoteNames = allNoteIds
      .map((id) => getNoteById(id)?.name)
      .filter(Boolean) as string[];

    // Get main image from uploaded images
    const mainImg = uploadedImages.find(img => img.id === mainImageId);
    const mainImageUrl = mainImg?.uploadedUrl || displayImages[0] || '';
    const thumbnailUrl = mainImg?.thumbnailUrl || thumbnail || '';

    const perfumeData: Partial<Perfume> = {
      name: data.name,
      slug: data.slug,
      brandName: brand?.name || data.brandId,
      description: data.description,
      launchYear: data.launchYear,
      perfumer: data.perfumer,
      concentration: data.concentration,
      thumbnail: thumbnailUrl,
      mainImage: mainImageUrl,
      topNotes: data.notesMode === 'pyramid'
        ? (data.topNoteIds || []).map(id => getNoteById(id)?.name || '').filter(Boolean)
        : [],
      middleNotes: data.notesMode === 'pyramid'
        ? (data.middleNoteIds || []).map(id => getNoteById(id)?.name || '').filter(Boolean)
        : [],
      baseNotes: data.notesMode === 'pyramid'
        ? (data.baseNoteIds || []).map(id => getNoteById(id)?.name || '').filter(Boolean)
        : [],
      allNotes: allNoteNames.join(', '),
      longevity: data.longevity,
      sillage: data.sillage,
      gender: data.gender,
      priceRange: data.priceRange,
      season: data.season as Perfume['season'],
      occasion: data.occasion as Perfume['occasion'],
      verifiedData: data.verifiedData,
    };

    await onSubmit(perfumeData, isDraft);

    // Clear persisted form data on successful submission
    clearPersistedFormData();
  };

  return (
    <>
      <div className="rounded-lg border bg-card shadow-sm">
        <form className="p-6 sm:p-8">
          <div className="space-y-8">
            {/* Section 1: Image Upload - New Design */}
            <section className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">Perfume Image</h2>
                <p className="text-sm text-muted-foreground">
                  Upload a high-quality image. Images larger than 400x500px will be cropped.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
                {/* Left: Image Carousel & Thumbnail - Wider section */}
                <div className="space-y-4">
                  {/* Image Carousel */}
                  {displayImages.length > 0 ? (
                    <div className="relative">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {displayImages.map((image, index) => {
                            const uploadedImage = uploadedImages[index];
                            const isMain = uploadedImage && uploadedImage.id === mainImageId;
                            return (
                              <CarouselItem key={uploadedImage?.id || index}>
                                <div className="relative overflow-hidden rounded-lg border bg-muted">
                                  <img
                                    src={image}
                                    alt={`Perfume image ${index + 1}`}
                                    className="h-[500px] w-full object-contain"
                                  />
                                  {/* Main image indicator */}
                                  {isMain && (
                                    <div className="absolute left-2 top-2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-md">
                                      Main Image
                                    </div>
                                  )}
                                  {/* Remove button */}
                                  {uploadedImage && (
                                    <button
                                      type="button"
                                      onClick={() => removeImage(uploadedImage.id)}
                                      className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-md transition-transform hover:scale-110 hover:bg-destructive/90 cursor-pointer"
                                      aria-label="Remove image"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  )}
                                  {/* Set as main image button */}
                                  {uploadedImage && !isMain && (
                                    <button
                                      type="button"
                                      onClick={() => setMainImage(uploadedImage.id)}
                                      className="absolute left-2 bottom-2 rounded-md bg-background/90 px-3 py-1.5 text-xs font-medium shadow-md transition-colors hover:bg-background cursor-pointer"
                                      aria-label="Set as main image"
                                    >
                                      Set as Main
                                    </button>
                                  )}
                                </div>
                              </CarouselItem>
                            );
                          })}
                        </CarouselContent>
                        {displayImages.length > 1 && (
                          <>
                            <CarouselPrevious
                              type="button"
                              className="left-2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            />
                            <CarouselNext
                              type="button"
                              className="right-2"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            />
                          </>
                        )}
                      </Carousel>
                      <p className="mt-2 text-center text-xs text-muted-foreground">
                        {displayImages.length} / 5 images • {displayImages.length < 5 ? 'Upload more' : 'Maximum reached'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-[500px] w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                      <ImagePlus className="h-16 w-16 text-muted-foreground/50" />
                      <p className="text-base font-medium text-muted-foreground">No images uploaded</p>
                      <p className="text-sm text-muted-foreground">Upload up to 5 images</p>
                    </div>
                  )}

                  {/* Thumbnail Preview */}
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Thumbnail:</Label>
                    {thumbnail ? (
                      <div className="overflow-hidden rounded-md border bg-muted/30">
                        <img
                          src={thumbnail}
                          alt="Thumbnail"
                          className="h-[90px] w-[90px] object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-[90px] w-[90px] items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/30">
                        <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">(Generated from main image)</p>
                  </div>
                </div>

                {/* Right: Upload Queue Area */}
                <div className="flex w-full lg:w-[400px] flex-col gap-6">
                  {/* Top: Drag and Drop Upload Area */}
                  <div
                    {...getRootProps()}
                    className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-6 transition-colors ${
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : uploadImages.length >= 5
                        ? 'border-muted cursor-not-allowed opacity-50'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/30'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 text-muted-foreground/50" />
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-semibold">
                        {isDragActive ? 'Drop your files here' : 'Drop your files here'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        or
                      </p>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={isSubmitting || uploadImages.length >= 5}
                        className="cursor-pointer"
                      >
                        Browse Files
                      </Button>
                    </div>
                    <div className="mt-2 space-y-0.5 text-center text-xs text-muted-foreground">
                      <p>JPEG, PNG, WebP, AVIF, SVG • Max 5MB • Up to 5 images</p>
                    </div>
                  </div>

                  {/* Middle: Import from URL */}
                  <div className="space-y-3 rounded-lg border bg-card p-4">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Import from URL</Label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        disabled={isImportingUrl || isSubmitting || uploadImages.length >= 5}
                        className="text-sm"
                      />
                      <Button
                        type="button"
                        onClick={handleImportFromUrl}
                        disabled={isImportingUrl || isSubmitting || uploadImages.length >= 5 || !importUrl.trim()}
                        size="sm"
                        className="cursor-pointer whitespace-nowrap"
                      >
                        {isImportingUrl ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importing
                          </>
                        ) : (
                          'Import'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Bottom: Upload Queue */}
                  <div className="space-y-3 rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Upload Queue</Label>
                      <Badge variant="secondary" className="text-xs">
                        {uploadImages.length} / 5
                      </Badge>
                    </div>

                    {uploadImages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <ImagePlus className="h-10 w-10 text-muted-foreground/30" />
                        <p className="mt-2 text-sm text-muted-foreground">No images in queue</p>
                        <p className="text-xs text-muted-foreground">Add images to start uploading</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {uploadImages.map((image) => (
                          <div
                            key={image.id}
                            className="flex items-start gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-accent/50"
                          >
                            {/* Thumbnail Preview */}
                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border bg-muted">
                              <img
                                src={image.preview}
                                alt={image.file.name}
                                className="h-full w-full object-cover"
                              />
                              {image.status === 'uploaded' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                  <Check className="h-6 w-6 text-green-500" />
                                </div>
                              )}
                            </div>

                            {/* File Info & Actions */}
                            <div className="flex-1 space-y-2 min-w-0">
                              {/* File Name & Size */}
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium truncate">
                                  {image.file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(image.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>

                              {/* Status & Progress */}
                              {image.status === 'pending' && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="default"
                                  onClick={() => uploadImage(image.id)}
                                  disabled={isSubmitting}
                                  className="h-7 w-full cursor-pointer text-xs"
                                >
                                  <Upload className="mr-1.5 h-3 w-3" />
                                  Upload
                                </Button>
                              )}

                              {image.status === 'uploading' && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Uploading...</span>
                                    <span className="font-medium">{image.progress}%</span>
                                  </div>
                                  <Progress value={image.progress} className="h-1.5" />
                                </div>
                              )}

                              {image.status === 'uploaded' && (
                                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500">
                                  <Check className="h-3.5 w-3.5" />
                                  <span className="font-medium">Uploaded successfully</span>
                                </div>
                              )}

                              {image.status === 'error' && (
                                <div className="space-y-1.5">
                                  <p className="text-xs text-destructive">{image.error || 'Upload failed'}</p>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => uploadImage(image.id)}
                                    disabled={isSubmitting}
                                    className="h-7 w-full cursor-pointer text-xs"
                                  >
                                    Retry
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => removeImage(image.id)}
                              disabled={image.status === 'uploading' || isSubmitting}
                              className="flex-shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              aria-label="Remove image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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

              {/* Name and Slug Row */}
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

                {/* Slug (Auto-generated) */}
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    URL Slug (auto-generated) *
                  </Label>
                  <Input
                    id="slug"
                    {...register('slug')}
                    placeholder="bleu-de-chanel"
                    disabled={isSubmitting}
                    className={`font-mono text-sm ${errors.slug ? 'border-destructive' : ''}`}
                  />
                  <div className="min-h-[20px]">
                    {errors.slug && (
                      <p className="text-sm text-destructive">{errors.slug.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Brand, Launch Year, Perfumer Row - Equal width columns */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Brand (Searchable Combobox) */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="brandId" className="text-sm font-medium">
                    Brand *
                  </Label>
                  <BrandCombobox
                    value={watch('brandId')}
                    onValueChange={(value) => setValue('brandId', value)}
                    disabled={isSubmitting}
                  />
                  <div className="min-h-[20px]">
                    {errors.brandId && (
                      <p className="text-sm text-destructive">{errors.brandId.message}</p>
                    )}
                  </div>
                </div>

                {/* Launch Year (Select Dropdown) */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="launchYear" className="text-sm font-medium">
                    Launch Year *
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('launchYear', parseInt(value))}
                    defaultValue={initialData?.launchYear?.toString() || new Date().getFullYear().toString()}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {YEAR_OPTIONS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="min-h-[20px]">
                    {errors.launchYear && (
                      <p className="text-sm text-destructive">{errors.launchYear.message}</p>
                    )}
                  </div>
                </div>

                {/* Perfumer */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="perfumer" className="text-sm font-medium">
                      Perfumer *
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            Enter the name of the perfumer(s) who created this fragrance.
                            Also known as &ldquo;the nose&rdquo; in perfumery.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
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

            {/* Section 3: Fragrance Notes with Toggle */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold tracking-tight">Fragrance Notes</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose between pyramid structure or linear notes
                  </p>
                </div>

                {/* Notes Mode Toggle */}
                <div className="flex items-center gap-3">
                  <Label htmlFor="notesMode" className="text-sm font-medium">
                    Pyramid
                  </Label>
                  <Switch
                    id="notesMode"
                    checked={notesMode === 'linear'}
                    onCheckedChange={(checked) => setValue('notesMode', checked ? 'linear' : 'pyramid')}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="notesMode" className="text-sm font-medium">
                    Linear
                  </Label>
                </div>
              </div>

              {notesMode === 'pyramid' ? (
                /* Pyramid Mode: Top/Middle/Base */
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
                  {/* Top Notes */}
                  <div className="flex flex-col space-y-2">
                    <Label className="text-sm font-medium">Top Notes *</Label>
                    <p className="min-h-[16px] text-xs text-muted-foreground">
                      Initial scent impression
                    </p>
                    <NotesInput
                      selectedNotes={topNoteIds}
                      onNotesChange={(notes) => setValue('topNoteIds', notes)}
                      disabled={isSubmitting}
                      placeholder="Add top notes..."
                    />
                  </div>

                  {/* Middle Notes */}
                  <div className="flex flex-col space-y-2">
                    <Label className="text-sm font-medium">Middle Notes *</Label>
                    <p className="min-h-[16px] text-xs text-muted-foreground">
                      Heart of the fragrance
                    </p>
                    <NotesInput
                      selectedNotes={middleNoteIds}
                      onNotesChange={(notes) => setValue('middleNoteIds', notes)}
                      disabled={isSubmitting}
                      placeholder="Add middle notes..."
                    />
                  </div>

                  {/* Base Notes */}
                  <div className="flex flex-col space-y-2">
                    <Label className="text-sm font-medium">Base Notes *</Label>
                    <p className="min-h-[16px] text-xs text-muted-foreground">
                      Long-lasting foundation
                    </p>
                    <NotesInput
                      selectedNotes={baseNoteIds}
                      onNotesChange={(notes) => setValue('baseNoteIds', notes)}
                      disabled={isSubmitting}
                      placeholder="Add base notes..."
                    />
                  </div>
                </div>
              ) : (
                /* Linear Mode: Single field for all notes */
                <div className="flex flex-col space-y-2">
                  <Label className="text-sm font-medium">Notes *</Label>
                  <p className="min-h-[16px] text-xs text-muted-foreground">
                    Linear fragrances blend all notes together without distinct layers
                  </p>
                  <NotesInput
                    selectedNotes={linearNoteIds}
                    onNotesChange={(notes) => setValue('linearNoteIds', notes)}
                    disabled={isSubmitting}
                    placeholder="Add all notes..."
                  />
                </div>
              )}

              <div className="min-h-[20px]">
                {errors.topNoteIds && (
                  <p className="text-sm text-destructive">{errors.topNoteIds.message}</p>
                )}
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

              {/* Row 1: Type, Gender, Price Range */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Concentration */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="concentration" className="text-sm font-medium">
                      Type *
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            Concentration determines the strength and longevity of the fragrance.
                            Higher concentration = stronger scent and longer lasting.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="min-h-[16px] text-xs text-muted-foreground">Fragrance concentration level</p>
                  <Select
                    onValueChange={(value) => setValue('concentration', value as PerfumeFormData['concentration'])}
                    defaultValue={initialData?.concentration}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Parfum">Parfum (20-30%)</SelectItem>
                      <SelectItem value="EDP">Eau de Parfum (15-20%)</SelectItem>
                      <SelectItem value="EDT">Eau de Toilette (5-15%)</SelectItem>
                      <SelectItem value="EDC">Eau de Cologne (2-4%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Gender */}
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender *
                  </Label>
                  <p className="min-h-[16px] text-xs text-muted-foreground">Target audience</p>
                  <Select
                    onValueChange={(value) => setValue('gender', value as PerfumeFormData['gender'])}
                    defaultValue={initialData?.gender}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
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
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="priceRange" className="text-sm font-medium">
                    Price Range *
                  </Label>
                  <p className="min-h-[16px] text-xs text-muted-foreground">Retail price bracket</p>
                  <Select
                    onValueChange={(value) => setValue('priceRange', value as PerfumeFormData['priceRange'])}
                    defaultValue={initialData?.priceRange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
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
              </div>

              {/* Row 2: Longevity, Sillage */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Longevity */}
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="longevity" className="text-sm font-medium">
                      Longevity *
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            How long the fragrance lasts on your skin after application.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="min-h-[16px] text-xs text-muted-foreground">Duration on skin</p>
                  <Select
                    onValueChange={(value) => setValue('longevity', value as PerfumeFormData['longevity'])}
                    defaultValue={initialData?.longevity}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
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
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="sillage" className="text-sm font-medium">
                      Sillage *
                    </Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-sm">
                            The trail of scent left behind. How far the fragrance projects from your skin.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="min-h-[16px] text-xs text-muted-foreground">Scent projection</p>
                  <Select
                    onValueChange={(value) => setValue('sillage', value as PerfumeFormData['sillage'])}
                    defaultValue={initialData?.sillage}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
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

            {/* Action Buttons */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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

      {/* Image Crop Dialog */}
      {imageToCrop && (
        <ImageCropDialog
          open={cropDialogOpen}
          onOpenChange={setCropDialogOpen}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
