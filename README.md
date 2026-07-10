# ColorMesh

Extract, sample, and build color palettes from any image, right in the browser.

ColorMesh is a fully client-side app — images never leave your machine, and
running it locally requires no accounts, API keys, or backend services.

## Features

- Drag-and-drop, click-to-browse, or eyedropper — three ways to grab a color
- Adjustable sampling grid (2x2 to 12x12), each cell showing its dominant color
- Native `EyeDropper` API support for exact, pixel-level color picks (falls back
  to click-to-sample on browsers without it, e.g. Firefox/Safari)
- Click any grid cell to inspect its HEX/RGB and add it to your palette
- Build a 6-color palette, lock favorites, and randomize the rest
- Export sampled colors as JSON/CSV, or export your palette as text/PNG
- Light/dark theme, and a skippable first-time walkthrough

## Prerequisites

- [Node.js](https://nodejs.org/) 18.18 or newer
- npm (bundled with Node) or [pnpm](https://pnpm.io/) — both lockfiles are provided

## Getting Started

```bash
git clone <this-repo-url>
cd colormesh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

ColorMesh needs **no secrets or API keys** to run — it's entirely client-side.
Copy `.env.example` to `.env.local` if you want to customize the optional SEO
metadata:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | No | Public URL used for canonical/Open Graph metadata. Defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | No | Google Search Console verification code, only needed if you deploy and verify a domain. |

## Building for Production

This project is configured for static export (`output: 'export'` in
`next.config.js`), so the build produces a folder of static files you can
host anywhere (Nginx, Caddy, Vercel, Netlify, GitHub Pages, S3, etc.):

```bash
npm run build
```

The static site is generated in the `out/` directory. Serve it with any static
file server, for example:

```bash
npx serve out
```

Before deploying to a real domain, update:
- `NEXT_PUBLIC_SITE_URL` in your environment
- The placeholder domain in `public/robots.txt` and `public/sitemap.xml`
  (these are static files and aren't templated at build time)

## Project Structure

- `app/` — Next.js App Router entry point and global layout/metadata
- `components/` — application UI (canvas, toolbar, sidebar, onboarding) and
  `components/ui/` (shadcn/ui primitives)
- `lib/` — color sampling/export utilities (k-means dominant-color extraction,
  HEX/RGB conversion, JSON/CSV/PNG export)

## Known Gaps

- `app/layout.tsx` references `/og-image.png` for social share previews, but
  no such file exists in `public/`. Add a 1200×630 PNG there (or edit the
  `openGraph`/`twitter` metadata in `app/layout.tsx`) before relying on link
  previews.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
