"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { sampleColor, type ColorSample } from "@/lib/color-utils";

interface ImageCanvasProps {
  imageSrc: string | null;
  gridSize: number;
  showGrid: boolean;
  onColorSample: (colors: ColorSample[][]) => void;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (cell: { row: number; col: number } | null) => void;
  colors: ColorSample[][];
}

export function ImageCanvas({
  imageSrc,
  gridSize,
  showGrid,
  onColorSample,
  selectedCell,
  onCellSelect,
  colors,
}: ImageCanvasProps) {
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [displayScale, setDisplayScale] = useState(1);

  // Sample colors from the canvas after the image is drawn
  const extractColors = useCallback(
    (canvas: HTMLCanvasElement) => {
      const rows: ColorSample[][] = [];
      const cellWidth = canvas.width / gridSize;
      const cellHeight = canvas.height / gridSize;

      for (let row = 0; row < gridSize; row++) {
        const rowColors: ColorSample[] = [];
        for (let col = 0; col < gridSize; col++) {
          rowColors.push(
            sampleColor(
              canvas,
              Math.floor(col * cellWidth),
              Math.floor(row * cellHeight),
              Math.ceil(cellWidth),
              Math.ceil(cellHeight)
            )
          );
        }
        rows.push(rowColors);
      }

      onColorSample(rows);
    },
    [gridSize, onColorSample]
  );

  // Load and draw image, then extract colors
  useEffect(() => {
    if (!imageSrc || !imageCanvasRef.current) return;

    setIsLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = imageCanvasRef.current;
      if (!canvas) return;

      canvas.width = img.width;
      canvas.height = img.height;
      setCanvasSize({ width: img.width, height: img.height });

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      extractColors(canvas);
      setIsLoading(false);
    };

    img.onerror = () => setIsLoading(false);
    img.src = imageSrc;
  }, [imageSrc, extractColors]);

  // Re-extract colors when grid size changes (image already drawn)
  useEffect(() => {
    if (!imageCanvasRef.current || !imageSrc) return;
    extractColors(imageCanvasRef.current);
  }, [gridSize, imageSrc, extractColors]);

  // Fit canvas to container
  useEffect(() => {
    if (!containerRef.current || canvasSize.width === 0) return;

    const { clientWidth, clientHeight } = containerRef.current;
    const scale = Math.min(
      clientWidth / canvasSize.width,
      clientHeight / canvasSize.height,
      1
    );
    setDisplayScale(scale);
  }, [canvasSize]);

  // Draw grid overlay
  useEffect(() => {
    if (!gridCanvasRef.current || !imageCanvasRef.current || colors.length === 0) return;

    const gridCanvas = gridCanvasRef.current;
    const imageCanvas = imageCanvasRef.current;
    gridCanvas.width = imageCanvas.width;
    gridCanvas.height = imageCanvas.height;

    const ctx = gridCanvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    if (!showGrid) return;

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

        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth, cellHeight);

        if (selectedCell?.row === row && selectedCell?.col === col) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, cellWidth, cellHeight);
        }
      }
    }
  }, [showGrid, colors, selectedCell]);

  const getCellFromEvent = (e: React.MouseEvent): { row: number; col: number } | null => {
    const canvas = gridCanvasRef.current;
    if (!canvas || colors.length === 0) return null;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const rows = colors.length;
    const cols = colors[0].length;
    const col = Math.floor(x / (canvas.width / cols));
    const row = Math.floor(y / (canvas.height / rows));

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      return { row, col };
    }
    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!showGrid) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;

    if (selectedCell?.row === cell.row && selectedCell?.col === cell.col) {
      onCellSelect(null);
    } else {
      onCellSelect(cell);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!showGrid) return;
    const cell = getCellFromEvent(e);
    if (!cell) return;
    const color = colors[cell.row]?.[cell.col];
    if (color) navigator.clipboard.writeText(color.hex);
  };

  const displayWidth = canvasSize.width * displayScale;
  const displayHeight = canvasSize.height * displayScale;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col items-center justify-center bg-muted/30 rounded-lg overflow-hidden"
      style={{ cursor: showGrid ? "pointer" : "default" }}
      onContextMenu={handleContextMenu}
    >
      {imageSrc ? (
        <div
          style={{ position: "relative", width: displayWidth, height: displayHeight, flexShrink: 0 }}
        >
          <canvas
            ref={imageCanvasRef}
            width={canvasSize.width || 500}
            height={canvasSize.height || 500}
            style={{
              width: "100%",
              height: "100%",
              opacity: showGrid ? 0 : 1,
              pointerEvents: "none",
              transition: "opacity 0.2s ease-in-out",
            }}
          />
          <canvas
            ref={gridCanvasRef}
            width={canvasSize.width || 500}
            height={canvasSize.height || 500}
            className="absolute top-0 left-0"
            style={{
              width: "100%",
              height: "100%",
              opacity: showGrid ? 1 : 0,
              pointerEvents: showGrid ? "auto" : "none",
              transition: "opacity 0.2s ease-in-out",
            }}
            onClick={handleClick}
          />
        </div>
      ) : (
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No image selected</p>
          <p className="text-sm text-muted-foreground">Upload an image to get started</p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <p className="text-muted-foreground">Processing image…</p>
        </div>
      )}
    </div>
  );
}
