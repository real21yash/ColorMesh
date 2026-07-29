'use client';

import type { ReactNode } from 'react';

// Remounts on every route change (unlike layout.tsx), replaying the enter animation.
// Transform-only, no opacity: avoids a flash of near-invisible content if load is slow.
export default function Template({ children }: { children: ReactNode }) {
  return (
    <div className="animate-in slide-in-from-bottom-2 duration-300 ease-out motion-reduce:animate-none">
      {children}
    </div>
  );
}
