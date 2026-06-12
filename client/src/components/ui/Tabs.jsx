import React, { createContext, useContext, useId, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const TabsCtx = createContext(null);

/**
 * Tabs — animated segmented navigation with a sliding active indicator.
 *
 *   <Tabs defaultValue="overview">
 *     <Tabs.List>
 *       <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
 *       <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
 *     </Tabs.List>
 *     <Tabs.Panel value="overview">…</Tabs.Panel>
 *     <Tabs.Panel value="settings">…</Tabs.Panel>
 *   </Tabs>
 *
 * Controlled via `value` + `onValueChange`, or uncontrolled via `defaultValue`.
 */
export default function Tabs({ value, defaultValue, onValueChange, className = '', children }) {
  const [internal, setInternal] = useState(defaultValue);
  const active = value !== undefined ? value : internal;
  const groupId = useId();

  const setActive = (v) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <TabsCtx.Provider value={{ active, setActive, groupId }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

function List({ className = '', children }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-line bg-surface-sunken/60 p-1',
        className
      )}
    >
      {children}
    </div>
  );
}

function Trigger({ value, children, className = '' }) {
  const ctx = useContext(TabsCtx);
  const isActive = ctx.active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => ctx.setActive(value)}
      className={cn(
        'relative z-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
        isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200',
        className
      )}
    >
      {isActive && (
        <motion.span
          layoutId={`tab-indicator-${ctx.groupId}`}
          className="absolute inset-0 -z-10 rounded-lg bg-white/[0.08] shadow-subtle"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      {children}
    </button>
  );
}

function Panel({ value, className = '', children }) {
  const ctx = useContext(TabsCtx);
  if (ctx.active !== value) return null;
  return (
    <motion.div
      role="tabpanel"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

Tabs.List = List;
Tabs.Trigger = Trigger;
Tabs.Panel = Panel;
