
// Use localhost to avoid IPv4/IPv6 binding issues
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const getApiUrl = (path) => {
  let baseUrl = API_BASE_URL;
  // Ensure we target the /api prefix for backend routes
  if (!baseUrl.endsWith('/api')) {
    baseUrl = `${baseUrl}/api`;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};
