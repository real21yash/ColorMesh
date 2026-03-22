"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Eye, EyeOff } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { ThemeToggle } from "@/components/theme-toggle";

interface ControlsToolbarProps {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showGrid: boolean;
  onGridVisibilityChange: (visible: boolean) => void;
  onImageUpload: (file: File) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

export function ControlsToolbar({
  gridSize,
  onGridSizeChange,
  showGrid,
  onGridVisibilityChange,
  onImageUpload,
}: ControlsToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert("Please upload a PNG or JPEG file");
      return;
    }

    onImageUpload(file);
    e.target.value = "";
  };

  return (
    <div className="bg-card border-b border-border p-4 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
      {/* Logo + Upload */}
      <div className="flex items-center gap-3 md:gap-4 md:flex-shrink-0">
        <img src="/logo.svg" alt="ColorMesh" className="h-7 md:h-8 w-auto" />

        <div className="flex flex-col gap-1">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-accent hover:bg-accent text-white transition-colors text-sm"
            size="sm"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Image</span>
            <span className="sm:hidden">Upload</span>
          </Button>
          <p className="text-xs text-muted-foreground hidden md:block">PNG or JPEG only</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Grid Size Slider */}
      <div className="flex-1 flex flex-col gap-2 md:flex-row md:items-center md:gap-4 min-w-0">
        <label htmlFor="grid-size" className="text-sm font-medium text-foreground whitespace-nowrap">
          Grid:
        </label>
        <div className="flex items-center gap-2 md:gap-3 flex-1 md:max-w-xs">
          <Slider
            id="grid-size"
            min={2}
            max={12}
            step={1}
            value={[gridSize]}
            onValueChange={(value) => onGridSizeChange(value[0])}
            className="flex-1"
          />
          <span className="text-sm font-semibold text-foreground w-10 md:w-12 text-right flex-shrink-0">
            {gridSize}×{gridSize}
          </span>
        </div>
      </div>

      {/* Grid Toggle + Theme */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onGridVisibilityChange(!showGrid)}
          title={showGrid ? "Hide grid" : "Show grid"}
          className="h-9 w-9 md:h-10 md:w-10"
        >
          {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </Button>
        <ThemeToggle />
      </div>
    </div>
  );
}
