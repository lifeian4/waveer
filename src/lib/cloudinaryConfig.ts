/**
 * Cloudinary Configuration
 * Cloud name, API key, and API secret for Cloudinary uploads
 */

export const CLOUDINARY_CONFIG = {
  cloudName: 'dwm2smxdk',
  apiKey: '153626319829941',
  apiSecret: 'oxJjmzuPN37W5EIeO8dNoUAhmDM',
  uploadPreset: 'waver_uploads', // We'll create this in Cloudinary dashboard
};

// Cloudinary upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`;

// For unsigned uploads (client-side only, more secure)
export const CLOUDINARY_UNSIGNED_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`;
