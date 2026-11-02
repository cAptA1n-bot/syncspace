'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { searchService } from '@/services/search.service';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Search, FileText, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SearchPage() {
  const { workspaces, currentWorkspace } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const docs = await searchService.search(
          query.trim(),
          selectedWorkspaceId || undefined
        );
        setResults(docs);
        setHasSearched(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedWorkspaceId]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Search Documents
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
          Search document titles and content across your accessible workspaces.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Type keyword or phrase to search..."
            icon={Search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <select
          value={selectedWorkspaceId}
          onChange={(e) => setSelectedWorkspaceId(e.target.value)}
          className="bg-[#1E293B] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
        >
          <option value="">All Workspaces</option>
          {workspaces.map((ws) => (
            <option key={ws._id} value={ws._id}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Searching..." />
      ) : hasSearched && results.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No documents found"
          description={`No results matching "${query}". Try different keywords.`}
        />
      ) : (
        <div className="space-y-3">
          {results.map((doc) => (
            <Link
              key={doc._id}
              href={`/document/${doc._id}`}
              className="flex items-center justify-between p-4 rounded-xl bg-[#111F33] hover:bg-[#17263D] border border-[#334155] hover:border-[#475569] transition-all group shadow-card"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#60A5FA]">
                  {doc.icon ? (
                    <span className="text-lg">{doc.icon}</span>
                  ) : (
                    <FileText className="w-5 h-5 text-[#3B82F6]" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#F8FAFC] group-hover:text-[#60A5FA] transition-colors">
                    {doc.title || 'Untitled Document'}
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {doc.updatedAt
                      ? `Updated ${formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}`
                      : 'Updated recently'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-[#F8FAFC] group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

