'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { documentService } from '@/services/document.service';
import DocumentCard from '@/components/common/DocumentCard';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ShareModal from '@/components/workspace/ShareModal';
import Button from '@/components/ui/Button';
import { Plus, Clock, Star, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const { user, currentWorkspace } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [activeShareDocId, setActiveShareDocId] = useState(null);

  const fetchDocs = useCallback(async () => {
    if (!currentWorkspace?._id) return;
    try {
      setLoading(true);
      const [all, recent] = await Promise.all([
        documentService.getDocuments(currentWorkspace._id),
        documentService.getRecentDocuments(),
      ]);
      setDocuments(all);
      setRecentDocs(recent);
    } catch (err) {
      console.error('Failed to load documents:', err);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [currentWorkspace?._id]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleCreateDocument = async () => {
    if (!currentWorkspace?._id) {
      toast.error('Please select a workspace');
      return;
    }
    try {
      setIsCreating(true);
      const newDoc = await documentService.createDocument({
        workspaceId: currentWorkspace._id,
        title: 'Untitled Document',
      });
      toast.success('Document created');
      router.push(`/document/${newDoc._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleFavorite = async (doc) => {
    try {
      await documentService.updateMeta(doc._id, {
        isFavorited: !doc.isFavorited,
      });
      fetchDocs();
    } catch (err) {
      toast.error('Failed to update favorite');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Move "${doc.title || 'Untitled'}" to trash?`)) return;
    try {
      await documentService.deleteDocument(doc._id);
      toast.success('Moved to trash');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const favorites = documents.filter((d) => d.isFavorited);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#334155]/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Workspace: <span className="text-[#60A5FA] font-medium">{currentWorkspace?.name}</span>
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          isLoading={isCreating}
          onClick={handleCreateDocument}
        >
          New Document
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading documents..." />
      ) : (
        <div className="space-y-10">
          {/* Favorites (if any) */}
          {favorites.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-amber-400 fill-current" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Favorites
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favorites.map((doc) => (
                  <DocumentCard
                    key={doc._id}
                    document={doc}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDelete}
                    onShare={(d) => setActiveShareDocId(d._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Documents */}
          {recentDocs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-[#60A5FA]" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
                  Recently Viewed
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentDocs.slice(0, 4).map((doc) => (
                  <DocumentCard
                    key={doc._id}
                    document={doc}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDelete}
                    onShare={(d) => setActiveShareDocId(d._id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Workspace Documents */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#3B82F6]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
                All Documents
              </h2>
            </div>

            {documents.length === 0 ? (
              <EmptyState
                title="No documents yet"
                description="Start collaborating by creating your first document in this workspace."
                actionLabel="Create Document"
                onAction={handleCreateDocument}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc._id}
                    document={doc}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDelete}
                    onShare={(d) => setActiveShareDocId(d._id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        isOpen={!!activeShareDocId}
        documentId={activeShareDocId}
        onClose={() => setActiveShareDocId(null)}
      />
    </div>
  );
}

