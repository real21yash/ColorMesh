'use client';

import React, { useRef, useEffect, useState } from 'react';
import { getAverageColor, isAcceptedImageFile, ACCEPTED_IMAGE_EXTENSIONS, type ColorSample } from '@/lib/color-utils';
import { UploadCloud, RefreshCw, X } from 'lucide-react';

interface ImageCanvasProps {
  imageSrc: string | null;
  gridSize: number;
  showGrid: boolean;
  onColorSample: (colors: ColorSample[][]) => void;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (cell: { row: number; col: number } | null) => void;
  colors: ColorSample[][];
  onImageUpload: (file: File) => void;
  onImageClear: () => void;
  selectedPalette?: ColorSample[];
  pickerActive?: boolean;
  onColorPicked?: (color: ColorSample) => void;
}

export function ImageCanvas({
  imageSrc,
  gridSize,
  showGrid,
  onColorSample,
  selectedCell,
  onCellSelect,
  colors,
  onImageUpload,
  onImageClear,
  selectedPalette = [],
  pickerActive = false,
  onColorPicked,
}: ImageCanvasProps) {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [fitScale, setFitScale] = useState(1);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragDepth = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current += 1;
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    handleFile(file, 'drop');
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Shared validate-and-upload path for both drag-drop and the file input
  const handleFile = (file: File, source: 'drop' | 'upload') => {
    if (isAcceptedImageFile(file)) {
      onImageUpload(file);
    } else {
      alert(`Please ${source} a PNG, JPEG, WEBP, GIF, BMP, SVG, or AVIF file`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleFile(file, 'upload');

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  // Load image
  useEffect(() => {
    if (!imageSrc || !imageCanvasRef.current) return;

    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = imageCanvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasSize({ width: img.width, height: img.height });

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      requestAnimationFrame(() => {
        ctx.drawImage(img, 0, 0);

        requestAnimationFrame(() => {
          sampleColorsFromCanvas(canvas);
        });
      });
    };

    const sampleColorsFromCanvas = (canvas: HTMLCanvasElement) => {
      const newColors: ColorSample[][] = [];
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;

      for (let row = 0; row < gridSize; row++) {
        const rowColors: ColorSample[] = [];
        for (let col = 0; col < gridSize; col++) {
          const startX = col * cellWidth;
          const startY = row * cellHeight;

          const color = getAverageColor(
            canvas,
            Math.floor(startX),
            Math.floor(startY),
            Math.ceil(cellWidth),
            Math.ceil(cellHeight)
          );

          rowColors.push(color);
        }
        newColors.push(rowColors);
      }

      onColorSample(newColors);
      setIsLoading(false);
    };

    img.onerror = () => {
      setIsLoading(false);
    };

    img.src = imageSrc;
  }, [imageSrc, gridSize, onColorSample]);

  // Fit image inside container
  useEffect(() => {
    if (!containerRef.current || canvasSize.width === 0 || canvasSize.height === 0) return;

    const maxWidth = containerRef.current.clientWidth || 800;
    const maxHeight = containerRef.current.clientHeight || 600;

    const scale = Math.min(
      maxWidth / canvasSize.width,
      maxHeight / canvasSize.height,
      1
    );

    setFitScale(scale);
  }, [canvasSize]);

  // Draw grid
  useEffect(() => {
    if (!gridCanvasRef.current || !imageCanvasRef.current || colors.length === 0) return;

    const gridCanvas = gridCanvasRef.current;
    const imageCanvas = imageCanvasRef.current;

    gridCanvas.width = imageCanvas.width;
    gridCanvas.height = imageCanvas.height;

    const ctx = gridCanvas.getContext('2d');
    if (!ctx) return;

    if (showGrid) {
      const rows = colors.length;
      const cols = colors[0].length;
      const cellWidth = imageCanvas.width / cols;
      const cellHeight = imageCanvas.height / rows;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const color = colors[row]?.[col];
          if (!color) continue;

          const x = col * cellWidth;
          const y = row * cellHeight;

          ctx.fillStyle = color.hex;
          ctx.fillRect(x, y, cellWidth, cellHeight);

          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, cellWidth, cellHeight);

          if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, cellWidth, cellHeight);
          }

          if (selectedPalette.some((c) => c.hex === color.hex)) {
            const radius = Math.max(4, Math.min(cellWidth, cellHeight) * 0.12);
            const cx = x + cellWidth - radius - 4;
            const cy = y + radius + 4;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = '#22c55e';
            ctx.fill();
          }
        }
      }
    } else {
      ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);
    }
  }, [showGrid, colors, selectedCell, selectedPalette]);

  // Shared math: convert a mouse event to a {row, col} grid cell
  const getCellFromEvent = (e: React.MouseEvent): { row: number; col: number } | null => {
    if (!showGrid || colors.length === 0) return null;

    const canvas = gridCanvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const rows = colors.length;
    const cols = colors[0].length;
    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    return row >= 0 && row < rows && col >= 0 && col < cols ? { row, col } : null;
  };

  // Click (fixed math + toggle)
  const handleCanvasClick = (e: React.MouseEvent) => {
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const isSameCell = selectedCell?.row === cell.row && selectedCell?.col === cell.col;
    onCellSelect(isSameCell ? null : cell);
  };

  // Right click copy
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const cell = getCellFromEvent(e);
    if (!cell) return;

    const color = colors[cell.row]?.[cell.col];
    if (color) navigator.clipboard.writeText(color.hex);
  };

  // Eyedropper fallback: sample the exact pixel under the cursor, no grid involved
  const handlePickerClick = (e: React.MouseEvent) => {
    if (!pickerActive || !onColorPicked) return;

    const canvas = imageCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

    const color = getAverageColor(canvas, x, y, 1, 1);
    onColorPicked(color);
  };

  const displayWidth = canvasSize.width * fitScale;
  const displayHeight = canvasSize.height * fitScale;

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 flex flex-col items-center justify-center bg-muted/30 rounded-lg overflow-hidden border-2 transition-colors ${
        isDraggingOver ? 'border-accent bg-accent/5' : 'border-transparent'
      }`}
      onContextMenu={handleContextMenu}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        cursor: showGrid ? 'pointer' : 'default',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        onChange={handleFileSelect}
        className="hidden"
      />

      {isDraggingOver && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm pointer-events-none">
          <UploadCloud className="w-10 h-10 text-accent" />
          <p className="text-sm font-medium text-foreground">Drop image to upload</p>
        </div>
      )}

      {imageSrc && (
        <>
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={handleBrowseClick}
              title="Upload a different image"
              className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-background/90 border border-border text-foreground shadow-sm backdrop-blur-sm hover:bg-accent/25 hover:border-accent/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change image</span>
            </button>
            <button
              type="button"
              onClick={onImageClear}
              title="Remove image"
              className="flex items-center justify-center h-8 w-8 rounded-md bg-background/90 border border-border text-foreground shadow-sm backdrop-blur-sm hover:bg-destructive/20 hover:border-destructive/60 hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-center w-full h-full">
          <div
            style={{
              position: 'relative',
              width: displayWidth,
              height: displayHeight,
              flexShrink: 0,
            }}
          >
            {/* Image */}
            <canvas
              ref={imageCanvasRef}
              className="block"
              width={canvasSize.width || 500}
              height={canvasSize.height || 500}
              style={{
                width: '100%',
                height: '100%',
                opacity: showGrid ? 0 : 1,
                pointerEvents: showGrid ? 'none' : 'auto',
                imageRendering: 'auto',
                transition: 'opacity 0.2s ease-in-out',
              }}
            />

            {/* Grid */}
            <canvas
              ref={gridCanvasRef}
              className="block absolute top-0 left-0"
              width={canvasSize.width || 500}
              height={canvasSize.height || 500}
              style={{
                width: '100%',
                height: '100%',
                opacity: showGrid ? 1 : 0,
                pointerEvents: showGrid ? 'auto' : 'none',
                transition: 'opacity 0.2s ease-in-out',
              }}
              onClick={handleCanvasClick}
            />

            {/* Eyedropper overlay — sits above both canvases, captures the pick click */}
            {pickerActive && (
              <div
                className="absolute inset-0 z-20 cursor-crosshair"
                onClick={handlePickerClick}
                title="Click to pick a color"
              />
            )}
          </div>
          </div>
        </>
      )}

      {!imageSrc && (
        <button
          type="button"
          onClick={handleBrowseClick}
          className="text-center flex flex-col items-center gap-3 px-8 py-12 rounded-xl border-2 border-dashed border-border bg-transparent hover:border-accent hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 transition-colors cursor-pointer"
        >
          <UploadCloud className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-foreground font-medium mb-1">No image selected</p>
            <p className="text-sm text-muted-foreground">
              Click to browse, or drag &amp; drop an image here
            </p>
          </div>
        </button>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <p className="text-muted-foreground">Processing image...</p>
        </div>
      )}
    </div>
  );
}
