'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Lock, LockOpen, Shuffle, X, Plus, Trash2 } from 'lucide-react';
import { type ColorSample } from '@/lib/color-utils';

interface ColorSidebarProps {
  colors: ColorSample[][];
  onExport: (format: 'json' | 'csv') => void;
  selectedCell?: { row: number; col: number } | null;
  onCellDeselect?: () => void;
  selectedPalette?: ColorSample[];
  onAddToPalette?: (color: ColorSample) => void;
  onRemoveFromPalette?: (hex: string) => void;
  onExportPalette?: (format: 'text' | 'image') => void;
  lockedColors?: Set<string>;
  onToggleLock?: (hex: string) => void;
  onRandomizePalette?: () => void;
}

const MAX_PALETTE_SIZE = 6;
const MIN_PALETTE_FOR_EXPORT = 2;

export function ColorSidebar({
  colors,
  onExport,
  selectedCell,
  onCellDeselect,
  selectedPalette = [],
  onAddToPalette,
  onRemoveFromPalette,
  onExportPalette,
  lockedColors = new Set(),
  onToggleLock,
  onRandomizePalette,
}: ColorSidebarProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copyToClipboard = (text: string, valueId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedValue(valueId);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const flatColors = colors.flat();
  const paletteFull = selectedPalette.length >= MAX_PALETTE_SIZE;
  const canExportPalette = selectedPalette.length >= MIN_PALETTE_FOR_EXPORT;

  const selectedColor = selectedCell ? colors[selectedCell.row]?.[selectedCell.col] : null;
  const isSelectedInPalette = selectedColor
    ? selectedPalette.some((c) => c.hex === selectedColor.hex)
    : false;

  const togglePaletteMembership = (color: ColorSample) => {
    const inPalette = selectedPalette.some((c) => c.hex === color.hex);
    if (inPalette) {
      onRemoveFromPalette?.(color.hex);
    } else if (selectedPalette.length < MAX_PALETTE_SIZE) {
      onAddToPalette?.(color);
    }
  };

  return (
    <aside className="w-full bg-card flex flex-col min-h-full">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Colors</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {flatColors.length} colors sampled
        </p>
      </div>

      {/* Selected Cell — compact, no layout jump */}
      {selectedCell && selectedColor && (
        <div className="p-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border border-border flex-shrink-0"
              style={{ backgroundColor: selectedColor.hex }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(selectedColor.hex, 'sel-hex')}
                  className="font-mono text-sm font-semibold text-foreground truncate hover:text-accent transition-colors flex items-center gap-1.5"
                  title="Copy HEX"
                >
                  {selectedColor.hex}
                  {copiedValue === 'sel-hex' ? (
                    <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground truncate">{selectedColor.rgb}</p>
            </div>
            <button
              onClick={onCellDeselect}
              className="flex items-center justify-center w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={() => togglePaletteMembership(selectedColor)}
            disabled={!isSelectedInPalette && paletteFull}
            size="sm"
            variant={isSelectedInPalette ? 'outline' : 'default'}
            className="w-full mt-3 flex items-center justify-center gap-1.5"
          >
            {isSelectedInPalette ? (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Remove from Palette
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                {paletteFull ? 'Palette Full (6/6)' : 'Add to Palette'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* Compact swatch grid — tap any color to toggle it in/out of the palette,
          no need to open the grid to build a palette one cell at a time */}
      <div className="p-4 flex-shrink-0">
        {flatColors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Upload an image and adjust the grid to sample colors
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">
              Tap to add to palette
            </p>
            <div className="grid grid-cols-6 gap-2">
              {flatColors.map((color, index) => {
                const isInPalette = selectedPalette.some((c) => c.hex === color.hex);
                return (
                  <button
                    key={`${color.hex}-${index}`}
                    onClick={() => togglePaletteMembership(color)}
                    className={`relative aspect-square rounded-md border transition-all hover:scale-105 ${
                      isInPalette ? 'border-accent ring-2 ring-accent/40' : 'border-border'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={`${color.hex} — click to ${isInPalette ? 'remove from' : 'add to'} palette`}
                  >
                    {isInPalette && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent text-white flex items-center justify-center">
                        <Check className="w-2 h-2" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Palette Builder Section */}
      {selectedPalette.length > 0 && (
        <div className="border-t border-border bg-muted/20 flex-shrink-0">
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                My Palette <span className="text-muted-foreground font-normal">({selectedPalette.length}/{MAX_PALETTE_SIZE})</span>
              </h3>
              <button
                onClick={() => selectedPalette.forEach(c => onRemoveFromPalette?.(c.hex))}
                className="flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Clear palette"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {selectedPalette.map((color) => (
                <div key={color.hex} className="relative group aspect-square">
                  <div
                    className="w-full h-full rounded-xl border border-border shadow-sm cursor-pointer hover:shadow-md transition-all"
                    style={{ backgroundColor: color.hex }}
                    title={color.hex}
                  />
                  <div className="absolute -top-1.5 -right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => onToggleLock?.(color.hex)}
                      className="w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      title={lockedColors.has(color.hex) ? 'Unlock' : 'Lock'}
                    >
                      {lockedColors.has(color.hex) ? <Lock className="w-2.5 h-2.5" /> : <LockOpen className="w-2.5 h-2.5" />}
                    </button>
                    <button
                      onClick={() => onRemoveFromPalette?.(color.hex)}
                      className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                      title="Remove from palette"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {Array.from({ length: MAX_PALETTE_SIZE - selectedPalette.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-xl border border-dashed border-border/70 flex items-center justify-center"
                >
                  <Plus className="w-4 h-4 text-border" />
                </div>
              ))}
            </div>

            <Button
              onClick={() => onRandomizePalette?.()}
              size="sm"
              variant="outline"
              className="w-full flex items-center justify-center gap-1.5"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Randomize
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => onExportPalette?.('text')}
                size="sm"
                variant="outline"
                disabled={!canExportPalette}
                title={canExportPalette ? undefined : 'Add at least 2 colors to export'}
              >
                Export Text
              </Button>
              <Button
                onClick={() => onExportPalette?.('image')}
                size="sm"
                variant="outline"
                disabled={!canExportPalette}
                title={canExportPalette ? undefined : 'Add at least 2 colors to export'}
              >
                Export Image
              </Button>
            </div>
            {!canExportPalette && (
              <p className="text-xs text-muted-foreground text-center">
                Add at least {MIN_PALETTE_FOR_EXPORT} colors to export your palette
              </p>
            )}
          </div>
        </div>
      )}

      {/* Export Buttons */}
      {flatColors.length > 0 && (
        <div className="p-3 md:p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-border space-y-2 flex-shrink-0">
          <Button
            onClick={() => onExport('json')}
            className="w-full text-sm"
            variant="outline"
            size="sm"
          >
            Export as JSON
          </Button>
          <Button
            onClick={() => onExport('csv')}
            className="w-full text-sm"
            variant="outline"
            size="sm"
          >
            Export as CSV
          </Button>
        </div>
      )}
    </aside>
  );
}
