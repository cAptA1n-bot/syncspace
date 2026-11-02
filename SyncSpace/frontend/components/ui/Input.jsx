'use client';

import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-[#64748B] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          id={inputId}
          ref={ref}
          type={type}
          className={`w-full bg-[#1E293B] border ${
            error ? 'border-red-500 focus:border-red-500' : 'border-[#334155] focus:border-[#2563EB]'
          } rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] transition-colors focus:outline-none focus:ring-1 focus:ring-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed ${
            Icon ? 'pl-9' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;

