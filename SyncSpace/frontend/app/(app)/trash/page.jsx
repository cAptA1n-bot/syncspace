'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { documentService } from '@/services/document.service';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/ui/Button';
import { Trash2, RotateCcw, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function TrashPage() {
  const [trashedDocs, setTrashedDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await documentService.getTrashDocuments();
      setTrashedDocs(docs);
    } catch (err) {
      console.error('Failed to load trash:', err);
      toast.error('Failed to load trash');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (doc) => {
    try {
      await documentService.restoreDocument(doc._id);
      toast.success(`"${doc.title || 'Document'}" restored`);
      fetchTrash();
    } catch (err) {
      toast.error('Failed to restore document');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between pb-6 border-b border-[#334155]/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">Trash</h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Documents in trash can be restored back to your workspace.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading trash..." />
      ) : trashedDocs.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Deleted documents will appear here before being permanently removed."
        />
      ) : (
        <div className="space-y-3">
          {trashedDocs.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center justify-between p-4 rounded-xl bg-[#111F33] border border-[#334155] shadow-card"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC]">
                    {doc.title || 'Untitled Document'}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Deleted{' '}
                    {doc.deletedAt
                      ? formatDistanceToNow(new Date(doc.deletedAt), { addSuffix: true })
                      : 'recently'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => handleRestore(doc)}
                >
                  Restore
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

