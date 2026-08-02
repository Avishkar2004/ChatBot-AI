import React, { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

const fieldBase =
  'w-full rounded-lg border bg-surface-muted/60 text-slate-100 placeholder:text-slate-500 ' +
  'transition-colors duration-150 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const stateClasses = (error) =>
  error
    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/25'
    : 'border-line hover:border-line-strong focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/25';

const sizes = {
  sm: 'h-8 px-2.5 text-[13px]',
  md: 'h-9 px-3 text-sm',
  lg: 'h-10 px-3.5 text-sm',
};

function Label({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-medium text-slate-300">
      {children}
    </label>
  );
}

function Help({ id, error, hint }) {
  if (error) {
    return (
      <p id={id} className="mt-1.5 text-xs text-rose-400">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={id} className="mt-1.5 text-xs text-slate-500">
        {hint}
      </p>
    );
  }
  return null;
}

/**
 * Input — text field with optional label, hint, error, and affix icons.
 * Heights line up with Button so a field and a button sit flush in a row.
 */
const Input = forwardRef(function Input(
  { label, hint, error, id, size = 'lg', className = '', leftIcon, rightIcon, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const helpId = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={helpId}
          className={cn(
            fieldBase,
            sizes[size] || sizes.lg,
            leftIcon && 'pl-9',
            rightIcon && 'pr-9',
            stateClasses(error),
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500">
            {rightIcon}
          </span>
        )}
      </div>
      <Help id={helpId} error={error} hint={hint} />
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, id, className = '', counter, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const helpId = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={helpId}
        className={cn(
          fieldBase,
          'resize-none px-3 py-2.5 text-sm leading-relaxed',
          stateClasses(error),
          className
        )}
        {...props}
      />
      {/* Hint and counter share a baseline so the row height never jumps. */}
      {(error || hint || counter) && (
        <div className="mt-1.5 flex items-start justify-between gap-4">
          <span className={cn('text-xs', error ? 'text-rose-400' : 'text-slate-500')}>
            {error || hint}
          </span>
          {counter && <span className="tnum shrink-0 text-xs text-slate-500">{counter}</span>}
        </div>
      )}
    </div>
  );
});

export default Input;
