'use client';

import React, { useRef, useEffect, useState } from 'react';
import { getAverageColor, isAcceptedImageFile, type ColorSample } from '@/lib/color-utils';
import { UploadCloud } from 'lucide-react';

interface ImageCanvasProps {
  imageSrc: string | null;
  gridSize: number;
  showGrid: boolean;
  onColorSample: (colors: ColorSample[][]) => void;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (cell: { row: number; col: number } | null) => void;
  colors: ColorSample[][];
  onImageUpload: (file: File) => void;
  selectedPalette?: ColorSample[];
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
  selectedPalette = [],
}: ImageCanvasProps) {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    if (isAcceptedImageFile(file)) {
      onImageUpload(file);
    } else {
      alert('Please drop a PNG, JPEG, WEBP, GIF, BMP, SVG, or AVIF file');
    }
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

  // Click (fixed math + toggle)
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!showGrid || colors.length === 0) return;

    const canvas = gridCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const rows = colors.length;
    const cols = colors[0].length;

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
        onCellSelect(null);
      } else {
        onCellSelect({ row, col });
      }
    }
  };

  // Right click copy
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!showGrid || colors.length === 0) return;

    const canvas = gridCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const rows = colors.length;
    const cols = colors[0].length;

    const cellWidth = canvas.width / cols;
    const cellHeight = canvas.height / rows;

    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      const color = colors[row]?.[col];
      if (color) {
        navigator.clipboard.writeText(color.hex);
      }
    }
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
      {isDraggingOver && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm pointer-events-none">
          <UploadCloud className="w-10 h-10 text-accent" />
          <p className="text-sm font-medium text-foreground">Drop image to upload</p>
        </div>
      )}

      {imageSrc && (
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
          </div>
        </div>
      )}

      {!imageSrc && (
        <div className="text-center flex flex-col items-center gap-3 px-8 py-12 rounded-xl border-2 border-dashed border-border">
          <UploadCloud className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-foreground font-medium mb-1">No image selected</p>
            <p className="text-sm text-muted-foreground">
              Drag & drop an image here, or use Upload above
            </p>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <p className="text-muted-foreground">Processing image...</p>
        </div>
      )}
    </div>
  );
}
