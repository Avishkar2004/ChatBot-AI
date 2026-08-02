import React from 'react';
import { cn } from '../../lib/cn';

const markSizes = {
  sm: 'h-7 w-7 rounded-[0.5rem]',
  md: 'h-8 w-8 rounded-[0.5625rem]',
  lg: 'h-10 w-10 rounded-[0.6875rem]',
};

const wordSizes = {
  sm: 'text-[0.9375rem]',
  md: 'text-base',
  lg: 'text-lg',
};

/**
 * LogoMark — the product's only gradient surface.
 *
 * The glyph is an agent graph: one root node branching to two leaves. It reads
 * as a conversation thread at 32px and stays legible at 20px, which a stock
 * speech-bubble icon does not.
 */
export function LogoMark({ size = 'md', className = '' }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center bg-brand-gradient shadow-subtle shadow-inner-top',
        markSizes[size] || markSizes.md,
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]" aria-hidden="true">
        <path
          d="M7 6.5v5a3 3 0 0 0 3 3h6"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.95"
        />
        <path
          d="M12 14.5v1a3 3 0 0 0 3 3h1"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        <circle cx="7" cy="5" r="2.15" fill="white" />
        <circle cx="18" cy="14.5" r="2.15" fill="white" fillOpacity="0.95" />
        <circle cx="17.5" cy="19" r="1.75" fill="white" fillOpacity="0.6" />
      </svg>
    </span>
  );
}

/**
 * Logo — mark plus wordmark. Pass `mark` alone where space is tight.
 */
export default function Logo({ size = 'md', showWord = true, className = '' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showWord && (
        <span
          className={cn(
            'font-display font-bold tracking-[-0.02em] text-white',
            wordSizes[size] || wordSizes.md
          )}
        >
          Chatbot AI
        </span>
      )}
    </span>
  );
}
