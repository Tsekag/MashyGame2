const DEFAULT_BACKEND_URL = 'http://localhost:3001';

export function getBackendBaseUrl(): string {
  const configured = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  return DEFAULT_BACKEND_URL;
}

export function getApiBaseUrl(): string {
  const configured = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (configured) return configured.replace(/\/$/, '');
  return `${getBackendBaseUrl()}/api`;
}

export function resolveImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${getBackendBaseUrl()}${imageUrl}`;
}
