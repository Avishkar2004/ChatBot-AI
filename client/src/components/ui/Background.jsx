import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Background — a quiet, intentional backdrop.
 *
 * Deliberately restrained (Linear / Vercel style): a deep graphite field, one
 * soft radial wash near the top, and a faint grid that dissolves toward the
 * edges. No particles, no drifting aurora, no animation — depth comes from
 * the surface/shadow system on real components, not from the wallpaper.
 *
 * Fixed and behind everything. Mount once near the app root.
 */
export default function Background({ grid = true, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-surface', className)}
    >
      {/* Single soft wash, top-center — barely there */}
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(99,102,241,0.10),transparent_70%)]" />

      {/* Faint structural grid, fading out radially */}
      {grid && <div className="absolute inset-0 bg-grid mask-radial opacity-[0.35]" />}

      {/* Bottom grounding so content never floats on a flat color */}
      <div className="absolute inset-x-0 bottom-0 h-[40vh] bg-gradient-to-t from-surface-sunken/80 to-transparent" />
    </div>
  );
}
