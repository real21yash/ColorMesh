'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Loader2, Link2, Palette, Sparkles, Download, HelpCircle, Newspaper, ExternalLink, FileDown } from 'lucide-react';
import { OnboardingTour, type OnboardingStep } from './onboarding-tour';
import { AppHeader, ICON_BTN } from './app-header';

const STYLE_TOUR_STORAGE_KEY = 'colormesh-style-extractor-onboarding-dismissed';

const STYLE_EXTRACTOR_TOUR_STEPS: OnboardingStep[] = [
  {
    icon: Link2,
    title: 'Paste a URL',
    description:
      'Enter any public website URL and hit Extract. We fetch that page\u2019s linked and inline CSS directly \u2014 no screenshots, no rendering.',
  },
  {
    icon: Palette,
    title: 'See its design tokens',
    description:
      'Colors (brand/accent/surface/background/text/border roles, plus the full dominant palette), fonts, font sizes, radius, shadows, spacing, and any CSS variables the site defines.',
  },
  {
    icon: Sparkles,
    title: 'Confidence scores',
    description:
      'Each category shows a rough confidence percentage based on how much was actually found on the page \u2014 low doesn\u2019t mean wrong, just less data to go on.',
  },
  {
    icon: Download,
    title: 'Export what you need',
    description:
      'Copy the full result as JSON, or copy a ready-to-paste Tailwind config generated from the extracted tokens.',
  },
];

interface TypographySample {
  fontSize: string;
  lineHeight: string | null;
}

interface ButtonSample {
  selector: string;
  backgroundColor: string | null;
  borderRadius: string | null;
  padding: string | null;
  boxShadow: string | null;
  fontSize: string | null;
}

interface CategorizedCssVariables {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  radius: Record<string, string>;
  shadows: Record<string, string>;
  other: Record<string, string>;
}

interface StyleExtractionResult {
  site: string;
  colors: {
    brand: string | null;
    accent: string | null;
    surface: string | null;
    background: string | null;
    text: string | null;
    border: string | null;
    palette: string[];
    usingDominantPaletteOnly: boolean;
    source: {
      brand: 'declared' | 'css' | null;
      surface: 'declared' | 'css' | null;
    };
  };
  typography: { fonts: string[]; sizes: TypographySample[] };
  spacing: string[];
  radius: string[];
  shadows: string[];
  cssVariables: CategorizedCssVariables;
  buttons: {
    detected: number;
    variants: ButtonSample[];
  };
  tailwind: {
    colors: Record<string, string>;
    fontFamily: Record<string, string[]>;
    borderRadius: Record<string, string>;
    boxShadow: Record<string, string>;
    spacing: Record<string, string>;
  };
  confidence: { colors: number; typography: number; spacing: number; radius: number; shadows: number };
  pressKit: { url: string; label: string; source: 'linked' | 'guessed' } | null;
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="gap-1.5"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : label}
    </Button>
  );
}

function Section({
  title,
  confidence,
  children,
}: {
  title: string;
  confidence?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {confidence !== undefined && (
          <span className="text-xs text-muted-foreground">{confidence}% confidence</span>
        )}
      </div>
      {children}
    </div>
  );
}

function ColorSwatch({
  label,
  color,
  declared,
}: {
  label: string;
  color: string | null;
  declared?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!color) return null;

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(color);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      title={declared ? 'Declared by the site itself (theme-color/manifest) — click to copy' : 'Click to copy'}
      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-accent/60 transition-colors text-left"
    >
      <span className="w-6 h-6 rounded border border-border flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="flex flex-col min-w-0">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          {label}
          {declared && (
            <span className="normal-case tracking-normal text-accent" title="Declared by the site itself">
              ✓
            </span>
          )}
        </span>
        <span className="text-sm font-mono text-foreground truncate">
          {copied ? 'Copied!' : color}
        </span>
      </span>
    </button>
  );
}

export function StyleExtractor() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StyleExtractionResult | null>(null);
  const [copiedSwatch, setCopiedSwatch] = useState<string | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STYLE_TOUR_STORAGE_KEY);
      if (!dismissed) setTourOpen(true);
    } catch {
      // localStorage unavailable — skip auto-show silently
    }
  }, []);

  const handleDismissTour = () => {
    setTourOpen(false);
    try {
      window.localStorage.setItem(STYLE_TOUR_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleExtract = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/style-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Extraction failed');
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    if (!data) return;
    setExportingPdf(true);
    try {
      const { buildStyleReportPdf } = await import('@/lib/style-report-pdf');
      const pdf = buildStyleReportPdf(data);

      const hostname = (() => {
        try {
          return new URL(data.site ?? url).hostname.replace(/^www\./, '');
        } catch {
          return 'style-extraction';
        }
      })();

      pdf.save(`${hostname || 'style-extraction'}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? `PDF export failed: ${err.message}` : 'PDF export failed');
    } finally {
      setExportingPdf(false);
    }
  };

  const cssVarCategories = useMemo(
    () =>
      data
        ? {
            colors: Object.entries(data.cssVariables.colors),
            typography: Object.entries(data.cssVariables.typography),
            spacing: Object.entries(data.cssVariables.spacing),
            radius: Object.entries(data.cssVariables.radius),
            shadows: Object.entries(data.cssVariables.shadows),
            other: Object.entries(data.cssVariables.other),
          }
        : { colors: [], typography: [], spacing: [], radius: [], shadows: [], other: [] },
    [data]
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        title="Style Extractor"
        actions={
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTourOpen(true)}
            title="How to use the Style Extractor"
            className={ICON_BTN}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        }
      />

      {/* Style Extractor walkthrough — only shown on this page */}
      <OnboardingTour
        open={tourOpen}
        onDismiss={handleDismissTour}
        steps={STYLE_EXTRACTOR_TOUR_STEPS}
        ariaLabel="Getting started with the Style Extractor"
      />

      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto p-6 md:p-8 space-y-8">
        <div className="space-y-3 max-w-xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            Paste a URL to pull colors, fonts, radius, shadows, spacing, buttons, and CSS
            variables straight from that site&apos;s stylesheets.
          </p>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
              placeholder="apple.com"
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleExtract} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Extract'}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive text-left">{error}</p>}
        </div>

        {data && (
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left panel: core design tokens */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-8 lg:flex-[1.4] min-w-0">
              <Section title="Colors" confidence={data.confidence.colors}>
                {data.colors.usingDominantPaletteOnly && (
                  <p className="text-xs text-muted-foreground mb-3 -mt-1">
                    Confidence is too low to trust specific roles here — treat the palette below as
                    the reliable signal rather than the labeled swatches.
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <ColorSwatch label="Brand" color={data.colors.brand} declared={data.colors.source.brand === 'declared'} />
                  <ColorSwatch label="Accent" color={data.colors.accent} />
                  <ColorSwatch label="Surface" color={data.colors.surface} declared={data.colors.source.surface === 'declared'} />
                  <ColorSwatch label="Background" color={data.colors.background} />
                  <ColorSwatch label="Text" color={data.colors.text} />
                  <ColorSwatch label="Border" color={data.colors.border} />
                </div>
                {data.colors.palette.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground mb-1.5">Dominant palette</p>
                    <div className="flex flex-wrap gap-2">
                      {data.colors.palette.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            navigator.clipboard.writeText(c);
                            setCopiedSwatch(c);
                            setTimeout(() => setCopiedSwatch((cur) => (cur === c ? null : cur)), 1200);
                          }}
                          title={c}
                          className="relative w-7 h-7 rounded border border-border hover:scale-110 transition-transform flex items-center justify-center"
                          style={{ backgroundColor: c }}
                        >
                          {copiedSwatch === c && (
                            <Check
                              className="w-3.5 h-3.5 drop-shadow-[0_0_2px_rgba(0,0,0,0.8)]"
                              style={{ color: '#fff' }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </Section>

              {(data.typography.fonts.length > 0 || data.typography.sizes.length > 0) && (
                <Section title="Typography" confidence={data.confidence.typography}>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {data.typography.fonts.map((f) => (
                      <span key={f} className="px-3 py-1.5 rounded-md border border-border text-sm text-foreground">
                        {f}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {data.typography.sizes.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md bg-muted text-sm font-mono text-muted-foreground">
                        {s.fontSize}
                        {s.lineHeight ? ` / ${s.lineHeight}` : ''}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {data.radius.length > 0 && (
                <Section title="Radius" confidence={data.confidence.radius}>
                  <div className="flex flex-wrap gap-2">
                    {data.radius.map((r) => (
                      <span
                        key={r}
                        className="px-3 py-1.5 border border-border text-sm font-mono text-foreground"
                        style={{ borderRadius: r.split(' ')[0] }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </Section>
              )}

              {data.shadows.length > 0 && (
                <Section title="Shadows" confidence={data.confidence.shadows}>
                  <div className="flex flex-wrap gap-4">
                    {data.shadows.map((s, i) => (
                      <div key={i} className="w-16 h-16 rounded-lg bg-card border border-border" style={{ boxShadow: s }} title={s} />
                    ))}
                  </div>
                </Section>
              )}

              {data.spacing.length > 0 && (
                <Section title="Spacing Scale" confidence={data.confidence.spacing}>
                  <div className="flex flex-wrap items-end gap-2">
                    {data.spacing.map((s) => (
                      <div key={s} className="flex flex-col items-center gap-1">
                        <div className="bg-accent/40 rounded" style={{ width: s, height: '12px' }} />
                        <span className="text-sm font-mono text-muted-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {data.buttons.variants.length > 0 && (
                <Section title="Buttons">
                  <div className="flex flex-wrap items-center gap-4 mb-2">
                    {data.buttons.variants.map((variant, i) => (
                      <button
                        key={i}
                        className="px-4 py-2 border text-sm text-foreground"
                        style={{
                          backgroundColor: variant.backgroundColor ?? undefined,
                          borderRadius: variant.borderRadius ?? undefined,
                          padding: variant.padding ?? undefined,
                          boxShadow: variant.boxShadow ?? undefined,
                          fontSize: variant.fontSize ?? undefined,
                        }}
                      >
                        Variant {i + 1}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Detected {data.buttons.detected} button-like rule{data.buttons.detected === 1 ? '' : 's'},
                    showing {data.buttons.variants.length} distinct style{data.buttons.variants.length === 1 ? '' : 's'}
                  </span>
                </Section>
              )}
            </div>

            {/* Middle panel: raw CSS variables */}
            {(cssVarCategories.colors.length > 0 ||
              cssVarCategories.typography.length > 0 ||
              cssVarCategories.spacing.length > 0 ||
              cssVarCategories.radius.length > 0 ||
              cssVarCategories.shadows.length > 0 ||
              cssVarCategories.other.length > 0) && (
              <div className="rounded-xl border border-border bg-card p-5 lg:flex-1 min-w-0">
                <Section title="CSS Variables">
                  <div className="space-y-3">
                    {(['colors', 'typography', 'spacing', 'radius', 'shadows', 'other'] as const).map((category) =>
                      cssVarCategories[category].length > 0 ? (
                        <div key={category}>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{category}</p>
                          <div className="rounded-lg border border-border bg-muted/40 p-3 max-h-64 overflow-y-auto">
                            {cssVarCategories[category].map(([name, value]) => (
                              <div key={name} className="text-lg leading-snug font-mono text-foreground py-0.5">
                                <span className="text-accent">{name}</span>: {value};
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </Section>
              </div>
            )}

            {/* Right panel: press kit + export actions */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-8 lg:w-80 lg:flex-none min-w-0">
              {data.pressKit && (
                <Section title="Press Kit">
                  <a
                    href={data.pressKit.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-accent/60 hover:bg-accent/5 transition-colors"
                  >
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/15 text-accent flex-shrink-0">
                      <Newspaper className="w-4 h-4" />
                    </span>
                    <span className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground truncate">{data.pressKit.label}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {data.pressKit.source === 'linked'
                          ? 'Found on the page'
                          : 'Common press-kit path — may or may not be the right page'}
                      </span>
                    </span>
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </a>
                </Section>
              )}

              <Section title="Export">
                <div className="flex flex-col gap-2">
                  <CopyButton text={JSON.stringify(data, null, 2)} label="Copy JSON" />
                  <CopyButton
                    text={`module.exports = {\n  theme: {\n    extend: ${JSON.stringify(data.tailwind, null, 2)}\n  }\n};\n`}
                    label="Copy Tailwind Config"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportPdf}
                    disabled={exportingPdf}
                    className="gap-1.5 justify-center"
                  >
                    {exportingPdf ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    {exportingPdf ? 'Exporting…' : 'Export PDF'}
                  </Button>
                </div>
              </Section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
