import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const STATES = {
  thinking: { label: 'Thinking', color: 'text-brand-300', ring: 'border-brand-400' },
  searching: { label: 'Searching', color: 'text-electric-400', ring: 'border-electric-400' },
  analyzing: { label: 'Analyzing', color: 'text-cyan-400', ring: 'border-cyan-400' },
  responding: { label: 'Responding', color: 'text-violet-400', ring: 'border-violet-400' },
};

/**
 * ThinkingIndicator — replaces plain typing dots with a neural-pulse + a
 * labelled reasoning state. Pass `state` to reflect the agent's current phase.
 */
export default function ThinkingIndicator({ state = 'thinking', label, className = '' }) {
  const cfg = STATES[state] || STATES.thinking;
  return (
    <div className={cn('inline-flex items-center gap-3', className)}>
      <span className="relative grid h-7 w-7 place-items-center">
        <motion.span
          className={cn('absolute inset-0 rounded-full border', cfg.ring)}
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        />
        <span className={cn('h-2.5 w-2.5 rounded-full bg-current', cfg.color)} />
      </span>
      <span className="flex items-center gap-1.5">
        <span className={cn('text-sm font-medium', cfg.color)}>{label || cfg.label}</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={cn('h-1 w-1 rounded-full bg-current', cfg.color)}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </span>
      </span>
    </div>
  );
}
