import { probeUrl } from './css-fetcher';

export interface PressKitResult {
  url: string;
  label: string;
  /** 'linked' = found an actual link on the page (high confidence).
   *  'guessed' = no link found, but a conventional path (e.g. /press) resolved. */
  source: 'linked' | 'guessed';
}

const PRESS_KEYWORDS = /press\s*kit|media\s*kit|newsroom|brand\s*(guidelines|assets)|press\b|media\s*(resources|center)/i;

/** Conventional paths worth probing when no press-kit link is visible on the
 *  page itself (common on sites using non-descriptive/hashed nav markup). */
const GUESS_PATHS: { path: string; label: string }[] = [
  { path: '/press', label: 'Press' },
  { path: '/press-kit', label: 'Press Kit' },
  { path: '/media-kit', label: 'Media Kit' },
  { path: '/newsroom', label: 'Newsroom' },
  { path: '/brand', label: 'Brand' },
  { path: '/about/press', label: 'Press' },
  { path: '/media', label: 'Media' },
];

/** Scans real <a> tags for press/media-kit-like link text or hrefs */
export function findPressKitLink(html: string, baseUrl: string): PressKitResult | null {
  const anchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html))) {
    const attrs = match[1];
    const text = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const href = hrefMatch[1];
    if (!PRESS_KEYWORDS.test(text) && !PRESS_KEYWORDS.test(href)) continue;
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue;

    try {
      const url = new URL(href, baseUrl).toString();
      return { url, label: text || 'Press Kit', source: 'linked' };
    } catch {
      continue;
    }
  }

  return null;
}

/** Fallback: probe a handful of conventional paths in parallel, return the first that resolves */
export async function guessPressKitLink(baseUrl: string): Promise<PressKitResult | null> {
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return null;
  }

  const attempts = GUESS_PATHS.map(async ({ path, label }) => {
    const url = origin + path;
    const ok = await probeUrl(url);
    return ok ? { url, label, source: 'guessed' as const } : null;
  });

  const results = await Promise.allSettled(attempts);
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) return r.value;
  }
  return null;
}
