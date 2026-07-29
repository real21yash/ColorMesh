/**
 * POST /api/style-extract
 *
 * Cloudflare Pages Function (deployed as a Worker automatically alongside
 * the static Next.js build — no separate deploy step). Body: { url: string }
 *
 * Pipeline: validate URL -> fetch HTML -> find stylesheets -> fetch CSS ->
 * extract raw values -> layer in declared theme-color/manifest signals ->
 * discover a press kit link -> build design tokens -> attach tailwind +
 * confidence + pressKit. Each step lives in its own module under ./../lib
 * so new extractors (gradients, animations, icons, ...) can be added
 * without touching this file.
 */
import { normalizeAndValidateUrl } from '../lib/url-validator';
import { fetchHtml, fetchStylesheets, fetchJson } from '../lib/css-fetcher';
import { parseStylesheetLinks, parseInlineStyles } from '../lib/html-parser';
import { parseThemeColorMeta, parseManifestUrl, extractManifestColors } from '../lib/meta-extractor';
import { findPressKitLink, guessPressKitLink } from '../lib/press-kit-finder';
import { extractRawTokens } from '../lib/css-parser';
import { buildDesignTokens } from '../lib/token-extractor';
import { formatResponse, jsonResponse, CORS_HEADERS } from '../lib/response-formatter';

interface RequestBody {
  url?: string;
}

export const onRequestPost: PagesFunction = async (context) => {
  let body: RequestBody;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body — expected JSON with a "url" field' }, 400);
  }

  const targetUrl = normalizeAndValidateUrl(body.url);
  if (!targetUrl) {
    return jsonResponse({ error: 'Please provide a valid public URL' }, 400);
  }

  try {
    const html = await fetchHtml(targetUrl);
    const stylesheetUrls = parseStylesheetLinks(html, targetUrl);
    const inlineCss = parseInlineStyles(html);
    const manifestUrl = parseManifestUrl(html, targetUrl);

    const [externalCss, manifestJson] = await Promise.all([
      fetchStylesheets(stylesheetUrls),
      manifestUrl ? fetchJson(manifestUrl) : Promise.resolve(null),
    ]);
    const css = [...inlineCss, ...externalCss].join('\n');

    if (!css.trim()) {
      return jsonResponse({ error: 'No stylesheets or inline styles found on that page' }, 422);
    }

    const raw = extractRawTokens(css);

    // Layer in authoritative, site-declared color signals — these outrank
    // anything inferred from CSS.
    const manifestColors = manifestJson
      ? extractManifestColors(manifestJson)
      : { themeColor: null, backgroundColor: null };
    raw.metaColorSignals = {
      themeColor: parseThemeColorMeta(html),
      manifestThemeColor: manifestColors.themeColor,
      manifestBackgroundColor: manifestColors.backgroundColor,
    };

    // Press kit discovery — a real link on the page first, then a handful of
    // conventional-path guesses if nothing turned up.
    const pressKit = findPressKitLink(html, targetUrl) ?? (await guessPressKitLink(targetUrl));

    const tokens = buildDesignTokens(targetUrl, raw);
    const result = formatResponse(tokens, raw, pressKit);

    return jsonResponse(result, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch that URL';
    return jsonResponse({ error: message }, 502);
  }
};

/** CORS preflight support */
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
