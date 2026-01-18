// Add backend URL constant
const BACKEND_URL = 'http://localhost:5000';

export const formatImageUrl = (imagePath, type = 'profile') => {
  if (!imagePath) return null;
  
  // Remove leading slash if exists
  const cleanPath = imagePath.replace(/^\//, '');
  
  // If the path already includes 'uploads/', just add the backend URL
  if (cleanPath.startsWith('uploads/')) {
    return `${BACKEND_URL}/${cleanPath}`;
  }
  
  // Otherwise, add the appropriate prefix based on type
  const prefix = type === 'profile' ? 'uploads/profile-pictures/' : 'uploads/posts/';
  return `${BACKEND_URL}/${prefix}${cleanPath}`;
}; 