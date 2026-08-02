import React from 'react';
import { cn } from '../../lib/cn';

/**
 * EmptyState — the canonical "nothing here yet" block.
 *
 * One icon, one line of title, one line of explanation, at most one action.
 * Using this everywhere is what stops empty views from each inventing their
 * own layout, icon size, and tone.
 *
 *   <EmptyState icon={Inbox} title="No projects yet"
 *               description="Create one to get started" action={<Button/>} />
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bordered = true,
  className = '',
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 py-14 text-center',
        bordered && 'rounded-xl border border-dashed border-line bg-white/[0.015]',
        className
      )}
    >
      {Icon && (
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-xl border border-line bg-surface-muted/50 text-slate-500">
          <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
        </span>
      )}
      <h3 className="font-display text-title-sm font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
