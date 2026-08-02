import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Background — a quiet, static backdrop.
 *
 * One soft wash at the top, a structural grid that dissolves outward, and a
 * grounding gradient at the bottom. No orbs, no drift, no animation: depth is
 * supposed to come from the surface and shadow tokens on real components, and
 * a moving wallpaper is the fastest way to make a product look unfinished.
 *
 * Fixed behind everything. Mount once, near the app root.
 */
export default function Background({ grid = true, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface', className)}
    >
      <div className="absolute inset-x-0 top-0 h-[55vh] bg-[radial-gradient(70%_100%_at_50%_0%,rgba(99,102,241,0.09),transparent_72%)]" />

      {grid && <div className="absolute inset-0 bg-grid mask-radial opacity-40" />}

      <div className="absolute inset-x-0 bottom-0 h-[35vh] bg-gradient-to-t from-surface-sunken/70 to-transparent" />
    </div>
  );
}
