/**
 * theme-color and manifest.json are the site *declaring* its own brand color,
 * not us guessing from CSS frequency — so these outrank every CSS-derived
 * signal when present. Pure parsing here; the actual manifest.json fetch
 * happens in the orchestrator via css-fetcher's fetchJson.
 */

/** Picks the strongest <meta name="theme-color"> value: an unconditional one
 *  (no media query) beats a light-scheme-specific one, which beats "whatever
 *  we saw first". Sites often declare separate light/dark theme-color tags. */
export function parseThemeColorMeta(html: string): string | null {
  const matches = [...html.matchAll(/<meta\b[^>]*name=["']theme-color["'][^>]*>/gi)];
  if (matches.length === 0) return null;

  let unconditional: string | null = null;
  let lightVariant: string | null = null;
  let first: string | null = null;

  for (const m of matches) {
    const tag = m[0];
    const contentMatch = tag.match(/content=["']([^"']+)["']/i);
    if (!contentMatch) continue;
    const color = contentMatch[1].trim();
    if (!color) continue;
    if (first === null) first = color;

    const mediaMatch = tag.match(/media=["']([^"']+)["']/i);
    if (!mediaMatch) {
      unconditional = color;
      break; // an unconditional theme-color is the strongest possible signal
    }
    if (lightVariant === null && /light/i.test(mediaMatch[1])) {
      lightVariant = color;
    }
  }

  return unconditional ?? lightVariant ?? first;
}

/** Resolves <link rel="manifest" href="..."> to an absolute URL, if present */
export function parseManifestUrl(html: string, baseUrl: string): string | null {
  const match = html.match(/<link\b[^>]*rel=["']manifest["'][^>]*>/i);
  if (!match) return null;
  const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
  if (!hrefMatch) return null;
  try {
    return new URL(hrefMatch[1], baseUrl).toString();
  } catch {
    return null;
  }
}

export interface ManifestColors {
  themeColor: string | null;
  backgroundColor: string | null;
}

export function extractManifestColors(manifest: unknown): ManifestColors {
  if (typeof manifest !== 'object' || manifest === null) {
    return { themeColor: null, backgroundColor: null };
  }
  const obj = manifest as Record<string, unknown>;
  return {
    themeColor: typeof obj.theme_color === 'string' && obj.theme_color.trim() ? obj.theme_color.trim() : null,
    backgroundColor:
      typeof obj.background_color === 'string' && obj.background_color.trim() ? obj.background_color.trim() : null,
  };
}
