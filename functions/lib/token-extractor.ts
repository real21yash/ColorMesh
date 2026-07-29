import type { RawExtraction, StyleExtractionResult, ButtonSample, VariableColorCandidate } from './types';
import { isNeutralColor, colorDistance } from './color-math';

const MIN_DISTINCT_DISTANCE = 30; // same threshold used to dedupe the palette
const MIN_ACCENT_WEIGHT_RATIO = 0.2; // a runner-up must be at least 20% as strong as brand to count

function findVariableColor(candidates: VariableColorCandidate[], pattern: RegExp): string | null {
  return candidates.find((v) => pattern.test(v.name))?.color ?? null;
}

type ColorSource = 'declared' | 'css' | null;

/**
 * Prefers declared, site-authored signals over anything inferred from CSS:
 * 1. <meta name="theme-color"> / manifest.json — the site's own declaration.
 * 2. CSS variables named like design-system roles (--brand, --accent, ...).
 * 3. Frequency-ranked guess from stylesheets, with a weight-ratio backstop
 *    (large sites with hashed/obfuscated class names routinely defeat
 *    name-based noise filtering, so a fringe one-off color still gets
 *    rejected even when it's the only "distinct" runner-up available).
 */
function pickColorRoles(raw: RawExtraction) {
  const colorful = raw.colors.filter((c) => !isNeutralColor(c));
  const meta = raw.metaColorSignals;

  let brand: string | null;
  let brandSource: ColorSource;
  if (meta.themeColor) {
    brand = meta.themeColor;
    brandSource = 'declared';
  } else {
    brand = findVariableColor(raw.variableColorCandidates, /brand|-primary$|^primary$/i) ?? colorful[0] ?? raw.colors[0] ?? null;
    brandSource = brand ? 'css' : null;
  }
  const brandWeight = brand ? raw.colorWeights[brand] ?? 0 : 0;

  let accent = findVariableColor(raw.variableColorCandidates, /accent|secondary/i);
  if (!accent) {
    const rest = colorful.filter((c) => c !== brand);
    const candidate = rest.find((c) => (brand ? colorDistance(brand, c) >= MIN_DISTINCT_DISTANCE : true));
    if (candidate) {
      const candidateWeight = raw.colorWeights[candidate] ?? 0;
      const isMeaningfulRunnerUp = brandWeight === 0 || candidateWeight / brandWeight >= MIN_ACCENT_WEIGHT_RATIO;
      accent = isMeaningfulRunnerUp ? candidate : null;
    }
  }

  let surface: string | null;
  let surfaceSource: ColorSource;
  if (meta.manifestBackgroundColor) {
    surface = meta.manifestBackgroundColor;
    surfaceSource = 'declared';
  } else {
    surface = findVariableColor(raw.variableColorCandidates, /surface|\bbg\b|background/i) ?? raw.bodyBackground;
    surfaceSource = surface ? 'css' : null;
  }

  const border = findVariableColor(raw.variableColorCandidates, /\bborder\b/i);

  return { brand, brandSource, accent, surface, surfaceSource, border };
}

/**
 * Groups button samples by (background, radius) signature and keeps the top
 * 3 distinct clusters' representative sample — averaging every button found
 * would blend a primary and a destructive button into a meaningless middle.
 */
function clusterButtons(samples: ButtonSample[]): ButtonSample[] {
  const groups = new Map<string, { sample: ButtonSample; count: number }>();
  for (const s of samples) {
    const key = `${s.backgroundColor ?? ''}|${s.borderRadius ?? ''}`;
    const existing = groups.get(key);
    if (existing) existing.count++;
    else groups.set(key, { sample: s, count: 1 });
  }
  return [...groups.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((g) => g.sample);
}

export function buildDesignTokens(
  siteUrl: string,
  raw: RawExtraction
): Omit<StyleExtractionResult, 'tailwind' | 'confidence' | 'pressKit'> {
  const roles = pickColorRoles(raw);

  return {
    site: siteUrl,
    colors: {
      brand: roles.brand,
      accent: roles.accent,
      surface: roles.surface,
      background: raw.bodyBackground,
      text: raw.bodyTextColor,
      border: roles.border,
      palette: raw.colors,
      usingDominantPaletteOnly: false, // finalized in response-formatter once confidence is known
      source: {
        brand: roles.brandSource,
        surface: roles.surfaceSource,
      },
    },
    typography: {
      fonts: raw.fontFamilies,
      sizes: raw.typographySizes,
    },
    spacing: raw.spacing,
    radius: raw.radii,
    shadows: raw.shadows,
    cssVariables: raw.cssVariables,
    buttons: {
      detected: raw.buttons.length,
      variants: clusterButtons(raw.buttons),
    },
  };
}
