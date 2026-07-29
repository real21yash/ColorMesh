import { jsPDF } from 'jspdf';

/**
 * Builds a text-based PDF "spec sheet" for a style extraction result (not a
 * screenshot) — every value is drawn via jsPDF's text APIs so it stays
 * selectable/copy-pastable. Helvetica for plain values, Courier reserved for
 * the CSS Variables code block.
 */

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

export interface StyleExtractionResultForPdf {
  site: string;
  colors: {
    brand: string | null;
    accent: string | null;
    surface: string | null;
    background: string | null;
    text: string | null;
    border: string | null;
    palette: string[];
  };
  typography: { fonts: string[]; sizes: TypographySample[] };
  spacing: string[];
  radius: string[];
  shadows: string[];
  cssVariables: CategorizedCssVariables;
  buttons: { detected: number; variants: ButtonSample[] };
  confidence: { colors: number; typography: number; spacing: number; radius: number; shadows: number };
  pressKit: { url: string; label: string; source: 'linked' | 'guessed' } | null;
}

const PAGE_WIDTH = 595.28; // A4 @ pt
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = PAGE_HEIGHT - 28;
const ACCENT: [number, number, number] = [107, 100, 195];

/** Resolves any CSS color string (hex, rgb, hsl, oklch, lab, named, ...) to RGB by
 *  letting the browser's own CSS engine parse it, so jsPDF never has to. */
function cssColorToRgb(input: string | null | undefined): [number, number, number] | null {
  if (!input || typeof document === 'undefined') return null;
  const probe = document.createElement('div');
  probe.style.color = input;
  if (!probe.style.color) return null;
  probe.style.position = 'fixed';
  probe.style.visibility = 'hidden';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const match = computed.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1].split(',').map((n) => parseFloat(n.trim()));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  return [Math.round(parts[0]), Math.round(parts[1]), Math.round(parts[2])];
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function buildStyleReportPdf(data: StyleExtractionResultForPdf): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  let y = MARGIN;

  const ensure = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN - 16) {
      pdf.addPage();
      y = MARGIN;
    }
  };

  const sectionTitle = (title: string, confidence?: number) => {
    y += 10; // minimum spacing above each heading
    ensure(26);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(24, 24, 27);
    pdf.text(title, MARGIN, y);
    if (confidence !== undefined) {
      const w = pdf.getTextWidth(title);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`${confidence}% confidence`, MARGIN + w + 8, y);
    }
    y += 18;
  };

  /** Wrapped plain-text (Helvetica), for any non-code value. */
  const wrappedText = (text: string, size = 9, color: [number, number, number] = [40, 40, 40]) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, CONTENT_WIDTH) as string[];
    lines.forEach((line) => {
      ensure(size + 4);
      pdf.text(line, MARGIN, y);
      y += size + 4;
    });
  };

  const truncateToWidth = (text: string, maxWidth: number): string => {
    if (pdf.getTextWidth(text) <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 1 && pdf.getTextWidth(`${truncated}\u2026`) > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return `${truncated}\u2026`;
  };

  const swatch = (x: number, sy: number, size: number, color: string | null) => {
    const rgb = cssColorToRgb(color) ?? [225, 225, 225];
    pdf.setFillColor(...rgb);
    pdf.roundedRect(x, sy - size + 3, size, size, 3, 3, 'F');
    pdf.setDrawColor(210, 210, 210);
    pdf.roundedRect(x, sy - size + 3, size, size, 3, 3, 'S');
  };

  /** Renders CSS custom-property name/value pairs in a shaded code block.
   *  Split into multiple boxes so none straddles a page break. */
  const CODE_LINE_H = 14;
  const CODE_PADDING = 10;
  const CODE_FONT_SIZE = 9;
  const MAX_LINES_PER_BLOCK = 24;

  const drawCodeBlock = (entries: [string, string][]) => {
    type RenderLine = { name: string; value: string } | { text: string };

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(CODE_FONT_SIZE);
    const boxContentWidth = CONTENT_WIDTH - CODE_PADDING * 2;

    const renderLines: RenderLine[] = [];
    entries.forEach(([name, value]) => {
      const full = `${name}: ${value};`;
      if (pdf.getTextWidth(full) <= boxContentWidth) {
        renderLines.push({ name, value });
      } else {
        const wrapped = pdf.splitTextToSize(full, boxContentWidth) as string[];
        wrapped.forEach((w) => renderLines.push({ text: w }));
      }
    });

    chunk(renderLines, MAX_LINES_PER_BLOCK).forEach((group) => {
      const boxHeight = group.length * CODE_LINE_H + CODE_PADDING * 2;
      ensure(boxHeight + 10);
      const boxTop = y;

      pdf.setFillColor(245, 245, 247);
      pdf.setDrawColor(226, 226, 230);
      pdf.roundedRect(MARGIN, boxTop, CONTENT_WIDTH, boxHeight, 6, 6, 'FD');

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(CODE_FONT_SIZE);
      let ly = boxTop + CODE_PADDING + CODE_FONT_SIZE * 0.75;
      group.forEach((line) => {
        if ('name' in line) {
          const namePart = `${line.name}: `;
          pdf.setTextColor(...ACCENT);
          pdf.text(namePart, MARGIN + CODE_PADDING, ly);
          const nameWidth = pdf.getTextWidth(namePart);
          pdf.setTextColor(50, 50, 50);
          pdf.text(`${line.value};`, MARGIN + CODE_PADDING + nameWidth, ly);
        } else {
          pdf.setTextColor(50, 50, 50);
          pdf.text(line.text, MARGIN + CODE_PADDING, ly);
        }
        ly += CODE_LINE_H;
      });

      y = boxTop + boxHeight + 10;
    });
  };

  // ---------- Header ----------
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(21);
  pdf.setTextColor(24, 24, 27);
  pdf.text('Style Extraction Report', MARGIN, y);
  y += 24;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...ACCENT);
  pdf.textWithLink(data.site, MARGIN, y, { url: data.site });
  y += 14;

  pdf.setFontSize(8.5);
  pdf.setTextColor(150, 150, 150);
  const generated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  pdf.text(`Generated ${generated} \u00b7 colormesh.net`, MARGIN, y);
  y += 16;

  pdf.setDrawColor(225, 225, 225);
  pdf.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 26;

  // ---------- Colors ----------
  const roles: [string, string | null][] = [
    ['Brand', data.colors.brand],
    ['Accent', data.colors.accent],
    ['Surface', data.colors.surface],
    ['Background', data.colors.background],
    ['Text', data.colors.text],
    ['Border', data.colors.border],
  ].filter(([, c]) => c) as [string, string | null][];

  if (roles.length > 0 || data.colors.palette.length > 0) {
    sectionTitle('Colors', data.confidence.colors);

    const colW = CONTENT_WIDTH / 3;
    chunk(roles, 3).forEach((row) => {
      ensure(38);
      const rowY = y + 14;
      row.forEach(([label, color], i) => {
        const x = MARGIN + i * colW;
        swatch(x, rowY, 16, color);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(label.toUpperCase(), x + 22, rowY - 6);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(30, 30, 30);
        const val = (color ?? '').length > 26 ? `${color!.slice(0, 26)}\u2026` : color ?? '';
        pdf.text(val, x + 22, rowY + 5);
      });
      y += 38;
    });

    if (data.colors.palette.length > 0) {
      y += 8;
      ensure(14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(140, 140, 140);
      pdf.text('Dominant palette', MARGIN, y);
      y += 16;

      const perRow = 6;
      const cw = CONTENT_WIDTH / perRow;
      chunk(data.colors.palette, perRow).forEach((row) => {
        ensure(44);
        const rowY = y + 14;
        row.forEach((c, i) => {
          const x = MARGIN + i * cw;
          swatch(x, rowY, 14, c);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(7.5);
          pdf.setTextColor(110, 110, 110);
          pdf.text(truncateToWidth(c, cw - 4), x, rowY + 20);
        });
        y += 44;
      });
    }
    y += 10;
  }

  // ---------- Typography ----------
  if (data.typography.fonts.length > 0 || data.typography.sizes.length > 0) {
    sectionTitle('Typography', data.confidence.typography);
    if (data.typography.fonts.length > 0) {
      wrappedText(data.typography.fonts.join(',  '), 9.5, [30, 30, 30]);
      y += 4;
    }
    if (data.typography.sizes.length > 0) {
      const sizesText = data.typography.sizes
        .map((s) => s.fontSize + (s.lineHeight ? ` / ${s.lineHeight}` : ''))
        .join('   \u00b7   ');
      wrappedText(sizesText, 8.5, [90, 90, 90]);
    }
    y += 10;
  }

  // ---------- Radius ----------
  if (data.radius.length > 0) {
    sectionTitle('Radius', data.confidence.radius);
    wrappedText(data.radius.join('   \u00b7   '), 9.5, [30, 30, 30]);
    y += 10;
  }

  // ---------- Shadows ----------
  if (data.shadows.length > 0) {
    sectionTitle('Shadows', data.confidence.shadows);
    data.shadows.forEach((s) => wrappedText(s, 8.5, [80, 80, 80]));
    y += 10;
  }

  // ---------- Spacing ----------
  if (data.spacing.length > 0) {
    sectionTitle('Spacing Scale', data.confidence.spacing);
    wrappedText(data.spacing.join('   \u00b7   '), 9.5, [30, 30, 30]);
    y += 10;
  }

  // ---------- Buttons ----------
  if (data.buttons.variants.length > 0) {
    sectionTitle('Buttons');
    data.buttons.variants.forEach((v, i) => {
      const props = [
        v.backgroundColor && `background: ${v.backgroundColor};`,
        v.borderRadius && `radius: ${v.borderRadius};`,
        v.padding && `padding: ${v.padding};`,
        v.boxShadow && `shadow: ${v.boxShadow};`,
        v.fontSize && `font-size: ${v.fontSize};`,
      ]
        .filter(Boolean)
        .join('  ');

      ensure(14);
      swatch(MARGIN, y + 11, 12, v.backgroundColor);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Variant ${i + 1}`, MARGIN + 18, y + 2);
      y += 24;
      wrappedText(props, 8, [80, 80, 80]);
      y += 6;
    });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(150, 150, 150);
    ensure(12);
    pdf.text(
      `Detected ${data.buttons.detected} button-like rule${data.buttons.detected === 1 ? '' : 's'}, showing ${data.buttons.variants.length} distinct style${data.buttons.variants.length === 1 ? '' : 's'}`,
      MARGIN,
      y
    );
    y += 20;
  }

  // ---------- CSS Variables (the important copy-pastable code) ----------
  const cssVarEntries = Object.entries(data.cssVariables) as [keyof CategorizedCssVariables, Record<string, string>][];
  const hasCssVars = cssVarEntries.some(([, vars]) => Object.keys(vars).length > 0);

  if (hasCssVars) {
    sectionTitle('CSS Variables');
    cssVarEntries.forEach(([category, vars]) => {
      const entries = Object.entries(vars);
      if (entries.length === 0) return;

      ensure(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(140, 140, 140);
      pdf.text(category.toUpperCase(), MARGIN, y);
      y += 13;

      drawCodeBlock(entries);
      y += 12;
    });
  }

  // ---------- Press Kit (link only, not embedded) ----------
  if (data.pressKit) {
    sectionTitle('Press Kit');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...ACCENT);
    ensure(14);
    pdf.textWithLink(data.pressKit.label, MARGIN, y, { url: data.pressKit.url });
    y += 14;
    wrappedText(data.pressKit.url, 8.5, [140, 140, 140]);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(180, 180, 180);
    ensure(10);
    pdf.text(
      data.pressKit.source === 'linked' ? 'Found on the page' : 'Common press-kit path \u2014 may or may not be the right page',
      MARGIN,
      y
    );
    y += 16;
  }

  // ---------- Footer on every page ----------
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(180, 180, 180);
    pdf.text('Made with ColorMesh', MARGIN, FOOTER_Y);
    pdf.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN, FOOTER_Y, { align: 'right' });
  }

  return pdf;
}
