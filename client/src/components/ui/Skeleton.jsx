import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Skeleton — shimmering placeholder block. Pass width/height via className.
 *   <Skeleton className="h-4 w-32" />
 *   <Skeleton className="h-10 w-10 rounded-full" />
 */
export default function Skeleton({ className = '', ...props }) {
  return <div className={cn('skeleton h-4 w-full', className)} {...props} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
