import React, { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

const fieldBase =
  'w-full rounded-lg bg-surface-muted/60 border text-slate-100 placeholder-slate-500 ' +
  'transition duration-150 focus:outline-none ' +
  'disabled:opacity-50 disabled:cursor-not-allowed';

const stateClasses = (error) =>
  error
    ? 'border-rose-500/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/30'
    : 'border-line focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/30';

/**
 * Input — text field with optional label, hint, error, and leading/trailing icons.
 * Backward compatible with the original { label, hint, id } API.
 */
const Input = forwardRef(function Input(
  { label, hint, error, id, className = '', leftIcon, rightIcon, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            fieldBase,
            'h-11 px-3.5 py-2.5',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            stateClasses(error),
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500">
            {rightIcon}
          </span>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="mt-1.5 text-xs text-rose-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, hint, error, id, className = '', ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        className={cn(fieldBase, 'resize-none px-3.5 py-2.5', stateClasses(error), className)}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
