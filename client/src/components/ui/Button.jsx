import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';
import Spinner from './Spinner';

const base =
  'relative inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap rounded-lg ' +
  'transition-colors duration-150 select-none ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const variants = {
  // Solid indigo — confident, flat, no glow. The default CTA.
  primary: 'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 shadow-subtle',
  // Near-white solid — high-contrast alternative for light-on-dark CTAs.
  contrast: 'bg-slate-100 text-slate-900 hover:bg-white active:bg-slate-200 shadow-subtle',
  // Quiet graphite
  secondary: 'bg-white/[0.06] text-slate-100 border border-line hover:bg-white/[0.1] hover:border-line-strong',
  // Minimal
  ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  // Outlined hairline
  outline: 'border border-line-strong text-slate-200 hover:bg-white/[0.04] hover:border-slate-500',
  // Destructive
  danger: 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-subtle',
  // Opt-in gradient — use sparingly, e.g. a single hero CTA.
  gradient: 'bg-brand-gradient text-white hover:brightness-[1.08] shadow-subtle',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-[15px]',
  icon: 'h-9 w-9 p-0',
};

/**
 * Button — solid, restrained, product-grade. No magnetic gimmicks, no glow by
 * default. `as` lets it render as a Link/anchor; `loading`, `leftIcon`,
 * `rightIcon` round out the API.
 */
const Button = forwardRef(function Button(
  {
    as: Comp = 'button',
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    leftIcon = null,
    rightIcon = null,
    children,
    disabled,
    ...props
  },
  ref
) {
  const classes = cn(base, variants[variant] || variants.primary, sizes[size] || sizes.md, className);

  return (
    <Comp
      ref={ref}
      className={classes}
      disabled={Comp === 'button' ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="xs" className="text-current" />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </Comp>
  );
});

export default Button;
