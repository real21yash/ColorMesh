'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, type LucideIcon } from 'lucide-react';

export interface OnboardingStep {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface OnboardingTourProps {
  open: boolean;
  onDismiss: () => void;
  steps: OnboardingStep[];
  ariaLabel?: string;
}

export function OnboardingTour({ open, onDismiss, steps, ariaLabel = 'Getting started' }: OnboardingTourProps) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!open || steps.length === 0) return null;

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
      aria-label={ariaLabel}
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
