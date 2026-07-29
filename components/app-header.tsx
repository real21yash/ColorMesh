'use client';

import React from 'react';
import { ThemeToggle } from './theme-toggle';
import { ToolboxMenu } from './toolbox-menu';

/** Shared sizing for every header icon button, so ThemeToggle/ToolboxMenu/
 *  page-specific action buttons all render at identical dimensions. */
export const ICON_BTN = 'h-9 w-9 md:h-10 md:w-10';

/** Curated vivid hues for the title's per-letter hover effect — picked (rather than
 *  raw random HSL) so every result stays legible against both light and dark cards. */
const HOVER_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
];

function randomHoverColor(exclude?: string) {
  let color = HOVER_COLORS[Math.floor(Math.random() * HOVER_COLORS.length)];
  let attempts = 0;
  while (color === exclude && attempts < 5) {
    color = HOVER_COLORS[Math.floor(Math.random() * HOVER_COLORS.length)];
    attempts++;
  }
  return color;
}

const REVERT_DELAY_MS = 1500;
const revertTimeouts = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

interface AppHeaderProps {
  /** Shown beside the logo, e.g. "Style Extractor" — omit for the default/home tool */
  title?: string;
  /** Page-specific middle content (e.g. the Color Extractor's grid slider) */
  middleContent?: React.ReactNode;
  /** Page-specific icon buttons, rendered before the always-present theme toggle and toolbox menu */
  actions?: React.ReactNode;
}

export function AppHeader({ title, middleContent, actions }: AppHeaderProps) {
  return (
    <div className="bg-card border-b border-border p-4 flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-6">
      {/* Logo - always visible, always the same branding */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <img src="/logo.svg" alt="Color MESH" className="h-7 md:h-8 w-auto" />
      </div>

      {/* Page-specific actions + the always-present theme toggle and toolbox menu.
          Placed right after the logo in source order (and given ml-auto) so they
          share the same row as the logo on mobile even when there's no middleContent —
          middleContent (below) is what wraps to its own line, not this group.
          The page title sits immediately to the left of these icons (hidden on very
          narrow screens); each letter gets its own random-color hover swap. */}
      <div className="flex items-center gap-3 md:gap-4 ml-auto md:order-3">
        {title && (
          <h1 className="sr-only sm:not-sr-only sm:flex text-base md:text-lg font-semibold text-accent tracking-tight select-none">
            {title.split('').map((char, i) => (
              <span
                key={i}
                className="inline-block transition-colors duration-150"
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  const pending = revertTimeouts.get(el);
                  if (pending) clearTimeout(pending);
                  el.style.transitionDuration = '150ms';
                  el.style.color = randomHoverColor(el.style.color);
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  const pending = revertTimeouts.get(el);
                  if (pending) clearTimeout(pending);
                  const timeout = setTimeout(() => {
                    el.style.transitionDuration = '700ms';
                    el.style.color = '';
                    revertTimeouts.delete(el);
                  }, REVERT_DELAY_MS);
                  revertTimeouts.set(el, timeout);
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </h1>
        )}
        <div className="flex items-center gap-2">
          {actions}
          <ThemeToggle className={ICON_BTN} />
          <ToolboxMenu className={ICON_BTN} />
        </div>
      </div>

      {middleContent && (
        <div className="w-full md:w-auto md:flex-1 md:order-2">{middleContent}</div>
      )}
    </div>
  );
}
