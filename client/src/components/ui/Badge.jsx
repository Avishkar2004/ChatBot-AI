import React from 'react';
import { cn } from '../../lib/cn';

const variants = {
  neutral: 'bg-white/[0.06] text-slate-300 border-line',
  brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

const sizes = {
  sm: 'h-5 px-2 text-[11px]',
  md: 'h-6 px-2.5 text-xs',
};

export default function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none',
        variants[variant] || variants.neutral,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
