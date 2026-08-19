import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} imageBase64 - Base64 encoded image string (data:image/...)
 * @param {string} folder - Folder path in Cloudinary (optional)
 * @returns {Promise<{url: string, public_id: string}>}
 */
export const uploadImage = async (imageBase64, folder = 'nile-booking/receipts') => {
  try {
    // Detect resource type and strip data URL prefix
    const isPdf = imageBase64.startsWith('data:application/pdf');
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');
    const mimeType = isPdf ? 'application/pdf' : 'image/jpeg';
    const resourceType = isPdf ? 'raw' : 'image';
    
    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${base64Data}`,
      {
        folder,
        resource_type: resourceType,
        ...(isPdf ? {} : {
          format: 'jpg',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        }),
      }
    );

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw - deletion failures shouldn't break the flow
  }
};

export default cloudinary;
