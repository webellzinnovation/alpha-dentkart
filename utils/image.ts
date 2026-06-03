/**
 * Resolves a product or media URL.
 * Prefixes WordPress relative paths with the live URL 'https://alphadentkart.com',
 * upgrades HTTP links to HTTPS to prevent Mixed Content security blocks,
 * and automatically rewrites token-less Firebase Storage URLs to direct, publicly
 * accessible Google Cloud Storage URLs to bypass 403 Forbidden download errors.
 */
export const resolveProductImage = (src: string): string => {
  if (!src) return '/Alpha-dentkart-logo-600p.png';
  
  // Return base64 URLs as-is
  if (src.startsWith('data:')) {
    return src;
  }

  // 1. Rewrite Firebase Storage URLs to direct Google Cloud Storage URLs.
  // This bypasses the 403 Forbidden errors caused by missing download tokens.
  if (src.includes('firebasestorage.googleapis.com')) {
    try {
      const bucketMatch = src.match(/\/b\/([^/]+)/);
      const pathMatch = src.match(/\/o\/([^?#]+)/);
      
      if (bucketMatch && pathMatch) {
        const bucket = bucketMatch[1];
        const filePath = decodeURIComponent(pathMatch[1]);
        return `https://storage.googleapis.com/${bucket}/${filePath}`;
      }
    } catch (e) {
      console.warn("Failed to parse/rewrite Firebase Storage URL:", src, e);
    }
  }

  // Handle localhost media paths from development database seeds
  if (src.includes('localhost') || src.includes('127.0.0.1')) {
    const wpContentIndex = src.indexOf('/wp-content/');
    if (wpContentIndex !== -1) {
      return `https://alphadentkart.com${src.substring(wpContentIndex)}`;
    }
  }

  // If it's an absolute URL, enforce HTTPS on alphadentkart.com domains to prevent Mixed Content blocks
  if (src.startsWith('http://') || src.startsWith('https://')) {
    if (src.includes('alphadentkart.com')) {
      return src
        .replace(/^http:\/\/(www\.)?alphadentkart\.com/, 'https://alphadentkart.com')
        .replace(/^https:\/\/www\.alphadentkart\.com/, 'https://alphadentkart.com');
    }
    return src;
  }
  
  // Normalize leading slash for relative paths
  const path = src.startsWith('/') ? src : `/${src}`;
  
  // Prefix with production domain
  return `https://alphadentkart.com${path}`;
};
