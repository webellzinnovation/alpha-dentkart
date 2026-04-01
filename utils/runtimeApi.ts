const rawApiBaseUrl = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '');

const absoluteApiOrigin = /^https?:\/\//i.test(rawApiBaseUrl)
  ? rawApiBaseUrl.replace(/\/api(?:\/v1)?$/, '')
  : '';

export const API_BASE_URL = rawApiBaseUrl;

export function resolveApiUrl(path: string): string {
  if (!path) {
    return API_BASE_URL;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!absoluteApiOrigin) {
    if (normalizedPath.startsWith('/api/')) {
      return normalizedPath;
    }

    return `${API_BASE_URL}${normalizedPath}`;
  }

  if (normalizedPath.startsWith('/api/')) {
    return `${absoluteApiOrigin}${normalizedPath}`;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

export function patchFetchForApiBase() {
  if (typeof window === 'undefined' || !absoluteApiOrigin || (window as any).__alphaApiPatched) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
      return originalFetch(resolveApiUrl(input), init);
    }

    if (input instanceof URL) {
      return originalFetch(new URL(resolveApiUrl(input.toString())), init);
    }

    return originalFetch(input, init);
  }) as typeof window.fetch;

  (window as any).__alphaApiPatched = true;
}
