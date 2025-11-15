/**
 * Supabase Storage Upload Utility
 * Simple file upload to Supabase Storage (no extra authentication needed)
 */

import { supabase } from './supabase';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  url: string;
  path: string;
  fullPath: string;
  bucket: string;
}

/**
 * Upload file to Supabase Storage
 * @param file - File to upload
 * @param bucket - Storage bucket name (default: 'posts')
 * @param folder - Optional folder path within bucket
 * @param onProgress - Progress callback (Note: Supabase doesn't support progress natively)
 */
export async function uploadToSupabase(
  file: File,
  bucket: string = 'posts',
  folder: string = 'media',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Simulate initial progress
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Simulate completion progress
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
      fullPath: data.fullPath || data.path,
      bucket: bucket,
    };
  } catch (error: any) {
    console.error('Supabase Storage upload error:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
}

/**
 * Delete file from Supabase Storage
 * @param path - File path in storage
 * @param bucket - Storage bucket name
 */
export async function deleteFromSupabase(
  path: string,
  bucket: string = 'posts'
): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error: any) {
    console.error('Supabase Storage delete error:', error);
    throw new Error(error.message || 'Failed to delete file');
  }
}

/**
 * Get public URL for a file
 * @param path - File path in storage
 * @param bucket - Storage bucket name
 */
export function getPublicUrl(path: string, bucket: string = 'posts'): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * List files in a folder
 * @param folder - Folder path
 * @param bucket - Storage bucket name
 */
export async function listFiles(
  folder: string = '',
  bucket: string = 'posts'
): Promise<any[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('List files error:', error);
    throw new Error(error.message || 'Failed to list files');
  }
}
