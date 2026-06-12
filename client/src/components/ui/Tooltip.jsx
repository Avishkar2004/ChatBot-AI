import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const sidePos = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const sideMotion = {
  top: { y: 4 },
  bottom: { y: -4 },
  left: { x: 4 },
  right: { x: -4 },
};

/**
 * Tooltip — hover/focus label. Wraps a single trigger child.
 *   <Tooltip label="Copy"><button>…</button></Tooltip>
 */
export default function Tooltip({ label, side = 'top', delay = 150, children, className = '' }) {
  const [open, setOpen] = useState(false);
  let timer;

  const show = () => {
    timer = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    clearTimeout(timer);
    setOpen(false);
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      <AnimatePresence>
        {open && label && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, ...sideMotion[side] }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, ...sideMotion[side] }}
            transition={{ duration: 0.12 }}
            className={cn(
              'pointer-events-none absolute z-[120] whitespace-nowrap rounded-lg border border-line bg-surface-floating px-2.5 py-1.5 text-xs font-medium text-slate-100 shadow-overlay',
              sidePos[side] || sidePos.top,
              className
            )}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
