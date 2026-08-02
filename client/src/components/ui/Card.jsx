import React, { forwardRef } from 'react';
import { cn } from '../../lib/cn';

const surfaces = {
  raised: 'border border-line bg-surface-raised shadow-subtle',
  elevated: 'border border-line bg-surface-elevated shadow-floating',
  outline: 'border border-line bg-transparent',
  // Barely-there fill for nested panels inside an already-raised card.
  inset: 'border border-line-subtle bg-white/[0.02]',
};

const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6' };

/**
 * Card — the base surface primitive.
 *
 * `interactive` is a CSS-only border/fill shift rather than a transform lift:
 * a grid of cards that all rise on hover reads as a template, and the motion
 * budget is better spent on transitions that carry meaning.
 */
const Card = forwardRef(function Card(
  {
    as: Comp = 'div',
    variant = 'raised',
    interactive = false,
    padding = 'none',
    className = '',
    children,
    ...props
  },
  ref
) {
  return (
    <Comp
      ref={ref}
      className={cn(
        'rounded-xl',
        surfaces[variant] || surfaces.raised,
        paddings[padding] || '',
        interactive &&
          'transition-colors duration-150 hover:border-line-strong hover:bg-white/[0.025]',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-5 pb-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ as: Comp = 'h3', className = '', children, ...props }) {
  return (
    <Comp
      className={cn('font-display text-title-sm font-semibold text-white', className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={cn('mt-1 text-[13px] leading-relaxed text-slate-400', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ className = '', children, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      className={cn('flex items-center gap-2.5 border-t border-line px-5 py-3.5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
