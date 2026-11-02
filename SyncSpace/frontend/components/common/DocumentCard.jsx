'use client';

import React from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Star, Trash2, Share2, MoreVertical } from 'lucide-react';

export const DocumentCard = ({
  document: doc,
  onToggleFavorite,
  onDelete,
  onShare,
}) => {
  const updatedAt = doc.updatedAt
    ? formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })
    : 'recently';

  return (
    <div className="group relative bg-[#111F33] hover:bg-[#17263D] border border-[#334155] hover:border-[#475569] rounded-xl p-4 transition-all duration-200 flex flex-col justify-between shadow-card">
      <Link href={`/document/${doc._id}`} className="block flex-1 mb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#60A5FA] group-hover:bg-[#2563EB]/10 transition-colors">
            {doc.icon ? (
              <span className="text-xl">{doc.icon}</span>
            ) : (
              <FileText className="w-5 h-5 text-[#3B82F6]" />
            )}
          </div>
        </div>

        <h4 className="text-sm font-semibold text-[#F8FAFC] group-hover:text-[#60A5FA] line-clamp-1 transition-colors">
          {doc.title || 'Untitled Document'}
        </h4>

        <p className="text-xs text-[#64748B] mt-1">
          Updated {updatedAt}
        </p>
      </Link>

      <div className="flex items-center justify-between pt-3 border-t border-[#334155]/60 text-xs text-[#94A3B8]">
        <div className="flex items-center gap-1.5">
          {doc.collaborators?.length > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#1E293B] text-[#94A3B8] border border-[#334155]">
              {doc.collaborators.length + 1} users
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite(doc);
              }}
              title={doc.isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-1.5 rounded-md hover:bg-[#1E293B] transition-colors ${
                doc.isFavorited ? 'text-amber-400' : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {onShare && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onShare(doc);
              }}
              title="Share"
              className="p-1.5 rounded-md text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(doc);
              }}
              title="Move to trash"
              className="p-1.5 rounded-md text-[#64748B] hover:text-red-400 hover:bg-[#1E293B] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentCard;

