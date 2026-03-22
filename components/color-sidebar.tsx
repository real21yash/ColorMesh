"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Copy, Check, Lock, LockOpen, Shuffle, X } from "lucide-react";
import { type ColorSample } from "@/lib/color-utils";

interface ColorSidebarProps {
  colors: ColorSample[][];
  onExport: (format: "json" | "csv") => void;
  selectedCell?: { row: number; col: number } | null;
  onCellDeselect?: () => void;
  palette?: ColorSample[];
  onAddToPalette?: (color: ColorSample) => void;
  onRemoveFromPalette?: (hex: string) => void;
  onExportPalette?: (format: "text" | "image") => void;
  lockedColors?: Set<string>;
  onToggleLock?: (hex: string) => void;
  onRandomizePalette?: () => void;
}

export function ColorSidebar({
  colors,
  onExport,
  selectedCell,
  onCellDeselect,
  palette = [],
  onAddToPalette,
  onRemoveFromPalette,
  onExportPalette,
  lockedColors = new Set(),
  onToggleLock,
  onRandomizePalette,
}: ColorSidebarProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const flatColors = colors.flat();
  const selectedColor =
    selectedCell != null ? colors[selectedCell.row]?.[selectedCell.col] : null;

  return (
    <aside className="w-full bg-card border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-border flex-shrink-0">
        <h2 className="text-lg font-semibold text-foreground">Colors</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {flatColors.length} colors sampled
        </p>
      </div>

      {/* Selected Cell Detail */}
      {selectedCell != null && selectedColor && (
        <div className="p-4 border-b border-border bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Selected Cell
            </p>
            <button
              onClick={onCellDeselect}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Deselect cell"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-foreground mb-3">
            Row {selectedCell.row + 1}, Column {selectedCell.col + 1}
          </p>

          <div
            className="w-full h-16 rounded border-2 border-border mb-3"
            style={{ backgroundColor: selectedColor.hex }}
          />

          <div className="space-y-2">
            {(["hex", "rgb"] as const).map((format) => (
              <div key={format}>
                <div className="flex items-center justify-between p-2 bg-background rounded text-sm">
                  <span className="font-mono text-muted-foreground uppercase">{format}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        selectedColor[format],
                        `${format}-selected`
                      )
                    }
                    className="h-6 px-2"
                  >
                    {copiedId === `${format}-selected` ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <p className="text-xs font-mono text-foreground mt-1">{selectedColor[format]}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              R: {selectedColor.r} · G: {selectedColor.g} · B: {selectedColor.b}
            </p>
          </div>
        </div>
      )}

      {/* Color List */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {flatColors.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Upload an image and adjust the grid to sample colors
          </p>
        ) : (
          <div className="space-y-3">
            {flatColors.map((color, index) => {
              const inPalette = palette.some((c) => c.hex === color.hex);
              return (
                <Collapsible key={`${color.hex}-${index}`}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center w-full p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div
                        className={`w-10 h-10 rounded border-2 flex-shrink-0 transition-colors ${
                          inPalette ? "border-accent" : "border-border"
                        }`}
                        style={{ backgroundColor: color.hex }}
                        onClick={(e) => {
                          e.stopPropagation();
                          inPalette
                            ? onRemoveFromPalette?.(color.hex)
                            : onAddToPalette?.(color);
                        }}
                        title={inPalette ? "Remove from palette" : "Add to palette"}
                      />
                      <span className="ml-3 flex-1 text-left font-mono text-sm font-semibold text-foreground truncate">
                        {color.hex}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform flex-shrink-0" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-4 space-y-2 mt-2">
                    {(["hex", "rgb"] as const).map((format) => (
                      <div
                        key={format}
                        className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm"
                      >
                        <span className="font-mono text-muted-foreground uppercase">{format}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(color[format], `${format}-${index}`)
                          }
                          className="h-6 px-2"
                        >
                          {copiedId === `${format}-${index}` ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">
                      R: {color.r} · G: {color.g} · B: {color.b}
                    </p>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>

      {/* Palette Builder */}
      {palette.length > 0 && (
        <div className="p-3 md:p-4 border-t border-border bg-muted/20 flex-shrink-0 space-y-3 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              My Palette ({palette.length}/6)
            </h3>
            <button
              onClick={() => palette.forEach((c) => onRemoveFromPalette?.(c.hex))}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear palette"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {palette.map((color) => (
              <div key={color.hex} className="relative group">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-border hover:border-accent hover:shadow-lg transition-all"
                  style={{ backgroundColor: color.hex }}
                  title={color.hex}
                />
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button
                    onClick={() => onToggleLock?.(color.hex)}
                    className="bg-accent text-white rounded-full w-5 h-5 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    title={lockedColors.has(color.hex) ? "Unlock" : "Lock"}
                  >
                    {lockedColors.has(color.hex) ? (
                      <Lock className="w-2.5 h-2.5" />
                    ) : (
                      <LockOpen className="w-2.5 h-2.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onRemoveFromPalette?.(color.hex)}
                    className="bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-md hover:scale-110 transition-transform"
                    aria-label="Remove color"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={onRandomizePalette}
            size="sm"
            variant="outline"
            className="w-full flex items-center justify-center gap-1"
          >
            <Shuffle className="w-3 h-3" />
            Randomize
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onExportPalette?.("text")} size="sm" variant="outline">
              Export Text
            </Button>
            <Button onClick={() => onExportPalette?.("image")} size="sm" variant="outline">
              Export Image
            </Button>
          </div>
        </div>
      )}

      {/* Export */}
      {flatColors.length > 0 && (
        <div className="p-3 md:p-4 border-t border-border space-y-2 flex-shrink-0">
          <Button onClick={() => onExport("json")} className="w-full" variant="outline" size="sm">
            Export as JSON
          </Button>
          <Button onClick={() => onExport("csv")} className="w-full" variant="outline" size="sm">
            Export as CSV
          </Button>
        </div>
      )}
    </aside>
  );
}
