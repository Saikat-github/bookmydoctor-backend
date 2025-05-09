import { v2 as cloudinary } from 'cloudinary';

const connectCloudinary = async () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    })
};

// Utility function to upload file to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        uploadStream.end(buffer);
    });
};



//Delete files from cloudinary

// Helper function to extract publicId from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    try {
      // First check if it's a valid Cloudinary URL
      if (!url || !url.includes('cloudinary.com')) {
        return null;
      }
  
      // Split the URL by '/'
      const parts = url.split('/');
      
      // Find the index of 'upload' in the URL
      const uploadIndex = parts.indexOf('upload');
      
      if (uploadIndex === -1) {
        return null;
      }
      
      // The next part after 'upload' is typically the version (starts with 'v')
      const versionIndex = uploadIndex + 1;
      
      // Check if the next part is a version number
      const hasVersion = parts[versionIndex] && parts[versionIndex].startsWith('v');
      
      // Get the starting index for the path (skip version if present)
      const startIndex = hasVersion ? versionIndex + 1 : versionIndex;
      
      // Get all parts except the last part's extension
      const pathParts = parts.slice(startIndex);
      const lastPart = pathParts[pathParts.length - 1];
      
      // Remove extension from the last part
      const fileNameWithoutExt = lastPart.split('.')[0];
      pathParts[pathParts.length - 1] = fileNameWithoutExt;
      
      // Join the path parts to get the public ID
      return pathParts.join('/');
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  };



const deleteFromCloudinary = async (publicId) => {
  try {
      return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
      console.error(`Error deleting Cloudinary file: ${err.message}`);
  }
};



export { connectCloudinary, uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl };