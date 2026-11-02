'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white shadow-sm hover:shadow-glow-sm focus-visible:ring-[#60A5FA]',
    secondary: 'bg-[#1E293B] hover:bg-[#27354A] text-[#F8FAFC] border border-[#334155] focus-visible:ring-[#60A5FA]',
    outline: 'border border-[#334155] hover:border-[#475569] hover:bg-[#1E293B]/60 text-[#F8FAFC] focus-visible:ring-[#60A5FA]',
    ghost: 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/70 focus-visible:ring-[#60A5FA]',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white focus-visible:ring-red-400',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-5 py-2.5 gap-2.5',
    icon: 'p-2 text-sm',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
};

export default Button;

