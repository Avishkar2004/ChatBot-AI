import React from 'react';
import { cn } from '../../lib/cn';

const sizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-7xl',
  xl: 'max-w-[88rem]',
  full: 'max-w-none',
};

export default function Container({ className = '', size = 'lg', children, ...props }) {
  return (
    <div
      className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', sizes[size] || sizes.lg, className)}
      {...props}
    >
      {children}
    </div>
  );
}
