import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import Portal from './Portal';

const sideConfig = {
  right: {
    panel: 'right-0 top-0 h-full w-full max-w-md border-l',
    initial: { x: '100%' },
    animate: { x: 0 },
  },
  left: {
    panel: 'left-0 top-0 h-full w-full max-w-md border-r',
    initial: { x: '-100%' },
    animate: { x: 0 },
  },
  bottom: {
    panel: 'bottom-0 left-0 w-full max-h-[85vh] rounded-t-3xl border-t',
    initial: { y: '100%' },
    animate: { y: 0 },
  },
};

/**
 * Drawer — slide-in panel from a screen edge. Great for mobile nav, filters,
 * and contextual panels.
 */
export default function Drawer({ open, onClose, side = 'right', title, className = '', children }) {
  const cfg = sideConfig[side] || sideConfig.right;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100]">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className={cn(
                'absolute bg-surface-floating border-line shadow-overlay',
                cfg.panel,
                className
              )}
              initial={cfg.initial}
              animate={cfg.animate}
              exit={cfg.initial}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {title && (
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <h2 className="font-display font-semibold text-white">{title}</h2>
                  <button
                    onClick={onClose}
                    aria-label="Close"
                    className="focus-ring grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <div className="h-full overflow-y-auto p-5">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
