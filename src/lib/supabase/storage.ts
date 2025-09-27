import { supabase } from './client';

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
): Promise<{ data: unknown; error: unknown }> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  return { data, error };
};

export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
};

export const deleteFile = async (
  bucket: string,
  path: string
): Promise<{ data: unknown; error: unknown }> => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  return { data, error };
};

// Storage buckets configuration
export const STORAGE_BUCKETS = {
  PERFUME_IMAGES: 'perfume-images',
  BRAND_LOGOS: 'brand-logos',
  USER_AVATARS: 'user-avatars',
} as const;