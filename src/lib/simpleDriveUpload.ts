/**
 * Google Drive Upload (Using API Key - No OAuth)
 * Uploads to a specific public folder
 */

const GOOGLE_API_KEY = 'AIzaSyA1aus5oAR-e-8hWbcya_gntt2aQPMS2HE';
const FOLDER_ID = '1CAVcVoAkqMIkMfHGbulmzeHRnKb3pqNJ'; // WaverUploads folder

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  url: string;
  fileId: string;
  fileName: string;
  webViewLink: string;
  directLink: string;
}

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload file to Google Drive
 * Uses multipart upload with API key
 */
export async function uploadToDrive(
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  try {
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });
    }

    // Step 1: Convert file to base64
    const base64Data = await fileToBase64(file);
    
    if (onProgress) {
      onProgress({ loaded: file.size * 0.3, total: file.size, percentage: 30 });
    }

    // Step 2: Create metadata
    const metadata = {
      name: `${Date.now()}_${file.name}`,
      mimeType: file.type,
      parents: [FOLDER_ID],
    };

    // Step 3: Create multipart body
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelimiter = "\r\n--" + boundary + "--";

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + file.type + '\r\n' +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      base64Data +
      closeDelimiter;

    if (onProgress) {
      onProgress({ loaded: file.size * 0.5, total: file.size, percentage: 50 });
    }

    // Step 4: Upload to Google Drive
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/related; boundary=' + boundary,
        },
        body: multipartRequestBody,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();
    const fileId = data.id;

    if (onProgress) {
      onProgress({ loaded: file.size * 0.8, total: file.size, percentage: 80 });
    }

    // Step 5: Make file publicly accessible
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size, percentage: 100 });
    }

    // Return URLs
    const directLink = `https://drive.google.com/uc?export=view&id=${fileId}`;
    const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;

    return {
      url: directLink,
      fileId: fileId,
      fileName: data.name,
      webViewLink: webViewLink,
      directLink: directLink,
    };
  } catch (error: any) {
    console.error('Google Drive upload error:', error);
    throw new Error(error.message || 'Failed to upload to Google Drive');
  }
}

/**
 * Delete file from Google Drive
 */
export async function deleteFromDrive(fileId: string): Promise<void> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?key=${GOOGLE_API_KEY}`,
      {
        method: 'DELETE',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  } catch (error: any) {
    console.error('Delete error:', error);
    throw new Error(error.message || 'Failed to delete file');
  }
}
