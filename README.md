# ColorMesh

A small toolbox of color and design utilities.

- **Color Extractor** — sample dominant colors from any image (fully client-side)
- **Style Extractor** — pull colors, fonts, radius, shadows, spacing, buttons,
  and CSS variables from a live website's stylesheets

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, static export) + React 19 + TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) with a small set of hand-picked
  [shadcn/ui](https://ui.shadcn.com) primitives (button, dialog, dropdown-menu,
  drawer, input, slider)
- [Radix UI](https://www.radix-ui.com) primitives + [vaul](https://vaul.emilkowal.ski) (drawer) + [jsPDF](https://github.com/parallax/jsPDF) (report export)
- Cloudflare Pages + Pages Functions (Workers runtime) for the Style Extractor's backend
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) for local Worker testing and deployment

## Architecture

```
Browser
  ↓
Static Next.js frontend (Cloudflare Pages)
  ↓ POST /api/style-extract
Cloudflare Pages Function (Worker)
  ↓ fetch target URL → parse HTML → find <link rel=stylesheet> → fetch CSS → parse CSS
Structured JSON response
```

- The frontend (`app/`, `components/`) is a fully static export (`output: 'export'`
  in `next.config.js`) — no Next.js server, no API routes in `app/`.
- The backend lives entirely in `functions/` as a **Cloudflare Pages Function**,
  which Cloudflare deploys as a Worker automatically alongside the static build.
  No Node.js server, no Puppeteer/Playwright/Chromium — just `fetch` + regex-based
  HTML/CSS parsing, all Workers-runtime-compatible.
- `functions/lib/` is a modular pipeline — each stage is a separate file so new
  extractors (gradients, animations, icons, logos, accessibility metrics, ...)
  can be added without touching the others:
  - `url-validator.ts` — normalizes input, blocks private/local network targets
  - `html-parser.ts` — finds `<link rel="stylesheet">` hrefs and `<style>` blocks
  - `css-fetcher.ts` — fetches the page + stylesheets (timeouts, size caps)
  - `css-parser.ts` — regex extraction of raw colors/fonts/radius/shadows/spacing/variables/buttons
  - `token-extractor.ts` — turns raw values into color roles (primary/secondary/background/text) + button summary
  - `tailwind-generator.ts` — generates a Tailwind `theme.extend`-shaped object
  - `confidence-scorer.ts` — heuristic 0–100 confidence per category
  - `response-formatter.ts` — assembles the final JSON + shared CORS/response helper

## Project Structure

```
app/                    Next.js App Router pages (/, /toolbox, /style-extractor)
components/             Color Extractor, Style Extractor, and shared UI
components/ui/          Hand-picked shadcn/ui primitives actually used by the app
lib/                     Client-side helpers: color math, canvas sampling, PDF report generation
hooks/                   (none currently — removed unused shadcn boilerplate hooks)
functions/api/           Cloudflare Pages Function: POST /api/style-extract
functions/lib/           Backend pipeline used only by the Worker (see Architecture above)
public/                  Static assets, fonts, icons
```

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the Color Extractor, or
[http://localhost:3000/toolbox](http://localhost:3000/toolbox) for both tools.

Note: `next dev` only runs the frontend. The Style Extractor's `/api/style-extract`
Worker route won't respond under plain `pnpm dev` — use `pnpm pages:dev` below
to test the full stack locally exactly as it runs in production.

## Building

```bash
pnpm build
```

Outputs a static export to `out/`.

## Testing the Full Stack Locally (frontend + Worker)

```bash
pnpm pages:dev
```

This builds the static export and runs it through `wrangler pages dev`, which
serves both the static assets and the `functions/` Worker route together,
matching production Cloudflare Pages behavior.

## Deploying to Cloudflare Pages

1. Push this repo to GitHub/GitLab and connect it in the Cloudflare Pages dashboard,
   or deploy directly with Wrangler: `npx wrangler pages deploy out`
2. Build command: `pnpm build`
3. Build output directory: `out`
4. Cloudflare auto-detects the `functions/` directory and deploys it as a Worker
   alongside the static site — no separate Worker deployment step needed.

## Environment Variables

Neither the frontend nor the Worker currently requires any secrets or API keys —
there's no `.env` file to set up to run this project locally or in production.

## Features

### Color Extractor
- Drag-and-drop, click-to-browse, or eyedropper — three ways to grab a color
- Adjustable sampling grid (2x2 to 12x12), each cell showing its dominant color
- Native `EyeDropper` API support, with a click-to-sample fallback
- Build a 6-color palette, lock favorites, and randomize the rest
- Export sampled colors as JSON/CSV, or export your palette as text/PNG

### Style Extractor
- Paste any public URL to fetch its linked + inline CSS
- Extracts primary/secondary/background/text colors, a full palette, font
  families, font-size/line-height pairs, border-radius, box-shadows, a spacing
  scale, `:root` CSS custom properties, and button styles
- Per-category confidence scores based on how much was actually found
- Copy results as JSON or a generated Tailwind config snippet
- Note: parses the site's actual stylesheets rather than rendering the page,
  so styles injected purely by client-side JS won't be picked up

## License

MIT — see [LICENSE](./LICENSE).

## Learn More

- [Next.js Static Exports](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
