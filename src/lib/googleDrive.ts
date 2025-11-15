/**
 * Google Drive API Integration
 * Handles file uploads to Google Drive
 */

const GOOGLE_API_KEY = 'AIzaSyBHOf-y9m-IQwqSm_O2SW-zC-pX9B9eNEQ';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class GoogleDriveUploader {
  private accessToken: string | null = null;
  private gapiLoaded = false;

  /**
   * Initialize Google API
   */
  async initialize(): Promise<void> {
    if (this.gapiLoaded) return;

    return new Promise((resolve, reject) => {
      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('client:auth2', async () => {
          try {
            await window.gapi.client.init({
              apiKey: GOOGLE_API_KEY,
              discoveryDocs: DISCOVERY_DOCS,
            });
            this.gapiLoaded = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Authenticate with Google
   */
  async authenticate(): Promise<boolean> {
    try {
      await this.initialize();

      return new Promise((resolve) => {
        window.gapi.auth2.init({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          scope: SCOPES,
        }).then((authInstance: any) => {
          // Check if already signed in
          if (authInstance.isSignedIn.get()) {
            const user = authInstance.currentUser.get();
            const authResponse = user.getAuthResponse(true);
            this.accessToken = authResponse.access_token;
            resolve(true);
          } else {
            // Sign in
            authInstance.signIn({
              scope: SCOPES,
              prompt: 'consent'
            }).then((user: any) => {
              const authResponse = user.getAuthResponse(true);
              this.accessToken = authResponse.access_token;
              resolve(true);
            }).catch((error: any) => {
              console.error('Sign in error:', error);
              resolve(false);
            });
          }
        }).catch((error: any) => {
          console.error('Auth init error:', error);
          resolve(false);
        });
      });
    } catch (error) {
      console.error('Google Drive authentication error:', error);
      return false;
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ url: string; fileId: string }> {
    if (!this.accessToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) {
        throw new Error('Failed to authenticate with Google Drive');
      }
    }

    const metadata = {
      name: file.name,
      mimeType: file.type,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    return new Promise((resolve, reject) => {
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
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const fileId = response.id;
          
          // Make file publicly accessible
          this.makeFilePublic(fileId).then(() => {
            const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
            resolve({ url, fileId });
          }).catch(reject);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
      xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
      xhr.send(form);
    });
  }

  /**
   * Make file publicly accessible
   */
  private async makeFilePublic(fileId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to make file public');
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    const auth2 = window.gapi?.auth2?.getAuthInstance();
    if (auth2) {
      await auth2.signOut();
    }
    this.accessToken = null;
  }
}

// Global instance
export const googleDriveUploader = new GoogleDriveUploader();

// Extend Window interface
declare global {
  interface Window {
    gapi: any;
  }
}
