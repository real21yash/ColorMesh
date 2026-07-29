import Link from 'next/link';
import { Palette, Pipette, LayoutGrid } from 'lucide-react';
import { AppHeader } from '@/components/app-header';

export const metadata = {
  title: 'Toolbox — ColorMesh',
  description: 'A small toolbox of color and design utilities.',
};

const tools = [
  {
    href: '/',
    icon: Pipette,
    name: 'Color Extractor',
    description: 'Sample dominant colors from any image with an adjustable grid, plus an exact-pixel eyedropper.',
  },
  {
    href: '/style-extractor',
    icon: Palette,
    name: 'Style Extractor',
    description: 'Paste a URL to pull colors, fonts, radius, shadows, spacing, and CSS variables from a live site.',
  },
];

export default function ToolboxPage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Toolbox" />

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">Toolbox</h2>
          <p className="text-sm text-muted-foreground">Pick a tool to get started.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map(({ href, icon: Icon, name, description }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col gap-3 p-5 rounded-xl border border-border bg-card hover:border-accent/60 hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/15 text-accent">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">{name}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 p-5 rounded-xl border border-dashed border-border">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted border border-dashed border-border flex-shrink-0">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">More tools</p>
            <p className="text-xs text-muted-foreground/70">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
