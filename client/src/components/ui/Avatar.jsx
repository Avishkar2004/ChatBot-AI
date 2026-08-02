import React from 'react';
import { cn } from '../../lib/cn';

const sizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
};

/**
 * Deterministic tint per identity, so the same user is always the same colour
 * across the app. Hues are drawn from the accent family only — an avatar is
 * not a place to introduce a new palette.
 */
const tints = [
  'bg-brand-500/20 text-brand-200 ring-brand-400/25',
  'bg-violet-500/20 text-violet-300 ring-violet-400/25',
  'bg-electric-500/20 text-electric-300 ring-electric-400/25',
  'bg-cyan-500/20 text-cyan-300 ring-cyan-400/25',
];

function hashTint(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return tints[h % tints.length];
}

/**
 * Avatar — initial-based identity chip.
 *   <Avatar name={user.username} email={user.email} size="md" />
 */
export default function Avatar({ name, email, size = 'md', className = '' }) {
  const source = name || email || '';
  const initial = source ? source.charAt(0).toUpperCase() : '?';

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold uppercase ring-1',
        hashTint(source),
        sizes[size] || sizes.md,
        className
      )}
    >
      {initial}
    </span>
  );
}
