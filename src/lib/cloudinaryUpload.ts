/**
 * Cloudinary Upload Utility
 * Handles image and video uploads to Cloudinary
 */

import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL } from './cloudinaryConfig';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
  resourceType: 'image' | 'video';
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
}

/**
 * Upload file to Cloudinary
 * @param file - File to upload (image or video)
 * @param onProgress - Progress callback
 * @param folder - Optional folder name in Cloudinary (default: 'waver_posts')
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  folder: string = 'waver_posts'
): Promise<UploadResult> {
  try {
    // Determine resource type based on file type
    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';

    // Create form data for unsigned upload
    // Only use parameters allowed for unsigned uploads
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default'); // Must be configured in Cloudinary dashboard
    formData.append('folder', folder);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            loaded: e.loaded,
            total: e.total,
            percentage: Math.round((e.loaded / e.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            
            resolve({
              url: response.url,
              secureUrl: response.secure_url,
              publicId: response.public_id,
              resourceType: response.resource_type,
              format: response.format,
              width: response.width,
              height: response.height,
              duration: response.duration,
              bytes: response.bytes,
            });
          } catch (e) {
            reject(new Error('Upload failed: Could not parse response'));
          }
        } else {
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            reject(new Error(`Upload failed: ${errorResponse.error?.message || xhr.statusText}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Use the appropriate upload URL based on resource type
      const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`;
      
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Delete a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @param resourceType - Type of resource ('image' or 'video')
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<void> {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    
    // Note: For production, you should implement this on your backend
    // as it requires the API secret which shouldn't be exposed to the client
    const destroyUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/destroy`;
    
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', CLOUDINARY_CONFIG.apiKey);
    formData.append('timestamp', timestamp.toString());
    
    const response = await fetch(destroyUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to delete file from Cloudinary');
    }
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
}

/**
 * Generate optimized URL for Cloudinary asset
 * @param publicId - The public ID of the asset
 * @param options - Transformation options
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  } = {}
): string {
  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformations = [];
  
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (crop) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  const transformString = transformations.join(',');
  
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformString}/${publicId}`;
}

/**
 * Generate video thumbnail URL
 * @param publicId - The public ID of the video
 * @param options - Thumbnail options
 */
export function getVideoThumbnail(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    time?: number; // Time in seconds to capture thumbnail
  } = {}
): string {
  const { width = 640, height = 360, time = 0 } = options;
  
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/video/upload/so_${time},w_${width},h_${height},c_fill,f_jpg/${publicId}.jpg`;
}
