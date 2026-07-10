'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, SlidersHorizontal, Pipette, Palette, X } from 'lucide-react';

const steps = [
  {
    icon: UploadCloud,
    title: 'Add an image',
    description:
      'Drag & drop an image onto the canvas, or click the dashed area to browse your files.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Set your grid',
    description:
      'Use the Grid slider to choose how many cells to sample. Each cell shows its dominant color, so fine details can get averaged out. Toggle the eye icon to preview the grid on top of your image.',
  },
  {
    icon: Pipette,
    title: 'Need an exact color?',
    description:
      'The dropper tool samples one exact pixel, no averaging. On Chrome or Edge it can pick any color on your whole screen; elsewhere, click it then click a spot on your image.',
  },
  {
    icon: Palette,
    title: 'Build your palette',
    description:
      'Click swatches in the sidebar to add them to your palette, lock your favorites, then export as JSON, CSV, text, or a PNG image.',
  },
];

interface OnboardingTourProps {
  open: boolean;
  onDismiss: () => void;
}

export function OnboardingTour({ open, onDismiss }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!open) return null;

  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const Icon = step.icon;

  const handleDismiss = () => {
    setStepIndex(0);
    onDismiss();
  };

  return (
    <div
      role="dialog"
      aria-label="Getting started with ColorMesh"
      className="fixed z-50 bottom-6 left-6 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-border bg-card shadow-2xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Skip walkthrough"
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground rounded-md p-1 hover:bg-accent/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-accent/15 text-accent flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">{step.title}</p>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {step.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === stepIndex ? 'w-5 bg-accent' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground">
            Skip
          </Button>
          <Button
            size="sm"
            onClick={() => (isLast ? handleDismiss() : setStepIndex((i) => i + 1))}
          >
            {isLast ? 'Got it' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
