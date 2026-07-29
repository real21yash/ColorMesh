const FETCH_TIMEOUT_MS = 8000;
const MAX_TEXT_BYTES = 3_000_000; // cap per response to bound memory/CPU
const MAX_STYLESHEETS = 8;

function timeoutSignal(ms: number): AbortSignal {
  // AbortSignal.timeout() is available in the Workers runtime, but building
  // it manually keeps this compatible with slightly older runtime versions too.
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

async function fetchText(url: string, maxBytes = MAX_TEXT_BYTES): Promise<string> {
  const res = await fetch(url, {
    signal: timeoutSignal(FETCH_TIMEOUT_MS),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ColorMeshStyleExtractor/1.0; +https://colormesh.net)',
    },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const text = await res.text();
  return text.length > maxBytes ? text.slice(0, maxBytes) : text;
}

export function fetchHtml(url: string): Promise<string> {
  return fetchText(url);
}

/** Fetch multiple stylesheets concurrently; silently drops any that fail */
export async function fetchStylesheets(urls: string[]): Promise<string[]> {
  const capped = urls.slice(0, MAX_STYLESHEETS);
  const results = await Promise.allSettled(capped.map((u) => fetchText(u)));
  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
    .map((r) => r.value);
}

/** Fetch and parse a small JSON document (e.g. manifest.json). Returns null on any failure. */
export async function fetchJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const text = await fetchText(url, 200_000); // manifests are small; no need for the 3MB cap
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Lightweight existence check for a guessed URL (press-kit path guessing) —
 *  doesn't read the body, just confirms a 2xx response within a short timeout. */
export async function probeUrl(url: string, timeoutMs = 4000): Promise<boolean> {
  try {
    const res = await fetch(url, {
      signal: timeoutSignal(timeoutMs),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ColorMeshStyleExtractor/1.0; +https://colormesh.net)',
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}
