/**
 * Shared color math used by both css-parser (deduping the raw palette) and
 * token-extractor (picking primary/secondary color roles). Kept in one place
 * so "how similar/meaningful is this color" is answered the same way everywhere.
 */

interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number; // 0-1, defaults to 1 (opaque) when the format has no alpha
}

/** Parses #rgb, #rgba, #rrggbb, #rrggbbaa, rgb(), rgba(). Returns null for
 *  hsl()/hsla() and anything else — callers treat null as "can't judge, don't discard". */
export function parseColor(color: string): ParsedColor | null {
  const hexMatch = color.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3 || hex.length === 4) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }

  const rgbMatch = color.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?/i
  );
  if (rgbMatch) {
    const [r, g, b] = rgbMatch.slice(1, 4).map(Number);
    const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) / (rgbMatch[4].endsWith('%') ? 100 : 1) : 1;
    return { r, g, b, a };
  }

  return null;
}

export function toRgb(color: string): [number, number, number] | null {
  const parsed = parseColor(color);
  return parsed ? [parsed.r, parsed.g, parsed.b] : null;
}

/** Euclidean RGB distance. Returns Infinity if either color can't be parsed (never treated as "similar"). */
export function colorDistance(a: string, b: string): number {
  const rgbA = toRgb(a);
  const rgbB = toRgb(b);
  if (!rgbA || !rgbB) return Infinity;
  return Math.sqrt(rgbA.reduce((sum, v, i) => sum + (v - rgbB[i]) ** 2, 0));
}

/** Rough "is this a grayscale/neutral color" check (channels nearly equal) */
export function isNeutralColor(color: string): boolean {
  const rgb = toRgb(color);
  if (!rgb) return false; // hsl() etc: assume non-neutral rather than discard it
  const [r, g, b] = rgb;
  return Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b)) < 12;
}

/** Colors this faint are essentially invisible — noise, not a real design color */
export function isTransparentColor(color: string, threshold = 0.15): boolean {
  const parsed = parseColor(color);
  return parsed !== null && parsed.a < threshold;
}

/** Combined "is this worth showing in a color palette" check */
export function isSignificantColor(color: string): boolean {
  return !isNeutralColor(color) && !isTransparentColor(color);
}

/**
 * Given a list already ranked best-first, greedily keep only colors that are
 * visually distinct from everything already kept. This merges near-duplicate
 * shades (e.g. two blues 8 units apart, or the same blue expressed as hex vs
 * rgb()) down to whichever ranked higher.
 */
export function dedupeSimilarColors(ranked: string[], threshold = 30): string[] {
  const kept: string[] = [];
  for (const color of ranked) {
    if (!kept.some((k) => colorDistance(k, color) < threshold)) kept.push(color);
  }
  return kept;
}
