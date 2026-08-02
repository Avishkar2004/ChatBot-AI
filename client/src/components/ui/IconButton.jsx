import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';
import Tooltip from './Tooltip';

const sizes = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
};

const variants = {
  ghost: 'text-slate-400 hover:bg-white/[0.07] hover:text-white',
  subtle: 'border border-line bg-white/[0.03] text-slate-300 hover:border-line-strong hover:text-white',
  danger: 'text-slate-400 hover:bg-rose-500/12 hover:text-rose-300',
};

/**
 * IconButton — a square, icon-only control.
 *
 * `label` is mandatory: it becomes the accessible name and, unless `tooltip`
 * is false, the hover tooltip. Icon-only buttons without names were the main
 * accessibility gap in the old pages.
 */
const IconButton = forwardRef(function IconButton(
  {
    label,
    icon: Icon,
    size = 'md',
    variant = 'ghost',
    tooltip = true,
    tooltipSide = 'top',
    className = '',
    children,
    ...props
  },
  ref
) {
  const button = (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        'focus-ring grid shrink-0 place-items-center rounded-lg transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-40',
        variants[variant] || variants.ghost,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {Icon ? <Icon size={size === 'sm' ? 14 : 16} aria-hidden="true" /> : children}
    </button>
  );

  if (!tooltip || !label) return button;
  return (
    <Tooltip label={label} side={tooltipSide}>
      {button}
    </Tooltip>
  );
});

export default IconButton;
