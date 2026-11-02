'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Users,
  Zap,
  Shield,
  ArrowRight,
  FileText,
  Layers,
  Bot,
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="h-20 border-b border-[#334155]/60 px-6 sm:px-12 flex items-center justify-between backdrop-blur-md sticky top-0 z-50 bg-[#0F172A]/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#F8FAFC]">
            SyncSpace
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button variant="primary" size="md">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="md">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="md">
                  Get Started Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E293B] border border-[#334155] text-xs font-medium text-[#60A5FA] mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Write · Collaborate · Stay in Sync</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#F8FAFC] max-w-4xl leading-tight sm:leading-none mb-6">
          The collaborative workspace built for{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] via-[#60A5FA] to-[#38BDF8]">
            speed and focus.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-[#94A3B8] max-w-2xl mb-10">
          SyncSpace combines block-based rich text, real-time multi-user editing, team workspaces, secure sharing, and AI-driven document insights.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link href="/register">
            <Button variant="primary" size="lg" className="px-8 shadow-glow">
              Start Writing — It's Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg" className="px-8">
              Sign In to Your Space
            </Button>
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          <div className="bg-[#111F33] border border-[#334155] rounded-2xl p-6 shadow-card hover:border-[#475569] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#60A5FA] mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">
              Real-Time Collaboration
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Type together with zero conflict. See collaborator cursors, presence avatars, and live updates synchronized through WebSockets.
            </p>
          </div>

          <div className="bg-[#111F33] border border-[#334155] rounded-2xl p-6 shadow-card hover:border-[#475569] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#60A5FA] mb-4">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">
              Flexible Workspaces
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Organize company projects, private personal notes, or team spaces with granular role-based permissions (owner, editor, viewer).
            </p>
          </div>

          <div className="bg-[#111F33] border border-[#334155] rounded-2xl p-6 shadow-card hover:border-[#475569] transition-all">
            <div className="w-12 h-12 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#60A5FA] mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">
              AI Document Summaries
            </h3>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Generate executive summaries, key bullet points, and extracted action items from any document with a single click.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#334155]/60 py-8 px-6 text-center text-xs text-[#64748B]">
        <p>© {new Date().getFullYear()} SyncSpace. Modern Blue Dark Theme.</p>
      </footer>
    </div>
  );
}

