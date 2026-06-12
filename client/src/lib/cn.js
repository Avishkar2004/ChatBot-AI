/**
 * Tiny className combiner — joins truthy values with a space.
 * Accepts strings, arrays, and objects ({ 'class': boolean }).
 *
 *   cn('a', cond && 'b', { c: isActive }, ['d', 'e'])
 *
 * Intentionally dependency-free (no clsx / tailwind-merge) to keep the
 * design system lightweight. Order is preserved; de-duping is the caller's job.
 */
export function cn(...args) {
  const out = [];
  for (const arg of args) {
    if (!arg) continue;
    if (typeof arg === 'string' || typeof arg === 'number') {
      out.push(arg);
    } else if (Array.isArray(arg)) {
      const inner = cn(...arg);
      if (inner) out.push(inner);
    } else if (typeof arg === 'object') {
      for (const key in arg) {
        if (arg[key]) out.push(key);
      }
    }
  }
  return out.join(' ');
}

export default cn;
