import React, { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

const sizes = {
  sm: 'h-8 pl-3 pr-8 text-[13px]',
  md: 'h-9 pl-3 pr-9 text-sm',
  lg: 'h-11 pl-3.5 pr-10 text-[15px]',
};

/**
 * Select — a native <select> wearing the design system.
 *
 * Deliberately native rather than a custom listbox: it inherits keyboard
 * behaviour, mobile pickers, and form semantics for free. `color-scheme: dark`
 * on :root is what keeps the popup list dark in Chromium and Safari.
 */
const Select = forwardRef(function Select(
  { label, hint, error, id, size = 'md', className = '', selectClassName = '', children, ...props },
  ref
) {
  const autoId = useId();
  const selectId = id || autoId;

  // `className` sizes the wrapper, not the control: the wrapper is what a
  // flex row measures, so `w-auto` there actually shrinks the field.
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-[13px] font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={!!error || undefined}
          className={cn(
            'w-full cursor-pointer appearance-none rounded-lg border bg-surface-muted/60 font-medium text-slate-100',
            'transition-colors duration-150 focus:outline-none focus-visible:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-rose-500/60 focus-visible:border-rose-500 focus-visible:ring-rose-500/25'
              : 'border-line hover:border-line-strong focus-visible:border-brand-500/70 focus-visible:ring-brand-500/25',
            sizes[size] || sizes.md,
            selectClassName
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Select;
