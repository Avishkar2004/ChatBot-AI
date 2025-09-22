import React from 'react';

const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-brand-600 hover:bg-brand-500 text-white",
  secondary: "bg-white/5 hover:bg-white/10 text-gray-100 border border-white/10",
  ghost: "hover:bg-white/5 text-gray-200",
  danger: "bg-rose-600 hover:bg-rose-500 text-white",
};

export default function Button({ as: Comp = 'button', variant = 'primary', className = '', ...props }) {
  return <Comp className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props} />;
}


