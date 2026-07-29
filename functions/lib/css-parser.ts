import type { RawExtraction, ButtonSample, TypographySample, VariableColorCandidate, CategorizedCssVariables } from './types';
import { dedupeSimilarColors, isSignificantColor } from './color-math';
import { clusterNumbers } from './cluster-utils';

const GENERIC_FONT_FAMILIES = new Set([
  'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
  'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded', 'inherit', 'initial', 'unset',
]);

/** Selectors matching these are almost never a site's actual design system —
 *  promo banners, third-party widgets, carousels, and similar noise. Colors,
 *  shadows, and buttons found only inside these are excluded. */
const NOISE_SELECTOR =
  /promo|campaign|\bsale\b|\boffer\b|\bevent\b|illustration|\bsvg\b|\bicon\b|carousel|swiper|embla|slick|\btoast\b|\bmodal\b|tooltip|cookie|banner|notification|\bchat\b|intercom|zendesk|crisp|hubspot|recaptcha|iframe/i;

/** Selectors matching these are far more likely to carry actual brand colors
 *  than incidental promo/utility rules, so their colors get weighted up. */
const BRAND_SIGNAL_SELECTOR = /nav|header|footer|logo|brand|btn|button|cta|hero|masthead/i;

/** CSS custom property names that suggest the value is a design-system color role */
const COLOR_ROLE_VAR_NAME =
  /color|brand|accent|primary|secondary|surface|\bbg\b|background|text|border|success|warn|danger|error/i;

function countAndRank(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([v]) => v);
}

function extractColorMatches(value: string): string[] {
  return [
    ...(value.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g) ?? []),
    ...(value.match(/rgba?\([^)]+\)/g) ?? []),
    ...(value.match(/hsla?\([^)]+\)/g) ?? []),
  ];
}

/**
 * CSS variables named like design tokens (--brand, --accent, --surface, ...)
 * are far stronger evidence of a color's role than raw frequency — a variable
 * declaration is a deliberate design decision, not an incidental style.
 */
function extractVariableColorCandidates(css: string): VariableColorCandidate[] {
  const declarations = [...css.matchAll(/--([\w-]+)\s*:\s*([^;}]+)[;}]/g)];
  const candidates: VariableColorCandidate[] = [];
  const seen = new Set<string>();

  for (const [, name, rawValue] of declarations) {
    if (!COLOR_ROLE_VAR_NAME.test(name) || seen.has(name)) continue;
    const found = extractColorMatches(rawValue.trim())[0];
    if (!found) continue;
    const color = found.trim().toLowerCase();
    if (!isSignificantColor(color)) continue;
    seen.add(name);
    candidates.push({ name, color });
  }

  return candidates;
}

/**
 * Weighted color extraction for the "dominant palette" fallback: walks rule
 * blocks (skipping noise selectors entirely) and weights each color by
 * selector relevance (nav/header/logo/button/cta) and property (backgrounds
 * count more than plain text color), then dedupes near-identical shades.
 */
function extractColors(css: string): { colors: string[]; weights: Record<string, number> } {
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  const propRegex = /(color|background|background-color|border-color|fill|stroke)\s*:\s*([^;]+)/gi;
  const weights = new Map<string, number>();
  let ruleMatch: RegExpExecArray | null;

  while ((ruleMatch = ruleRegex.exec(css))) {
    const selector = ruleMatch[1].trim();
    if (selector.length > 200 || NOISE_SELECTOR.test(selector)) continue;

    const selectorBoost = BRAND_SIGNAL_SELECTOR.test(selector) ? 6 : 1;
    const body = ruleMatch[2];

    let propMatch: RegExpExecArray | null;
    propRegex.lastIndex = 0;
    while ((propMatch = propRegex.exec(body))) {
      const property = propMatch[1].toLowerCase();
      const propertyBoost = property.startsWith('background') ? 2 : 1;

      for (const raw of extractColorMatches(propMatch[2])) {
        const normalized = raw.trim().toLowerCase();
        if (!isSignificantColor(normalized)) continue;
        weights.set(normalized, (weights.get(normalized) ?? 0) + selectorBoost * propertyBoost);
      }
    }
  }

  const ranked = [...weights.entries()].sort((a, b) => b[1] - a[1]).map(([color]) => color);
  const colors = dedupeSimilarColors(ranked, 30).slice(0, 8);
  const dedupedWeights: Record<string, number> = {};
  for (const c of colors) dedupedWeights[c] = weights.get(c) ?? 0;
  return { colors, weights: dedupedWeights };
}

function extractFontFamilies(css: string): string[] {
  const declarations = css.match(/font-family\s*:\s*([^;}]+)/gi) ?? [];
  const families = declarations.flatMap((d) => {
    const value = d.replace(/font-family\s*:/i, '').trim();
    return value.split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''));
  });

  const filtered = families.filter(
    (f) => f.length > 0 && !GENERIC_FONT_FAMILIES.has(f.toLowerCase()) && !f.startsWith('var(')
  );

  return countAndRank(filtered, 6);
}

/** Rounds font-size to whole px and line-height to at most 2 decimals, then
 *  clusters sizes within ±1px so "17/18/19/21px" collapses to a real scale. */
function extractTypographySizes(css: string): TypographySample[] {
  const blocks = css.match(/\{[^{}]*\}/g) ?? [];
  const samples: { px: number; lineHeight: string | null }[] = [];

  for (const block of blocks) {
    const sizeMatch = block.match(/font-size\s*:\s*([\d.]+)(px|rem|em)/i);
    if (!sizeMatch) continue;
    const size = parseFloat(sizeMatch[1]);
    const px = sizeMatch[2] === 'px' ? size : size * 16;

    const lineMatch = block.match(/line-height\s*:\s*([\d.]+)(px|rem|em|%)?/i);
    let lineHeight: string | null = null;
    if (lineMatch) {
      const lhNum = parseFloat(lineMatch[1]);
      const lhUnit = lineMatch[2] ?? '';
      const rounded = lhUnit === '' ? Math.round(lhNum * 100) / 100 : Math.round(lhNum);
      lineHeight = `${rounded}${lhUnit}`;
    }

    samples.push({ px: Math.round(px), lineHeight });
  }

  if (samples.length === 0) return [];

  const sorted = [...samples].sort((a, b) => a.px - b.px);
  const clusters: (typeof samples)[] = [];
  for (const s of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && s.px - last[last.length - 1].px <= 1) last.push(s);
    else clusters.push([s]);
  }

  return clusters
    .map((cluster) => {
      const repSize = Math.round(cluster.reduce((sum, x) => sum + x.px, 0) / cluster.length);
      const lhCounts = new Map<string, number>();
      for (const item of cluster) if (item.lineHeight) lhCounts.set(item.lineHeight, (lhCounts.get(item.lineHeight) ?? 0) + 1);
      const bestLineHeight = [...lhCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return { fontSize: `${repSize}px`, lineHeight: bestLineHeight, weight: cluster.length };
    })
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 8)
    .map(({ fontSize, lineHeight }) => ({ fontSize, lineHeight }))
    .sort((a, b) => parseFloat(a.fontSize) - parseFloat(b.fontSize));
}

/** Only px/rem/em/% are real design tokens — vw/vh/calc()/inherit/unset/var()
 *  are implementation details, not a radius scale. Nearby values are clustered. */
function extractRadii(css: string): string[] {
  const declarations = css.match(/border-radius\s*:\s*([^;}]+)/gi) ?? [];
  const pxValues: number[] = [];
  const percentTokens = new Set<string>();

  for (const d of declarations) {
    const value = d.replace(/border-radius\s*:/i, '').trim();
    if (!value || /vw|vh|calc\(|inherit|unset|var\(/i.test(value)) continue;

    const pctMatch = value.match(/^([\d.]+)%$/);
    if (pctMatch) {
      if (parseFloat(pctMatch[1]) > 0) percentTokens.add(`${pctMatch[1]}%`);
      continue;
    }

    const unitMatch = value.match(/^([\d.]+)(px|rem|em)$/);
    if (!unitMatch) continue;
    const num = parseFloat(unitMatch[1]);
    const px = unitMatch[2] === 'px' ? num : num * 16;
    if (px > 0 && px < 300) pxValues.push(px);
  }

  const clustered = clusterNumbers(pxValues, 2, 6).map((px) => `${px}px`);
  return [...clustered, ...percentTokens].slice(0, 6);
}

/** Ignores noise-selector shadows (widgets/modals/toasts/etc), normalizes
 *  whitespace so cosmetic formatting differences don't count as distinct
 *  shadows, and dedupes exact repeats. */
function extractShadows(css: string): string[] {
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  const counts = new Map<string, number>();
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(css))) {
    const selector = match[1].trim();
    if (selector.length > 200 || NOISE_SELECTOR.test(selector)) continue;

    const shadowMatches = match[2].match(/box-shadow\s*:\s*([^;]+)/gi) ?? [];
    for (const d of shadowMatches) {
      const value = d.replace(/box-shadow\s*:/i, '').trim().replace(/\s+/g, ' ');
      if (!value || value.toLowerCase() === 'none' || value.startsWith('var(')) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([v]) => v);
}

/** Rounds to whole px then clusters within ±2px, so "4.26/6.4/8.53px" become
 *  a real spacing scale. Includes column-gap/row-gap so larger tokens (16-64px)
 *  aren't systematically missed. */
function extractSpacing(css: string): string[] {
  const declarations =
    css.match(/(?:margin|padding|gap|column-gap|row-gap|grid-gap)(?:-(?:top|right|bottom|left))?\s*:\s*([^;}]+)/gi) ?? [];

  const values: number[] = [];
  for (const d of declarations) {
    const nums = d.match(/([\d.]+)(px|rem)/g) ?? [];
    for (const n of nums) {
      const parsed = parseFloat(n);
      const px = n.endsWith('rem') ? parsed * 16 : parsed;
      if (px > 0 && px <= 200) values.push(px);
    }
  }

  return clusterNumbers(values, 2, 10).map((px) => `${px}px`);
}

function isAssetLikeValue(value: string): boolean {
  return /url\(|\.(png|jpe?g|svg|gif|webp|avif|woff2?|ttf)\b/i.test(value);
}

/** Classifies CSS custom properties by name so the UI can group them instead
 *  of dumping hundreds of unrelated variables in one flat list. */
function extractCssVariables(css: string): CategorizedCssVariables {
  const CATEGORY_PATTERNS: [RegExp, keyof CategorizedCssVariables][] = [
    [/color|brand|accent|primary|secondary|surface|\bbg\b|background|text|border|success|warn|danger|error/i, 'colors'],
    [/font|leading|line-height|tracking|letter-spacing/i, 'typography'],
    [/space|spacing|gap|margin|padding/i, 'spacing'],
    [/radius|rounded/i, 'radius'],
    [/shadow|elevation/i, 'shadows'],
  ];

  const declarations = [...css.matchAll(/--([\w-]+)\s*:\s*([^;}]+)[;}]/g)];
  const categorized: CategorizedCssVariables = { colors: {}, typography: {}, spacing: {}, radius: {}, shadows: {}, other: {} };
  const seen = new Set<string>();

  for (const [, name, rawValue] of declarations) {
    if (seen.has(name)) continue;
    seen.add(name);
    const value = rawValue.trim();
    if (isAssetLikeValue(value)) continue;
    // Defensive backstop: a legitimate custom-property value is never this
    // long or contains an unmatched `{` — if it does, something upstream
    // still overran a rule boundary, so drop it rather than display garbage.
    if (value.length > 200 || value.includes('{')) continue;

    const category = CATEGORY_PATTERNS.find(([pattern]) => pattern.test(name))?.[1] ?? 'other';
    categorized[category][`--${name}`] = value;
  }

  for (const key of Object.keys(categorized) as (keyof CategorizedCssVariables)[]) {
    const limit = key === 'other' ? 10 : 25;
    categorized[key] = Object.fromEntries(Object.entries(categorized[key]).slice(0, limit));
  }

  return categorized;
}

/** Scan for rules whose selector looks button-like (and isn't noise) and grab
 *  common visual properties. Clustering into distinct variants happens later,
 *  in token-extractor — this just collects every candidate sample. */
function extractButtons(css: string): ButtonSample[] {
  const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
  const samples: ButtonSample[] = [];
  let match: RegExpExecArray | null;

  while ((match = ruleRegex.exec(css))) {
    const selector = match[1].trim();
    if (!/(^|[\s,.>:])(button|\.btn\b|\[type=["']?button["']?\])/i.test(selector)) continue;
    if (selector.length > 120 || NOISE_SELECTOR.test(selector)) continue;

    const body = match[2];
    const bg = body.match(/background(?:-color)?\s*:\s*([^;]+)/i);
    const radius = body.match(/border-radius\s*:\s*([^;]+)/i);
    const padding = body.match(/padding\s*:\s*([^;]+)/i);
    const shadow = body.match(/box-shadow\s*:\s*([^;]+)/i);
    const fontSize = body.match(/font-size\s*:\s*([^;]+)/i);

    if (!bg && !radius && !padding && !shadow && !fontSize) continue;

    samples.push({
      selector,
      backgroundColor: bg ? bg[1].trim() : null,
      borderRadius: radius ? radius[1].trim() : null,
      padding: padding ? padding[1].trim() : null,
      boxShadow: shadow ? shadow[1].trim() : null,
      fontSize: fontSize ? fontSize[1].trim() : null,
    });

    if (samples.length >= 20) break; // bound worst-case CPU on pathological CSS
  }

  return samples;
}

/** Look specifically at `body { ... }` for background/text color, since that's
 *  the most reliable proxy for a site's base background/foreground colors */
function extractBodyColors(css: string): { background: string | null; text: string | null } {
  const bodyRuleMatch = css.match(/(?:^|\})\s*body\s*\{([^{}]*)\}/i);
  if (!bodyRuleMatch) return { background: null, text: null };

  const body = bodyRuleMatch[1];
  const bg = body.match(/background(?:-color)?\s*:\s*([^;]+)/i);
  const text = body.match(/(?<!background-)color\s*:\s*([^;]+)/i);

  return {
    background: bg ? bg[1].trim() : null,
    text: text ? text[1].trim() : null,
  };
}

export function extractRawTokens(css: string): RawExtraction {
  const bodyColors = extractBodyColors(css);
  const { colors, weights } = extractColors(css);
  return {
    colors,
    colorWeights: weights,
    variableColorCandidates: extractVariableColorCandidates(css),
    metaColorSignals: { themeColor: null, manifestThemeColor: null, manifestBackgroundColor: null },
    fontFamilies: extractFontFamilies(css),
    typographySizes: extractTypographySizes(css),
    radii: extractRadii(css),
    shadows: extractShadows(css),
    spacing: extractSpacing(css),
    cssVariables: extractCssVariables(css),
    buttons: extractButtons(css),
    bodyBackground: bodyColors.background,
    bodyTextColor: bodyColors.text,
  };
}
