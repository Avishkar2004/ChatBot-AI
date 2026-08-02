import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * PageHeader — the top of every authenticated page.
 *
 * Fixes the title/description/action relationship in one place so pages stop
 * disagreeing about heading size and vertical rhythm. `eyebrow` optionally
 * renders a back-link above the title.
 */
export default function PageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel = 'Back',
  className = '',
}) {
  return (
    <header className={cn('pb-7 pt-9', className)}>
      {backTo && (
        <Link
          to={backTo}
          className="focus-ring -ml-1.5 mb-3 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-display-sm font-bold text-white">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  );
}
