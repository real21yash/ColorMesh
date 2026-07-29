/**
 * Normalize a user-supplied string into a safe, absolute http(s) URL.
 * Returns null if the input can't be made safe (bad protocol, private/local
 * network target, unparsable).
 */
export function normalizeAndValidateUrl(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let candidate = input.trim();
  if (!candidate) return null;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const host = url.hostname.toLowerCase();
  const isPrivate =
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === '::1';
  if (isPrivate) return null;

  return url.toString();
}
