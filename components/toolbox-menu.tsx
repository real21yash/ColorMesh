'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutGrid, Pipette, Palette, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  { href: '/', icon: Pipette, name: 'Color Extractor', description: 'Sample colors from an image' },
  { href: '/style-extractor', icon: Palette, name: 'Style Extractor', description: 'Pull design tokens from a URL' },
];

export function ToolboxMenu({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Toolbox" className={className}>
          <LayoutGrid className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Toolbox</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tools.map(({ href, icon: Icon, name, description }) => {
          const isActive = pathname === href;
          return (
            <DropdownMenuItem
              key={href}
              asChild
              className={cn('group gap-3 py-2.5 cursor-pointer', isActive && 'bg-accent/10')}
            >
              <Link href={href}>
                {/* group-focus: on hover/keyboard-focus the parent item's background
                    becomes solid bg-accent (see ui/dropdown-menu.tsx) — this badge
                    switches to accent-foreground-based tint so the icon stays legible
                    against it instead of matching the same hue. */}
                <span
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0 transition-colors',
                    'bg-accent/15 text-accent',
                    'group-focus:bg-accent-foreground/20 group-focus:text-accent-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-foreground group-focus:text-accent-foreground flex items-center gap-1.5">
                    {name}
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-accent group-focus:text-accent-foreground flex-shrink-0" />
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground group-focus:text-accent-foreground/80 truncate">
                    {description}
                  </span>
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="gap-3 py-2.5">
          <span className="flex items-center justify-center w-8 h-8 rounded-md bg-muted border border-dashed border-border flex-shrink-0">
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
          </span>
          <span className="flex flex-col">
            <span className="text-sm text-muted-foreground">More tools</span>
            <span className="text-xs text-muted-foreground/70">Coming soon</span>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
