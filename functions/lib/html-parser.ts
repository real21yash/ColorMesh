/**
 * Lightweight HTML scanning via regex — no DOM, no dependencies. This is
 * intentionally not a full HTML parser: we only need <link rel="stylesheet">
 * hrefs and <style> block contents, both of which are reliably regex-matchable
 * without needing to build a full DOM tree.
 */

/** Absolute or relative stylesheet hrefs referenced via <link rel="stylesheet">, resolved against baseUrl */
export function parseStylesheetLinks(html: string, baseUrl: string): string[] {
  const hrefs: string[] = [];
  const linkRegex = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html))) {
    const hrefMatch = match[0].match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    try {
      hrefs.push(new URL(hrefMatch[1], baseUrl).toString());
    } catch {
      // skip unresolvable hrefs (e.g. data: URIs used as href, malformed markup)
    }
  }

  return hrefs;
}

/** Raw CSS text found inside <style>...</style> blocks */
export function parseInlineStyles(html: string): string[] {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
}
