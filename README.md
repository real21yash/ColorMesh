# ColorMesh

A browser-based tool for extracting colors from images using a customizable grid overlay. Upload an image, overlay a grid, and sample the dominant color in each cell — useful for designers, developers, and anyone doing color work.

## Live Demo

https://colormesh.net/

---

## Features

- **Image upload** — supports PNG and JPEG
- **Grid overlay** — adjustable from 2×2 up to 12×12
- **Color sampling** — extracts the dominant color per cell using k-means clustering
- **Cell selection** — click a cell to inspect its hex and RGB values; click again to deselect
- **Right-click to copy** — right-click any cell to copy its hex code to clipboard
- **Palette builder** — add up to 6 colors to a custom palette, lock colors, shuffle unlocked slots
- **Export** — download all sampled colors as JSON or CSV; export palette as text or PNG
- **Dark mode** — persisted via localStorage, no flash on load

---

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/) — Radix UI primitives
- [Lucide React](https://lucide.dev/) — icons

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/your-username/colormesh.git
cd colormesh
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm run start
```

---

## Usage

1. Click **Upload Image** in the toolbar and select a PNG or JPEG.
2. Use the **Grid** slider to set how many rows/columns to divide the image into.
3. Click the **eye icon** to toggle the grid overlay on/off.
   - Grid on: see solid color blocks extracted from each cell.
   - Grid off: see the original image.
4. **Click a cell** to view its hex and RGB values in the sidebar. Click again to deselect.
5. **Right-click a cell** to copy its hex code directly to clipboard.
6. Click a color swatch in the sidebar list to **add it to your palette** (max 6 colors).
7. In the palette, use the **lock icon** to pin colors before randomizing, and **shuffle** to fill unlocked slots with random colors from the grid.
8. Use the export buttons to download all grid colors as **JSON** or **CSV**, or export your palette as **text** or **PNG**.

---

## Project Structure

```
colormesh/
├── app/
│   ├── globals.css         # Tailwind base styles and CSS variables
│   ├── layout.tsx          # Root layout with theme initialization script
│   └── page.tsx            # Entry point, renders <ColorExtractor />
├── components/
│   ├── color-extractor.tsx # Main orchestrator — state and handlers
│   ├── controls-toolbar.tsx# Top toolbar: upload, grid slider, toggles
│   ├── image-canvas.tsx    # Dual-canvas rendering (image + grid overlay)
│   ├── color-sidebar.tsx   # Color list, selected cell detail, palette builder
│   ├── theme-toggle.tsx    # Light/dark toggle
│   └── ui/                 # shadcn/ui components (auto-generated)
├── lib/
│   ├── color-utils.ts      # Color extraction, k-means, export helpers
│   └── utils.ts            # Tailwind class merge utility
├── public/
│   └── logo.svg
├── next.config.mjs
└── tsconfig.json
```

---

## How Color Extraction Works

Each grid cell is sampled from the underlying `<canvas>` pixel data. Every 5th pixel is collected from that region, then **k-means clustering** (k=3, 10 iterations) is run to find the dominant color cluster. The centroid of the largest cluster becomes the cell's representative color.

This produces more perceptually meaningful results than a simple average, especially for cells with mixed colors or high contrast.

---

## Known Limitations

- Only PNG and JPEG uploads are supported (no GIF, WebP, SVG).
- Color extraction runs entirely in the browser — very large images may be slow.
- The palette is session-only; it resets on page refresh.
- Right-click copy requires clipboard permissions in some browsers.

---

## Possible Future Improvements

- Drag-and-drop image upload
- URL-based image loading
- HSL value display alongside hex/RGB
- Copy all palette colors at once
- Persistent palette via localStorage
- Export palette as CSS custom properties or Figma tokens

---

## License

MIT — see [LICENSE](LICENSE) for details.
