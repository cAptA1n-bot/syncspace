'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import Button from '@/components/ui/Button';

export const EmptyState = ({
  icon: Icon = FileText,
  title = 'No items found',
  description = 'Get started by creating your first item.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#111F33]/40 border border-[#334155]/50 border-dashed rounded-xl max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#60A5FA] mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#F8FAFC] mb-1">{title}</h3>
      <p className="text-sm text-[#94A3B8] max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;

