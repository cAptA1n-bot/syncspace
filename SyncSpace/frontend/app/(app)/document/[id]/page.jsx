'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { documentService } from '@/services/document.service';
import { aiService } from '@/services/ai.service';
import TipTapEditor from '@/components/editor/TipTapEditor';
import ShareModal from '@/components/workspace/ShareModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import {
  ArrowLeft,
  Share2,
  Star,
  Trash2,
  Sparkles,
  Copy,
  Check,
  FileText,
  ListTodo,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params?.id;

  const [doc, setDoc] = useState(null);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [summaryType, setSummaryType] = useState('medium');
  const [summaryResult, setSummaryResult] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const fetchDocument = useCallback(async () => {
    if (!documentId) return;
    try {
      setLoading(true);
      const res = await documentService.getDocument(documentId);
      setDoc(res?.document);
      setTitle(res?.document?.title || 'Untitled Document');
    } catch (err) {
      console.error('Failed to load document:', err);
      toast.error('Failed to load document or access denied');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [documentId, router]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleTitleChange = async (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
  };

  const handleTitleBlur = async () => {
    if (!doc || title === doc.title) return;
    try {
      await documentService.updateMeta(doc._id, { title: title.trim() || 'Untitled Document' });
    } catch (err) {
      toast.error('Failed to update title');
    }
  };

  const handleToggleFavorite = async () => {
    if (!doc) return;
    try {
      const updated = await documentService.updateMeta(doc._id, {
        isFavorited: !doc.isFavorited,
      });
      setDoc((prev) => ({ ...prev, isFavorited: !prev.isFavorited }));
      toast.success(doc.isFavorited ? 'Removed from favorites' : 'Added to favorites');
    } catch (err) {
      toast.error('Failed to update favorite');
    }
  };

  const handleDelete = async () => {
    if (!doc) return;
    if (!window.confirm('Are you sure you want to move this document to trash?')) return;
    try {
      await documentService.deleteDocument(doc._id);
      toast.success('Moved to trash');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleSaveContent = async ({ content }) => {
    if (!doc) return;
    await documentService.saveContent(doc._id, {
      content,
      revision: (doc.revision || 0) + 1,
    });
  };

  const handleGenerateSummary = async (type = summaryType) => {
    if (!documentId) return;
    try {
      setIsGeneratingAi(true);
      setSummaryType(type);
      const summary = await aiService.summarize(documentId, type);
      setSummaryResult(summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI summary');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const copySummaryText = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setCopiedSummary(true);
    toast.success('Summary copied');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner text="Opening document..." size="lg" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="flex flex-col h-full bg-[#0F172A]">
      {/* Document Top Bar */}
      <div className="h-14 border-b border-[#334155] px-4 sm:px-6 flex items-center justify-between bg-[#111F33]/70 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3 flex-1 mr-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            placeholder="Untitled Document"
            className="text-base font-semibold text-[#F8FAFC] bg-transparent border-b border-transparent hover:border-[#334155] focus:border-[#2563EB] focus:outline-none px-1.5 py-0.5 rounded transition-all w-full max-w-md truncate"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            icon={Star}
            onClick={handleToggleFavorite}
            className={doc.isFavorited ? 'text-amber-400' : 'text-[#94A3B8]'}
            title="Favorite"
          />

          <Button
            variant="ghost"
            size="sm"
            icon={Sparkles}
            onClick={() => {
              setIsAiOpen(true);
              if (!summaryResult) handleGenerateSummary('medium');
            }}
            className="text-[#60A5FA] hover:text-[#93C5FD]"
          >
            <span className="hidden sm:inline">AI Summary</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Share2}
            onClick={() => setIsShareOpen(true)}
          >
            <span className="hidden sm:inline">Share</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={handleDelete}
            className="text-[#64748B] hover:text-red-400"
            title="Delete"
          />
        </div>
      </div>

      {/* TipTap Rich Text Collaborative Editor */}
      <div className="flex-1 overflow-y-auto">
        <TipTapEditor
          documentId={doc._id}
          initialContent={doc.content}
          onSave={handleSaveContent}
          onOpenAiSummary={() => {
            setIsAiOpen(true);
            if (!summaryResult) handleGenerateSummary('medium');
          }}
        />
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        documentId={doc._id}
      />

      {/* AI Summary Modal */}
      <Modal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        title="AI Document Summary"
        description="Powered by Gemini — extract key insights instantly."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#334155]/60 overflow-x-auto">
            {[
              { id: 'short', label: 'Brief TL;DR' },
              { id: 'medium', label: 'Executive Summary' },
              { id: 'detailed', label: 'Detailed Overview' },
              { id: 'action_items', label: 'Action Items' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleGenerateSummary(tab.id)}
                disabled={isGeneratingAi}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  summaryType === tab.id
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[160px] p-4 rounded-xl bg-[#0F172A] border border-[#334155] text-sm text-[#F8FAFC] leading-relaxed whitespace-pre-wrap">
            {isGeneratingAi ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <Sparkles className="w-6 h-6 animate-spin text-[#60A5FA]" />
                <p className="text-xs text-[#94A3B8]">Analyzing document and generating summary...</p>
              </div>
            ) : summaryResult ? (
              summaryResult
            ) : (
              <p className="text-xs text-[#64748B] italic">No summary generated yet.</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={Sparkles}
              isLoading={isGeneratingAi}
              onClick={() => handleGenerateSummary(summaryType)}
            >
              Regenerate
            </Button>

            {summaryResult && (
              <Button
                variant="primary"
                size="sm"
                icon={copiedSummary ? Check : Copy}
                onClick={copySummaryText}
              >
                {copiedSummary ? 'Copied' : 'Copy Summary'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

