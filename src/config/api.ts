
// With Vite Proxy (dev) and Vercel Rewrites (prod), we can use relative paths for web.
// For Capacitor/Android, we MUST use an absolute URL from the environment.
const envApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE_URL = envApiUrl || '/api/v1';
export const BASE_URL = envApiUrl.replace(/\/api\/v1$/, '') || '';

