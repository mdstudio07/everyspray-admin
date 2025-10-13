/**
 * Image Thumbnail Utility
 *
 * High-quality image thumbnail generation using Canvas API.
 * Generates 90x90px thumbnails while maintaining aspect ratio and quality.
 */

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number; // 0.0 to 1.0
  fit?: 'cover' | 'contain';
}

const DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
  width: 90,
  height: 90,
  quality: 0.95,
  fit: 'cover',
};

/**
 * Generate high-quality thumbnail from File or Blob
 */
export async function generateThumbnail(
  file: File | Blob,
  options: ThumbnailOptions = {}
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    // Create Image element
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        // Clean up object URL
        URL.revokeObjectURL(objectUrl);

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Calculate dimensions
        const { drawWidth, drawHeight, offsetX, offsetY } = calculateDimensions(
          img.width,
          img.height,
          opts.width,
          opts.height,
          opts.fit
        );

        // Set canvas size
        canvas.width = opts.width;
        canvas.height = opts.height;

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Fill background (for transparent images)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image with calculated dimensions
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }

            // Generate data URL for preview
            const dataUrl = canvas.toDataURL('image/jpeg', opts.quality);

            resolve({
              blob,
              dataUrl,
              width: opts.width,
              height: opts.height,
            });
          },
          'image/jpeg',
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
}

/**
 * Calculate dimensions for cover or contain fit
 */
function calculateDimensions(
  imgWidth: number,
  imgHeight: number,
  targetWidth: number,
  targetHeight: number,
  fit: 'cover' | 'contain'
): {
  drawWidth: number;
  drawHeight: number;
  offsetX: number;
  offsetY: number;
} {
  const imgAspect = imgWidth / imgHeight;
  const targetAspect = targetWidth / targetHeight;

  let drawWidth: number;
  let drawHeight: number;
  let offsetX = 0;
  let offsetY = 0;

  if (fit === 'cover') {
    // Fill entire canvas, crop excess
    if (imgAspect > targetAspect) {
      // Image is wider
      drawHeight = targetHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (targetWidth - drawWidth) / 2;
    } else {
      // Image is taller
      drawWidth = targetWidth;
      drawHeight = drawWidth / imgAspect;
      offsetY = (targetHeight - drawHeight) / 2;
    }
  } else {
    // Contain - fit entire image within canvas
    if (imgAspect > targetAspect) {
      // Image is wider
      drawWidth = targetWidth;
      drawHeight = drawWidth / imgAspect;
      offsetY = (targetHeight - drawHeight) / 2;
    } else {
      // Image is taller
      drawHeight = targetHeight;
      drawWidth = drawHeight * imgAspect;
      offsetX = (targetWidth - drawWidth) / 2;
    }
  }

  return { drawWidth, drawHeight, offsetX, offsetY };
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type - Now supports AVIF, WebP, JPEG, PNG, SVG
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/svg+xml',
  ];

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPEG, PNG, WebP, AVIF, or SVG.',
    };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 5MB.',
    };
  }

  return { valid: true };
}

/**
 * Read file as data URL for preview
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
