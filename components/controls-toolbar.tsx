'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Info, HelpCircle, Pipette } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { AppHeader, ICON_BTN } from '@/components/app-header';
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
  onRestartTour: () => void;
  pickerActive: boolean;
  onPickColor: () => void;
}

export function ControlsToolbar({
  gridSize,
  onGridSizeChange,
  showGrid,
  onGridVisibilityChange,
  onRestartTour,
  pickerActive,
  onPickColor,
}: ControlsToolbarProps) {
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleShowTour = () => {
    setAboutOpen(false);
    onRestartTour();
  };

  return (
    <>
      <AppHeader
        title="Color Extractor"
        middleContent={
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
        }
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={onPickColor}
              title="Pick a color from the image"
              aria-pressed={pickerActive}
              className={`${ICON_BTN} ${pickerActive ? 'bg-accent/25 border-accent/60 text-accent' : ''}`}
            >
              <Pipette className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => onGridVisibilityChange(!showGrid)}
              title={showGrid ? 'Hide grid' : 'Show grid'}
              className={ICON_BTN}
            >
              {showGrid ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setAboutOpen(true)}
              title="About ColorMesh"
              className={ICON_BTN}
            >
              <Info className="w-4 h-4" />
            </Button>
          </>
        }
      />

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>About ColorMesh</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">New here?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowTour}
                className="w-full justify-start gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                How to use ColorMesh
              </Button>
            </div>

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
                href="https://www.okyash.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline flex items-center gap-2"
              >
               okyash.com
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
    </>
  );
}
