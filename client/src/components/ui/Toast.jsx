import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import Portal from './Portal';

const ToastCtx = createContext(null);

const config = {
  success: { icon: CheckCircle2, accent: 'text-emerald-400', bar: 'bg-emerald-400' },
  error: { icon: XCircle, accent: 'text-rose-400', bar: 'bg-rose-400' },
  warning: { icon: AlertTriangle, accent: 'text-amber-400', bar: 'bg-amber-400' },
  info: { icon: Info, accent: 'text-electric-400', bar: 'bg-electric-400' },
};

let counter = 0;

/**
 * ToastProvider — mount once near the app root. Exposes useToast().
 *   const toast = useToast();
 *   toast.success('Saved', 'Your project was updated');
 */
export function ToastProvider({ children, max = 4 }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (type, title, description, duration = 4500) => {
      counter += 1;
      const id = counter;
      setToasts((list) => [...list, { id, type, title, description }].slice(-max));
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss, max]
  );

  const api = {
    push,
    dismiss,
    success: (t, d, dur) => push('success', t, d, dur),
    error: (t, d, dur) => push('error', t, d, dur),
    warning: (t, d, dur) => push('warning', t, d, dur),
    info: (t, d, dur) => push('info', t, d, dur),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <Portal>
        <div className="pointer-events-none fixed bottom-0 right-0 z-[200] flex w-full max-w-sm flex-col gap-3 p-4">
          <AnimatePresence initial={false}>
            {toasts.map((t) => {
              const c = config[t.type] || config.info;
              const Icon = c.icon;
              return (
                <motion.div
                  key={t.id}
                  layout
                  initial={{ opacity: 0, x: 40, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 40, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                  className="pointer-events-auto relative overflow-hidden rounded-xl border border-line bg-surface-floating shadow-overlay"
                >
                  <div className={cn('absolute inset-y-0 left-0 w-1', c.bar)} />
                  <div className="flex items-start gap-3 p-4 pl-5">
                    <Icon size={18} className={cn('mt-0.5 shrink-0', c.accent)} />
                    <div className="min-w-0 flex-1">
                      {t.title && <p className="text-sm font-semibold text-white">{t.title}</p>}
                      {t.description && <p className="mt-0.5 text-sm text-slate-400">{t.description}</p>}
                    </div>
                    <button
                      onClick={() => dismiss(t.id)}
                      aria-label="Dismiss"
                      className="focus-ring -mr-1 -mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </Portal>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}
