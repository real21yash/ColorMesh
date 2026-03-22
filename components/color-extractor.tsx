"use client";

import React, { useState } from "react";
import { ImageCanvas } from "./image-canvas";
import { ColorSidebar } from "./color-sidebar";
import { ControlsToolbar } from "./controls-toolbar";
import { type ColorSample, exportAsJSON, exportAsCSV, downloadFile } from "@/lib/color-utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const MAX_PALETTE_SIZE = 6;

export function ColorExtractor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(4);
  const [showGrid, setShowGrid] = useState(false);
  const [colors, setColors] = useState<ColorSample[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [palette, setPalette] = useState<ColorSample[]>([]);
  const [lockedColors, setLockedColors] = useState<Set<string>>(new Set());
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGridSizeChange = (size: number) => {
    setGridSize(size);
    setSelectedCell(null);
  };

  const handleExport = (format: "json" | "csv") => {
    if (colors.length === 0) return;
    if (format === "json") {
      downloadFile(exportAsJSON(colors), "colors.json");
    } else {
      downloadFile(exportAsCSV(colors), "colors.csv");
    }
  };

  const handleAddToPalette = (color: ColorSample) => {
    if (palette.length >= MAX_PALETTE_SIZE) return;
    if (palette.some((c) => c.hex === color.hex)) return;
    setPalette((prev) => [...prev, color]);
  };

  const handleRemoveFromPalette = (hex: string) => {
    setPalette((prev) => prev.filter((c) => c.hex !== hex));
    setLockedColors((prev) => {
      const next = new Set(prev);
      next.delete(hex);
      return next;
    });
  };

  const handleToggleLock = (hex: string) => {
    setLockedColors((prev) => {
      const next = new Set(prev);
      next.has(hex) ? next.delete(hex) : next.add(hex);
      return next;
    });
  };

  const handleRandomizePalette = () => {
    if (colors.length === 0) return;

    const allColors = colors.flat();
    const locked = palette.filter((c) => lockedColors.has(c.hex));
    const lockedHexes = new Set(locked.map((c) => c.hex));
    const available = allColors.filter((c) => !lockedHexes.has(c.hex));
    const shuffled = [...available].sort(() => Math.random() - 0.5);

    const slotsToFill = MAX_PALETTE_SIZE - locked.length;
    const picked: ColorSample[] = [];
    const seen = new Set(lockedHexes);

    for (const color of shuffled) {
      if (picked.length >= slotsToFill) break;
      if (!seen.has(color.hex)) {
        picked.push(color);
        seen.add(color.hex);
      }
    }

    setPalette([...locked, ...picked]);
  };

  const handleExportPalette = (format: "text" | "image") => {
    if (palette.length === 0) return;

    if (format === "text") {
      downloadFile(palette.map((c) => `${c.hex} - ${c.rgb}`).join("\n"), "palette.txt");
    } else {
      exportPaletteAsImage(palette);
    }
  };

  const exportPaletteAsImage = (colors: ColorSample[]) => {
    const canvas = document.createElement("canvas");
    const cellSize = 100;
    canvas.width = colors.length * cellSize;
    canvas.height = cellSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    colors.forEach((color, i) => {
      ctx.fillStyle = color.hex;
      ctx.fillRect(i * cellSize, 0, cellSize, cellSize);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(color.hex, (i + 0.5) * cellSize, cellSize - 10);
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "palette.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const sidebarProps = {
    colors,
    onExport: handleExport,
    selectedCell,
    onCellDeselect: () => setSelectedCell(null),
    palette,
    onAddToPalette: handleAddToPalette,
    onRemoveFromPalette: handleRemoveFromPalette,
    onExportPalette: handleExportPalette,
    lockedColors,
    onToggleLock: handleToggleLock,
    onRandomizePalette: handleRandomizePalette,
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <ControlsToolbar
        gridSize={gridSize}
        onGridSizeChange={handleGridSizeChange}
        showGrid={showGrid}
        onGridVisibilityChange={setShowGrid}
        onImageUpload={handleImageUpload}
      />

      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        {/* Canvas */}
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-auto">
          <ImageCanvas
            imageSrc={imageSrc}
            gridSize={gridSize}
            showGrid={showGrid}
            onColorSample={setColors}
            selectedCell={selectedCell}
            onCellSelect={setSelectedCell}
            colors={colors}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 border-l border-border">
          <ColorSidebar {...sidebarProps} />
        </div>

        {/* Mobile Sidebar */}
        <div className="lg:hidden">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="fixed bottom-6 right-6 rounded-full shadow-lg h-12 w-12"
                title="Open colors panel"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <ColorSidebar {...sidebarProps} />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
