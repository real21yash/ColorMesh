'use client';

import React, { useEffect, useState } from 'react';
import { ImageCanvas } from './image-canvas';
import { ColorSidebar } from './color-sidebar';
import { ControlsToolbar } from './controls-toolbar';
import { type ColorSample } from '@/lib/color-utils';
import { exportAsJSON, exportAsCSV, downloadFile, downloadBlob, hexToRgb, rgbToString } from '@/lib/color-utils';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Menu, Pipette, Check, X as XIcon } from 'lucide-react';
import { OnboardingTour } from './onboarding-tour';

const ONBOARDING_STORAGE_KEY = 'colormesh-onboarding-dismissed';

export function ColorExtractor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(4);
  const [showGrid, setShowGrid] = useState(false);
  const [colors, setColors] = useState<ColorSample[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedPalette, setSelectedPalette] = useState<ColorSample[]>([]);
  const [lockedColors, setLockedColors] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [pickerActive, setPickerActive] = useState(false);
  const [pickedColor, setPickedColor] = useState<ColorSample | null>(null);
  const [pickedCopied, setPickedCopied] = useState(false);

  // Show the walkthrough automatically for first-time visitors
  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!dismissed) {
        setTourOpen(true);
      }
    } catch {
      // localStorage unavailable — skip auto-show silently
    }
  }, []);

  const handleDismissTour = () => {
    setTourOpen(false);
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleRestartTour = () => {
    setTourOpen(true);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
    };
    reader.readAsDataURL(file);
  };

  // Eyedropper: use the native browser API when available (can sample any
  // pixel on screen), otherwise fall back to click-to-sample on the image.
  const handlePickColor = async () => {
    setPickedCopied(false);

    if (typeof window !== 'undefined' && 'EyeDropper' in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        const hex = (result.sRGBHex as string).toUpperCase();
        const { r, g, b } = hexToRgb(hex);
        setPickedColor({ hex, rgb: rgbToString(r, g, b), r, g, b });
      } catch {
        // User pressed Escape or cancelled — do nothing
      }
      return;
    }

    // Fallback for browsers without EyeDropper support (e.g. Firefox, Safari)
    setPickerActive(true);
  };

  const handleColorPicked = (color: ColorSample) => {
    setPickedColor(color);
    setPickerActive(false);
    setPickedCopied(false);
  };

  const handleCopyPickedColor = () => {
    if (!pickedColor) return;
    navigator.clipboard.writeText(pickedColor.hex);
    setPickedCopied(true);
    setTimeout(() => setPickedCopied(false), 1500);
  };

  const handleClearImage = () => {
    setImageSrc(null);
    setColors([]);
    setSelectedCell(null);
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (colors.length === 0) return;
    const content = format === 'json' ? exportAsJSON(colors) : exportAsCSV(colors);
    downloadFile(content, `colors.${format}`);
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
      if (blob) downloadBlob(blob, 'palette.png');
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

  const sidebarProps = {
    colors,
    onExport: handleExport,
    selectedCell,
    onCellDeselect: () => setSelectedCell(null),
    selectedPalette,
    onAddToPalette: handleAddToPalette,
    onRemoveFromPalette: handleRemoveFromPalette,
    onExportPalette: handleExportPalette,
    lockedColors,
    onToggleLock: handleToggleLock,
    onRandomizePalette: handleRandomizePalette,
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      <ControlsToolbar
        gridSize={gridSize}
        onGridSizeChange={handleGridSizeChange}
        showGrid={showGrid}
        onGridVisibilityChange={setShowGrid}
        onRestartTour={handleRestartTour}
        pickerActive={pickerActive}
        onPickColor={handlePickColor}
      />

      {/* First-time user walkthrough */}
      <OnboardingTour open={tourOpen} onDismiss={handleDismissTour} />

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
            onImageClear={handleClearImage}
            selectedPalette={selectedPalette}
            pickerActive={pickerActive}
            onColorPicked={handleColorPicked}
          />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 border-l border-border h-full overflow-y-auto">
          <ColorSidebar {...sidebarProps} />
        </div>

        {/* Mobile/Tablet Palette Drawer — bottom sheet, not a full-height side panel */}
        <div className="lg:hidden">
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 rounded-full shadow-lg h-12 w-12 z-40"
            title="Open colors panel"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <DrawerContent className="max-h-[85vh] flex flex-col">
              <DrawerTitle className="sr-only">Colors &amp; Palette</DrawerTitle>
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] touch-pan-y">
                <ColorSidebar {...sidebarProps} />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      {/* Eyedropper result popup */}
      {pickedColor && (
        <div className="fixed z-50 bottom-6 right-6 w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-border bg-card shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            type="button"
            onClick={() => setPickedColor(null)}
            aria-label="Dismiss picked color"
            className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground rounded-md p-1 hover:bg-accent/20 transition-colors"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
              style={{ backgroundColor: pickedColor.hex }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{pickedColor.hex}</p>
              <p className="text-xs text-muted-foreground truncate">{pickedColor.rgb}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyPickedColor} className="flex-1 gap-1.5">
              {pickedCopied ? <Check className="w-3.5 h-3.5" /> : null}
              {pickedCopied ? 'Copied' : 'Copy hex'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                handleAddToPalette(pickedColor);
                setPickedColor(null);
              }}
              disabled={selectedPalette.length >= 6 || selectedPalette.some((c) => c.hex === pickedColor.hex)}
              className="flex-1"
            >
              Add to palette
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
