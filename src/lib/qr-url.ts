/**
 * Builds the full URL to encode in QR codes.
 * Uses NEXT_PUBLIC_BASE_URL env var, or falls back to window.location.origin.
 */
export function getTrackingUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/seguimiento?code=${code}`;
}

/**
 * Extracts a tracking code from a QR value (which may be a full URL or just a code).
 */
export function extractCodeFromQR(raw: string): string {
  const urlMatch = raw.match(/[?&]code=([A-Z0-9]+)/i);
  if (urlMatch) return urlMatch[1].toUpperCase();
  const trackMatch = raw.match(/\/track\/([A-Z0-9]+)/i);
  if (trackMatch) return trackMatch[1].toUpperCase();
  return raw.trim().toUpperCase();
}
