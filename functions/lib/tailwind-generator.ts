import type { StyleExtractionResult } from './types';

type PartialTokens = Omit<StyleExtractionResult, 'tailwind' | 'confidence' | 'pressKit'>;

export function generateTailwindTokens(tokens: PartialTokens): StyleExtractionResult['tailwind'] {
  const colors: Record<string, string> = {};
  tokens.colors.palette.forEach((c, i) => (colors[`extracted-${i + 1}`] = c));

  const fontFamily: Record<string, string[]> = {};
  tokens.typography.fonts.forEach((f, i) => (fontFamily[`extracted-${i + 1}`] = [f, 'sans-serif']));

  const borderRadius: Record<string, string> = {};
  tokens.radius.forEach((r, i) => (borderRadius[`extracted-${i + 1}`] = r));

  const boxShadow: Record<string, string> = {};
  tokens.shadows.forEach((s, i) => (boxShadow[`extracted-${i + 1}`] = s));

  const spacing: Record<string, string> = {};
  tokens.spacing.forEach((s, i) => (spacing[`extracted-${i + 1}`] = s));

  return { colors, fontFamily, borderRadius, boxShadow, spacing };
}
