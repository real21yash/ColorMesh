'use client';

import React, { useState } from 'react';
import { ImageCanvas } from './image-canvas';
import { ColorSidebar } from './color-sidebar';
import { ControlsToolbar } from './controls-toolbar';
import { type ColorSample } from '@/lib/color-utils';
import { exportAsJSON, exportAsCSV, downloadFile } from '@/lib/color-utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export function ColorExtractor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(4);
  const [showGrid, setShowGrid] = useState(false);
  const [colors, setColors] = useState<ColorSample[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<ColorSample[]>([]);
  const [lockedColors, setLockedColors] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (colors.length === 0) return;

    if (format === 'json') {
      const content = exportAsJSON(colors);
      downloadFile(content, 'colors.json');
    } else {
      const content = exportAsCSV(colors);
      downloadFile(content, 'colors.csv');
    }
  };

  // Clear selected cell when grid size changes
  const handleGridSizeChange = (size: number) => {
    setGridSize(size);
    setSelectedCell(null);
  };

  const handleAddToPalette = (color: ColorSample) => {
    if (selectedPalette.length < 6 && !selectedPalette.some(c => c.hex === color.hex)) {
      setSelectedPalette([...selectedPalette, color]);
    }
  };

  const handleRemoveFromPalette = (hex: string) => {
    setSelectedPalette(selectedPalette.filter(c => c.hex !== hex));
  };

  const handleExportPalette = (format: 'text' | 'image') => {
    if (selectedPalette.length < 2) return;

    if (format === 'text') {
      const lines = [
        'ColorMesh Palette',
        '─────────────────',
        ...selectedPalette.map(
          (c, i) => `${i + 1}. ${c.hex}   ${c.rgb}`
        ),
      ];
      downloadFile(lines.join('\n'), 'palette.txt');
    } else {
      exportPaletteAsImage(selectedPalette);
    }
  };

  const exportPaletteAsImage = (palette: ColorSample[]) => {
    const dpr = 2; // render at 2x for crisp export
    const cellWidth = 220;
    const cellHeight = 260;
    const padding = 32;

    const canvas = document.createElement('canvas');
    const width = palette.length * cellWidth + padding * 2;
    const height = cellHeight + padding * 2 + 40;
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, width, height);

    palette.forEach((color, index) => {
      const x = padding + index * cellWidth;
      const y = padding;
      const swatchW = cellWidth - 16;
      const swatchH = cellHeight - 56;
      const radius = 16;

      // Card shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;

      // Rounded swatch
      roundedRect(ctx, x, y, swatchW, swatchH, radius);
      ctx.fillStyle = color.hex;
      ctx.fill();
      ctx.restore();

      // Subtle inner border
      roundedRect(ctx, x, y, swatchW, swatchH, radius);
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Hex label
      ctx.fillStyle = '#18181b';
      ctx.font = '600 17px -apple-system, Segoe UI, Roboto, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(color.hex, x + 2, y + swatchH + 28);

      // RGB label
      ctx.fillStyle = '#71717a';
      ctx.font = '400 12px -apple-system, Segoe UI, Roboto, Arial, sans-serif';
      ctx.fillText(color.rgb, x + 2, y + swatchH + 46);
    });

    // Footer branding
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '500 12px -apple-system, Segoe UI, Roboto, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Made with ColorMesh', width - padding, height - 12);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'palette.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  const roundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const handleToggleLock = (hex: string) => {
    const newLocked = new Set(lockedColors);
    if (newLocked.has(hex)) {
      newLocked.delete(hex);
    } else {
      newLocked.add(hex);
    }
    setLockedColors(newLocked);
  };

  const handleRandomizePalette = () => {
    if (colors.length === 0) return;

    const flatColors = colors.flat();
    
    // Keep locked colors in their positions
    const lockedPaletteColors = selectedPalette.filter(c => lockedColors.has(c.hex));
    const lockedHexes = new Set(lockedPaletteColors.map(c => c.hex));
    
    // Get available colors (not already locked in palette)
    const availableColors = flatColors.filter(c => !lockedHexes.has(c.hex));
    
    // Shuffle available colors
    const shuffled = [...availableColors].sort(() => Math.random() - 0.5);
    
    // Calculate how many slots to fill (6 total minus locked)
    const slotsToFill = 6 - lockedPaletteColors.length;
    
    // Pick random colors for remaining slots (no duplicates)
    const newRandomColors: ColorSample[] = [];
    const usedHexes = new Set(lockedHexes);
    
    for (const color of shuffled) {
      if (newRandomColors.length >= slotsToFill) break;
      if (!usedHexes.has(color.hex)) {
        newRandomColors.push(color);
        usedHexes.add(color.hex);
      }
    }
    
    // Combine locked colors with new random colors
    setSelectedPalette([...lockedPaletteColors, ...newRandomColors]);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <ControlsToolbar
        gridSize={gridSize}
        onGridSizeChange={handleGridSizeChange}
        showGrid={showGrid}
        onGridVisibilityChange={setShowGrid}
        onImageUpload={handleImageUpload}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col p-4 md:p-6 overflow-auto">
          <ImageCanvas
            imageSrc={imageSrc}
            gridSize={gridSize}
            showGrid={showGrid}
            onColorSample={setColors}
            selectedCell={selectedCell}
            onCellSelect={setSelectedCell}
            colors={colors}
            onImageUpload={handleImageUpload}
            selectedPalette={selectedPalette}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 border-l border-border">
          <ColorSidebar 
            colors={colors} 
            onExport={handleExport}
            selectedCell={selectedCell}
            onCellDeselect={() => setSelectedCell(null)}
            selectedPalette={selectedPalette}
            onAddToPalette={handleAddToPalette}
            onRemoveFromPalette={handleRemoveFromPalette}
            onExportPalette={handleExportPalette}
            lockedColors={lockedColors}
            onToggleLock={handleToggleLock}
            onRandomizePalette={handleRandomizePalette}
          />
        </div>

        {/* Mobile/Tablet Sidebar Drawer */}
        <div className="lg:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
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
              <ColorSidebar 
                colors={colors} 
                onExport={handleExport}
                selectedCell={selectedCell}
                onCellDeselect={() => setSelectedCell(null)}
                selectedPalette={selectedPalette}
                onAddToPalette={handleAddToPalette}
                onRemoveFromPalette={handleRemoveFromPalette}
                onExportPalette={handleExportPalette}
                lockedColors={lockedColors}
                onToggleLock={handleToggleLock}
                onRandomizePalette={handleRandomizePalette}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
