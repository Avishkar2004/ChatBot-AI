import React from 'react';
import { cn } from '../../lib/cn';

/**
 * Page — the shell for every routed view.
 *
 * Subtracts the 4rem navbar so a page can centre its content vertically
 * without guessing at offsets. Deliberately no `overflow-hidden`: it would
 * clip the sticky navbar and any popover that escapes its card.
 */
const Page = ({ children, className = '' }) => (
  <div className={cn('min-h-[calc(100vh-4rem)]', className)}>{children}</div>
);

export default Page;
