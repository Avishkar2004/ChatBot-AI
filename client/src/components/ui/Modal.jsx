import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import Portal from './Portal';

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

/**
 * Modal — centered dialog with backdrop, escape-to-close, scroll lock and a
 * lightweight focus trap. Animated via framer-motion.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  showClose = true,
  className = '',
  children,
  footer,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the dialog
    const t = setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
    };
  }, [open, onClose]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={typeof title === 'string' ? title : undefined}
              tabIndex={-1}
              className={cn(
                'relative w-full surface-elevated rounded-2xl shadow-overlay outline-none',
                widths[size] || widths.md,
                className
              )}
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 8 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            >
              {showClose && (
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="focus-ring absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
              {(title || description) && (
                <div className="px-6 pt-6">
                  {title && <h2 className="font-display text-lg font-semibold text-white">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
                </div>
              )}
              <div className="px-6 py-5">{children}</div>
              {footer && (
                <div className="flex items-center justify-end gap-3 border-t border-line px-6 py-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
