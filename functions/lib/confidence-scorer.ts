import type { RawExtraction, StyleExtractionResult } from './types';

/** Simple saturating heuristic: more distinct values found = higher confidence. */
function scaledConfidence(count: number, perItem: number, cap = 100): number {
  return Math.min(cap, Math.round(count * perItem));
}

export function scoreConfidence(raw: RawExtraction): StyleExtractionResult['confidence'] {
  // A color the site declares itself (theme-color meta / manifest.json) is the
  // strongest possible evidence — stronger than a named CSS variable, which in
  // turn is stronger than raw frequency alone.
  const hasDeclaredColor = !!(raw.metaColorSignals.themeColor || raw.metaColorSignals.manifestBackgroundColor);
  const colorBase = scaledConfidence(raw.colors.length, 10, 70);
  const variableBonus = raw.variableColorCandidates.length > 0 ? 25 : 0;
  const declaredBonus = hasDeclaredColor ? 40 : 0;

  return {
    colors: Math.min(100, colorBase + variableBonus + declaredBonus),
    typography: scaledConfidence(raw.fontFamilies.length * 3 + raw.typographySizes.length, 8),
    spacing: scaledConfidence(raw.spacing.length, 8),
    radius: scaledConfidence(raw.radii.length, 14),
    shadows: scaledConfidence(raw.shadows.length, 16),
  };
}
