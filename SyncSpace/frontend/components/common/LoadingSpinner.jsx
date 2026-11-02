'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ text = 'Loading...', size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className={`${sizes[size] || sizes.md} animate-spin text-[#2563EB]`} />
      {text && <p className="text-sm font-medium text-[#94A3B8]">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="py-12 flex justify-center">{content}</div>;
};

export default LoadingSpinner;

