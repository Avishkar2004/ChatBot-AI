import React from 'react';
import { cn } from '../../lib/cn';

const sizes = {
  xs: 'h-3.5 w-3.5 border-2',
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
};

/**
 * Minimal accessible spinner — a graphite ring with a bright leading arc.
 */
export default function Spinner({ size = 'md', className = '', label = 'Loading' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block rounded-full border-white/15 border-t-current animate-spin-slow align-[-0.125em]',
        sizes[size] || sizes.md,
        className
      )}
    />
  );
}
