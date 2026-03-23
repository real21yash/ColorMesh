'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Eye, EyeOff, Info, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ControlsToolbarProps {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showGrid: boolean;
  onGridVisibilityChange: (visible: boolean) => void;
  onImageUpload: (file: File) => void;
}

export function ControlsToolbar({
  gridSize,
  onGridSizeChange,
  showGrid,
  onGridVisibilityChange,
  onImageUpload,
}: ControlsToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg'];
    if (validTypes.includes(file.type)) {
      onImageUpload(file);
    } else {
      alert('Please upload a PNG or JPEG file');
    }
    
    // Reset input so same file can be uploaded again
    e.target.value = '';
  };

  return (
    <div className="bg-card border-b border-border p-4 flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
      {/* Logo and Upload - always visible */}
      <div className="flex items-center gap-3 md:gap-4 md:flex-shrink-0">
        <img 
          src="/logo.svg" 
          alt="Color MESH" 
          className="h-7 md:h-8 w-auto"
        />
        
        {/* Upload Button */}
        <div className="flex flex-col gap-1">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-accent hover:bg-accent text-white dark:hover:brightness-110 transition-colors text-sm md:text-base"
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
        onChange={handleFileSelect}
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
            {gridSize}x{gridSize}
          </span>
        </div>
      </div>

      {/* Grid Visibility Toggle, About, and Theme Toggle */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onGridVisibilityChange(!showGrid)}
          title={showGrid ? 'Hide grid' : 'Show grid'}
          className="h-9 w-9 md:h-10 md:w-10"
        >
          {showGrid ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setAboutOpen(true)}
          title="About ColorMesh"
          className="h-9 w-9 md:h-10 md:w-10"
        >
          <Info className="w-4 h-4" />
        </Button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>About ColorMesh</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Open Source</p>
              <a
                href="https://github.com/real21yash/ColorMesh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline flex items-center gap-2"
              >
                github.com/real21yash/ColorMesh
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Creator</p>
              <a
                href="https://www.yshvrdhn.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline flex items-center gap-2"
              >
                yshvrdhn.in
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Thank you for using ColorMesh! I appreciate your support in helping me build better tools for color extraction and palette creation.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
