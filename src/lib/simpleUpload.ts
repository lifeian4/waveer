/**
 * Simple File Upload using Imgur API
 * Free, no authentication required for uploads
 */

const IMGUR_CLIENT_ID = 'c0d6f8961a3e7e7'; // Updated Imgur client ID

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  url: string;
  deleteHash?: string;
}

/**
 * Upload image to Imgur
 */
export async function uploadImage(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    // Convert file to base64 for better compatibility
    const reader = new FileReader();
    
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      
      const formData = new FormData();
      formData.append('image', base64);
      formData.append('type', 'base64');

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
            if (response.success && response.data) {
              resolve({
                url: response.data.link,
                deleteHash: response.data.deletehash,
              });
            } else {
              reject(new Error('Upload failed: Invalid response'));
            }
          } catch (e) {
            reject(new Error('Upload failed: Could not parse response'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', 'https://api.imgur.com/3/image');
      xhr.setRequestHeader('Authorization', `Client-ID ${IMGUR_CLIENT_ID}`);
      xhr.send(formData);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Upload video using Streamable API (free, no auth required)
 */
export async function uploadVideo(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

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
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const response = JSON.parse(xhr.responseText);
          // Streamable returns shortcode, construct URL
          const videoUrl = `https://streamable.com/${response.shortcode}`;
          const embedUrl = `https://streamable.com/e/${response.shortcode}`;
          resolve({
            url: embedUrl, // Use embed URL for direct playback
          });
        } catch (e) {
          reject(new Error('Video upload failed: Could not parse response'));
        }
      } else {
        reject(new Error(`Video upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during video upload'));
    });

    xhr.open('POST', 'https://api.streamable.com/upload');
    xhr.send(formData);
  });
}

/**
 * Upload file (auto-detects type)
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  const isVideo = file.type.startsWith('video/');
  
  if (isVideo) {
    return uploadVideo(file, onProgress);
  } else {
    return uploadImage(file, onProgress);
  }
}
