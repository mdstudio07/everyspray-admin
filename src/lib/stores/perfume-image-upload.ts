import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Perfume Image Upload Store
 *
 * Manages image upload state, queue, and progress
 * Stores uploaded image URLs and thumbnail URLs
 * Persists to sessionStorage (clears on tab close)
 */

export type ImageStatus = 'pending' | 'uploading' | 'uploaded' | 'error';

/**
 * Generate high-quality 400x500 main image and 90x90 thumbnail
 */
async function generateHighQualityImages(file: File): Promise<{
  mainImage: string;
  thumbnail: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Generate 400x500 main image
          const mainCanvas = document.createElement('canvas');
          const mainCtx = mainCanvas.getContext('2d');
          if (!mainCtx) throw new Error('Failed to get canvas context');

          mainCanvas.width = 400;
          mainCanvas.height = 500;
          mainCtx.imageSmoothingEnabled = true;
          mainCtx.imageSmoothingQuality = 'high';
          mainCtx.drawImage(img, 0, 0, 400, 500);
          const mainImage = mainCanvas.toDataURL('image/jpeg', 0.95);

          // Generate 90x90 thumbnail
          const thumbCanvas = document.createElement('canvas');
          const thumbCtx = thumbCanvas.getContext('2d');
          if (!thumbCtx) throw new Error('Failed to get canvas context');

          thumbCanvas.width = 90;
          thumbCanvas.height = 90;
          thumbCtx.imageSmoothingEnabled = true;
          thumbCtx.imageSmoothingQuality = 'high';
          thumbCtx.drawImage(img, 0, 0, 90, 90);
          const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.95);

          resolve({ mainImage, thumbnail });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

export interface UploadingImage {
  id: string;
  file: File;
  preview: string; // Base64 preview
  status: ImageStatus;
  progress: number; // 0-100
  uploadedUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

interface PerfumeImageUploadState {
  // State
  images: UploadingImage[];
  mainImageId: string | null;
  isImportDialogOpen: boolean;

  // Actions
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  setMainImage: (id: string) => void;
  uploadImage: (id: string) => Promise<void>;
  updateImageStatus: (id: string, status: ImageStatus, progress?: number, error?: string) => void;
  setUploadedUrls: (id: string, uploadedUrl: string, thumbnailUrl: string) => void;
  setImportDialogOpen: (open: boolean) => void;
  clearAll: () => void;

  // Getters
  getPendingImages: () => UploadingImage[];
  getUploadedImages: () => UploadingImage[];
  getMainImage: () => UploadingImage | null;
}

export const usePerfumeImageUploadStore = create<PerfumeImageUploadState>()(
  persist(
    (set, get) => ({
  // Initial state
  images: [],
  mainImageId: null,
  isImportDialogOpen: false,

  // Add images to queue
  addImages: (files: File[]) => {
    const newImages: UploadingImage[] = files.map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));

    set((state) => {
      const images = [...state.images, ...newImages];
      // Set first image as main if no main image yet
      const mainImageId = state.mainImageId || (images.length > 0 ? images[0].id : null);
      return { images, mainImageId };
    });
  },

  // Remove image from queue
  removeImage: (id: string) => {
    set((state) => {
      const images = state.images.filter((img) => img.id !== id);

      // If removed image was main, set first uploaded image as main (or null if none)
      let mainImageId = state.mainImageId;
      if (state.mainImageId === id) {
        const uploadedImages = images.filter(img => img.status === 'uploaded');
        mainImageId = uploadedImages.length > 0 ? uploadedImages[0].id : null;
      }

      return { images, mainImageId };
    });
  },

  // Set main image
  setMainImage: (id: string) => {
    set({ mainImageId: id });
  },

  // Upload image (simulated for now - will connect to Supabase later)
  uploadImage: async (id: string) => {
    const { images, updateImageStatus, setUploadedUrls } = get();
    const image = images.find((img) => img.id === id);

    if (!image) return;

    try {
      // Update status to uploading
      updateImageStatus(id, 'uploading', 0);

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        updateImageStatus(id, 'uploading', progress);
      }

      // Generate high-quality 400x500 main image and 90x90 thumbnail
      const { mainImage, thumbnail } = await generateHighQualityImages(image.file);

      // Set uploaded URLs (using data URLs for now - will be Supabase URLs later)
      setUploadedUrls(id, mainImage, thumbnail);
      updateImageStatus(id, 'uploaded', 100);
    } catch (error) {
      console.error('Upload error:', error);
      updateImageStatus(id, 'error', 0, 'Upload failed');
    }
  },

  // Update image status
  updateImageStatus: (id: string, status: ImageStatus, progress = 0, error?: string) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? { ...img, status, progress, error }
          : img
      ),
    }));
  },

  // Set uploaded URLs
  setUploadedUrls: (id: string, uploadedUrl: string, thumbnailUrl: string) => {
    set((state) => ({
      images: state.images.map((img) =>
        img.id === id
          ? { ...img, uploadedUrl, thumbnailUrl }
          : img
      ),
    }));
  },

  // Set import dialog state
  setImportDialogOpen: (open: boolean) => {
    set({ isImportDialogOpen: open });
  },

  // Clear all images
  clearAll: () => {
    set({ images: [], mainImageId: null });
  },

  // Get pending images
  getPendingImages: () => {
    return get().images.filter((img) => img.status === 'pending' || img.status === 'uploading');
  },

  // Get uploaded images
  getUploadedImages: () => {
    return get().images.filter((img) => img.status === 'uploaded');
  },

  // Get main image
  getMainImage: () => {
    const { images, mainImageId } = get();
    return images.find((img) => img.id === mainImageId) || null;
  },
}),
    {
      name: 'perfume-image-upload-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        // Persist uploaded images with their URLs
        images: state.images.filter(img => img.status === 'uploaded'),
        mainImageId: state.mainImageId,
      }),
    }
  )
);
