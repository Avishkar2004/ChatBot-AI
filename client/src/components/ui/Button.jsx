import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';
import Spinner from './Spinner';

const base =
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ' +
  'select-none transition-[background-color,border-color,color,opacity] duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-45';

/**
 * Variants are a closed set on purpose. If a call site wants a colour that
 * isn't here, the answer is almost always one of these — not a new gradient.
 */
const variants = {
  primary: 'bg-brand-600 text-white shadow-subtle hover:bg-brand-500 active:bg-brand-700',
  secondary:
    'border border-line bg-white/[0.06] text-slate-100 hover:border-line-strong hover:bg-white/[0.1]',
  outline: 'border border-line-strong text-slate-200 hover:bg-white/[0.05] hover:text-white',
  ghost: 'text-slate-300 hover:bg-white/[0.06] hover:text-white',
  danger: 'bg-rose-600 text-white shadow-subtle hover:bg-rose-500 active:bg-rose-700',
  // Reads as a link, hits like a button.
  link: 'text-brand-300 underline-offset-4 hover:text-brand-200 hover:underline active:translate-y-0',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs',
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-4 text-sm',
  xl: 'h-11 px-5 text-[15px]',
};

/**
 * Button — the single call-to-action primitive.
 *
 * `as` renders it as a Link or anchor while keeping the visual contract.
 * While `loading`, the spinner takes the leading icon's slot rather than
 * replacing the label, so the control never changes width mid-request.
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
    fullWidth = false,
    children,
    disabled,
    type,
    ...props
  },
  ref
) {
  const isButton = Comp === 'button';

  return (
    <Comp
      ref={ref}
      type={isButton ? type || 'button' : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      aria-disabled={!isButton && (disabled || loading) ? true : undefined}
      className={cn(
        base,
        variants[variant] || variants.primary,
        variant === 'link' ? 'h-auto px-0' : sizes[size] || sizes.md,
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? <Spinner size="xs" className="text-current" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </Comp>
  );
});

export default Button;
