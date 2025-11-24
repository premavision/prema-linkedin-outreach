import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
  
  const variants = {
    default: 'border-transparent bg-slate-900 text-white hover:bg-slate-800',
    secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200',
    destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
    outline: 'text-slate-950',
    success: 'border-transparent bg-green-500 text-white hover:bg-green-600',
    warning: 'border-transparent bg-yellow-500 text-white hover:bg-yellow-600',
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />
  );
}

