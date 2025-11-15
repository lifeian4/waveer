/**
 * Google Drive Upload Utility
 * Uses Google Drive API v3 with OAuth2 authentication
 */

import { getValidAccessToken } from './googleDriveAuth';

const GOOGLE_DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const GOOGLE_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  url: string;
  fileId: string;
  webViewLink?: string;
  webContentLink?: string;
}

/**
 * Upload file to Google Drive
 * @param file - File to upload
 * @param onProgress - Progress callback
 * @param folderName - Optional folder name to organize files
 */
export async function uploadToGoogleDrive(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  folderName: string = 'WaverUploads'
): Promise<UploadResult> {
  try {
    // Get valid access token
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated. Please login with Google.');
    }

    // Step 1: Create or get folder ID
    const folderId = await getOrCreateFolder(folderName, accessToken);

    // Step 2: Upload file with metadata
    const metadata = {
      name: `${Date.now()}_${file.name}`,
      parents: folderId ? [folderId] : [],
      mimeType: file.type,
    };

    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', file);

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

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            const fileId = response.id;

            // Make file publicly accessible
            await makeFilePublic(fileId, accessToken);

            // Get public URL
            const publicUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
            const webViewLink = `https://drive.google.com/file/d/${fileId}/view`;

            resolve({
              url: publicUrl,
              fileId: fileId,
              webViewLink: webViewLink,
              webContentLink: publicUrl,
            });
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

      xhr.open('POST', `${GOOGLE_DRIVE_UPLOAD_URL}?uploadType=multipart`);
      xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
}

/**
 * Get or create a folder in Google Drive
 */
async function getOrCreateFolder(folderName: string, accessToken: string): Promise<string> {
  try {
    // Search for existing folder
    const searchUrl = `${GOOGLE_DRIVE_API_URL}?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create new folder if not found
    const folderMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const createResponse = await fetch(GOOGLE_DRIVE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folderMetadata),
    });

    const folderData = await createResponse.json();
    return folderData.id;
  } catch (error) {
    console.error('Error getting/creating folder:', error);
    // Return empty string to upload to root if folder creation fails
    return '';
  }
}

/**
 * Make a file publicly accessible
 */
async function makeFilePublic(fileId: string, accessToken: string): Promise<void> {
  try {
    const permissionUrl = `${GOOGLE_DRIVE_API_URL}/${fileId}/permissions`;
    
    await fetch(permissionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (error) {
    console.error('Error making file public:', error);
    // Don't throw error, file is uploaded but may not be public
  }
}

/**
 * Delete a file from Google Drive
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<void> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated. Please login with Google.');
    }

    const deleteUrl = `${GOOGLE_DRIVE_API_URL}/${fileId}`;
    
    await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get file metadata from Google Drive
 */
export async function getFileMetadata(fileId: string): Promise<any> {
  try {
    const accessToken = await getValidAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated. Please login with Google.');
    }

    const metadataUrl = `${GOOGLE_DRIVE_API_URL}/${fileId}?fields=id,name,mimeType,size,createdTime,webViewLink,webContentLink`;
    
    const response = await fetch(metadataUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw error;
  }
}
