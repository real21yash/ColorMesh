import type { StyleExtractionResult, PressKitResult } from './types';
import { generateTailwindTokens } from './tailwind-generator';
import { scoreConfidence } from './confidence-scorer';
import type { RawExtraction } from './types';

type PartialTokens = Omit<StyleExtractionResult, 'tailwind' | 'confidence' | 'pressKit'>;

export function formatResponse(
  tokens: PartialTokens,
  raw: RawExtraction,
  pressKit: PressKitResult | null
): StyleExtractionResult {
  const confidence = scoreConfidence(raw);
  return {
    ...tokens,
    colors: { ...tokens.colors, usingDominantPaletteOnly: confidence.colors < 80 },
    tailwind: generateTailwindTokens(tokens),
    confidence,
    pressKit,
  };
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
