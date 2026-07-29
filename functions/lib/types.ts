/**
 * Shared types for the Style Extractor Worker pipeline.
 * Every module below (html-parser, css-fetcher, css-parser, token-extractor,
 * tailwind-generator, confidence-scorer, response-formatter) reads/writes
 * these shapes so new extractors (gradients, animations, icons, ...) can be
 * added by extending RawExtraction + one new module, without touching the
 * others.
 */

export interface TypographySample {
  fontSize: string;
  lineHeight: string | null;
}

export interface ButtonSample {
  selector: string;
  backgroundColor: string | null;
  borderRadius: string | null;
  padding: string | null;
  boxShadow: string | null;
  fontSize: string | null;
}

/** A CSS custom property whose name suggests it holds a design-system color role */
export interface VariableColorCandidate {
  name: string; // without the leading --
  color: string;
}

export interface CategorizedCssVariables {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  other: Record<string, string>;
}

/** Authoritative, site-declared color signals — outrank every CSS-derived guess */
export interface MetaColorSignals {
  themeColor: string | null; // <meta name="theme-color">
  manifestThemeColor: string | null; // manifest.json theme_color
  manifestBackgroundColor: string | null; // manifest.json background_color
}

/** A discovered press/media kit link (not a design token — supplementary info) */
export interface PressKitResult {
  url: string;
  label: string;
  source: 'linked' | 'guessed';
}

/** Raw values pulled straight out of CSS text, no interpretation yet */
export interface RawExtraction {
  colors: string[]; // dominant/weighted palette, post-dedupe
  colorWeights: Record<string, number>; // same colors' raw weight, for confidence gating
  variableColorCandidates: VariableColorCandidate[];
  metaColorSignals: MetaColorSignals;
  fontFamilies: string[];
  typographySizes: TypographySample[];
  radii: string[];
  shadows: string[];
  spacing: string[];
  cssVariables: CategorizedCssVariables;
  buttons: ButtonSample[];
  bodyBackground: string | null;
  bodyTextColor: string | null;
}

/** Final response shape returned by POST /api/style-extract */
export interface StyleExtractionResult {
  site: string;
  colors: {
    brand: string | null;
    accent: string | null;
    surface: string | null;
    background: string | null;
    text: string | null;
    border: string | null;
    palette: string[];
    /** true when color confidence is too low to trust brand/accent/surface/border —
     *  the UI should lean on `palette` alone rather than presenting roles as fact */
    usingDominantPaletteOnly: boolean;
    /** 'declared' = from theme-color meta/manifest.json (the site's own claim).
     *  'css' = inferred from stylesheets (CSS variable or frequency ranking). */
    source: {
      brand: 'declared' | 'css' | null;
      surface: 'declared' | 'css' | null;
    };
  };
  typography: {
    fonts: string[];
    sizes: TypographySample[];
  };
  spacing: string[];
  radius: string[];
  shadows: string[];
  cssVariables: CategorizedCssVariables;
  buttons: {
    detected: number;
    variants: ButtonSample[]; // up to 3 distinct clusters, not one averaged sample
  };
  tailwind: {
    colors: Record<string, string>;
    fontFamily: Record<string, string[]>;
    borderRadius: Record<string, string>;
    boxShadow: Record<string, string>;
    spacing: Record<string, string>;
  };
  confidence: {
    colors: number;
    typography: number;
    spacing: number;
    radius: number;
    shadows: number;
  };
  pressKit: PressKitResult | null;
}

export interface ExtractionError {
  error: string;
}
