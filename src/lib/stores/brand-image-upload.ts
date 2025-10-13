import { create } from 'zustand';

/**
 * Brand Image Upload Store
 *
 * Manages brand image uploads (logo + banner)
 * Handles preview URLs, upload status, and validation
 * Simpler than perfume upload (only 2 images instead of 5)
 */

export type ImageType = 'logo' | 'banner';

export interface BrandImageState {
  logoUrl: string | null;
  logoFile: File | null;
  logoPreview: string | null;
  isLogoUploading: boolean;

  bannerUrl: string | null;
  bannerFile: File | null;
  bannerPreview: string | null;
  isBannerUploading: boolean;

  // Actions
  setLogo: (file: File, preview: string) => void;
  setBanner: (file: File, preview: string) => void;
  setLogoUrl: (url: string) => void;
  setBannerUrl: (url: string) => void;
  setLogoUploading: (isUploading: boolean) => void;
  setBannerUploading: (isUploading: boolean) => void;
  removeLogo: () => void;
  removeBanner: () => void;
  loadExistingImages: (logoUrl: string, bannerUrl: string) => void;
  resetImages: () => void;
}

export const useBrandImageStore = create<BrandImageState>((set) => ({
  // Logo state
  logoUrl: null,
  logoFile: null,
  logoPreview: null,
  isLogoUploading: false,

  // Banner state
  bannerUrl: null,
  bannerFile: null,
  bannerPreview: null,
  isBannerUploading: false,

  // Set logo file with preview
  setLogo: (file: File, preview: string) => {
    set({
      logoFile: file,
      logoPreview: preview,
      logoUrl: null, // Clear existing URL when new file selected
    });
  },

  // Set banner file with preview
  setBanner: (file: File, preview: string) => {
    set({
      bannerFile: file,
      bannerPreview: preview,
      bannerUrl: null, // Clear existing URL when new file selected
    });
  },

  // Set logo URL (after upload)
  setLogoUrl: (url: string) => {
    set({
      logoUrl: url,
      logoFile: null,
      logoPreview: null,
    });
  },

  // Set banner URL (after upload)
  setBannerUrl: (url: string) => {
    set({
      bannerUrl: url,
      bannerFile: null,
      bannerPreview: null,
    });
  },

  // Set logo uploading state
  setLogoUploading: (isUploading: boolean) => {
    set({ isLogoUploading: isUploading });
  },

  // Set banner uploading state
  setBannerUploading: (isUploading: boolean) => {
    set({ isBannerUploading: isUploading });
  },

  // Remove logo
  removeLogo: () => {
    set({
      logoFile: null,
      logoPreview: null,
      logoUrl: null,
      isLogoUploading: false,
    });
  },

  // Remove banner
  removeBanner: () => {
    set({
      bannerFile: null,
      bannerPreview: null,
      bannerUrl: null,
      isBannerUploading: false,
    });
  },

  // Load existing images (for edit mode)
  loadExistingImages: (logoUrl: string, bannerUrl: string) => {
    set({
      logoUrl,
      bannerUrl,
      logoFile: null,
      bannerFile: null,
      logoPreview: null,
      bannerPreview: null,
      isLogoUploading: false,
      isBannerUploading: false,
    });
  },

  // Reset all images
  resetImages: () => {
    set({
      logoUrl: null,
      logoFile: null,
      logoPreview: null,
      isLogoUploading: false,
      bannerUrl: null,
      bannerFile: null,
      bannerPreview: null,
      isBannerUploading: false,
    });
  },
}));

/**
 * Helper function to create image preview URL
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Helper function to validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
}

/**
 * Recommended image dimensions
 */
export const BRAND_IMAGE_DIMENSIONS = {
  logo: {
    width: 400,
    height: 400,
    aspectRatio: '1:1',
    description: 'Square logo (400x400px recommended)',
  },
  banner: {
    width: 1200,
    height: 400,
    aspectRatio: '3:1',
    description: 'Wide banner (1200x400px recommended)',
  },
} as const;
