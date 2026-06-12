import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const surfaces = {
  raised: 'bg-surface-raised border border-line shadow-subtle',
  elevated: 'bg-surface-elevated border border-line shadow-floating',
  glass: 'glass',
  outline: 'bg-transparent border border-line',
  gradient: 'border border-line bg-gradient-to-b from-white/[0.03] to-transparent shadow-subtle',
};

/**
 * Card — the base surface primitive.
 *
 * Backward compatible: <Card className="..."> still works.
 * New props: variant (raised|elevated|glass|outline|gradient), interactive,
 * glow, padding (sm|md|lg|none), as.
 */
const Card = forwardRef(function Card(
  {
    as: Comp = 'div',
    variant = 'raised',
    interactive = false,
    glow = false,
    padding = 'none',
    className = '',
    children,
    ...props
  },
  ref
) {
  const pad = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }[padding] || '';
  const MotionComp = interactive ? motion(Comp) : Comp;

  return (
    <MotionComp
      ref={ref}
      className={cn(
        'rounded-xl',
        surfaces[variant] || surfaces.raised,
        pad,
        interactive &&
          'cursor-pointer transition-colors duration-150 hover:border-line-strong hover:bg-white/[0.02]',
        glow && 'hover:border-brand-500/40',
        className
      )}
      {...(interactive
        ? { whileHover: { y: -2 }, transition: { type: 'spring', stiffness: 320, damping: 26 } }
        : {})}
      {...props}
    >
      {children}
    </MotionComp>
  );
});

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-6 pb-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3 className={cn('font-display text-lg font-semibold text-white', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={cn('text-sm text-slate-400', className)} {...props}>
      {children}
    </p>
  );
}

export function CardBody({ className = '', children, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;
