import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Dropdown — click-triggered menu anchored to a trigger element.
 *
 *   <Dropdown trigger={<Button>Menu</Button>}>
 *     <Dropdown.Item onClick={...}>Edit</Dropdown.Item>
 *     <Dropdown.Separator />
 *     <Dropdown.Item destructive>Delete</Dropdown.Item>
 *   </Dropdown>
 */
export default function Dropdown({ trigger, children, align = 'start', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen((v) => !v)} className="contents">
        {trigger}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute z-50 mt-2 min-w-[12rem] origin-top rounded-xl border border-line bg-surface-floating p-1.5 shadow-overlay',
              align === 'end' ? 'right-0' : 'left-0',
              className
            )}
            onClick={() => setOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Item({ children, destructive = false, icon, className = '', ...props }) {
  return (
    <button
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition focus:outline-none',
        destructive
          ? 'text-rose-400 hover:bg-rose-500/10'
          : 'text-slate-200 hover:bg-white/[0.06] hover:text-white',
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
      {children}
    </button>
  );
}

function Separator() {
  return <div className="my-1.5 h-px bg-line" />;
}

function Label({ children }) {
  return <div className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">{children}</div>;
}

Dropdown.Item = Item;
Dropdown.Separator = Separator;
Dropdown.Label = Label;
