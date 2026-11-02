'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Layers,
  FileText,
  Search,
  Trash2,
  Settings,
  Plus,
  ChevronDown,
  Check,
  Sparkles,
  X,
} from 'lucide-react';
import WorkspaceModal from '@/components/workspace/WorkspaceModal';

export const Sidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useAuth();
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);

  const navItems = [
    { label: 'All Documents', href: '/dashboard', icon: FileText },
    { label: 'Search', href: '/search', icon: Search },
    { label: 'Trash', href: '/trash', icon: Trash2 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#020C1B] border-r border-[#334155] flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#334155]/60">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white shadow-glow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#F8FAFC]">
                SyncSpace
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Switcher */}
        <div className="p-3 border-b border-[#334155]/40 relative">
          <button
            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-[#111F33] hover:bg-[#17263D] border border-[#334155] text-left transition-colors"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-6 h-6 rounded bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#60A5FA] flex-shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold text-[#F8FAFC] truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] flex-shrink-0" />
          </button>

          {isWorkspaceMenuOpen && (
            <div
              className="absolute left-3 right-3 top-14 bg-[#111F33] border border-[#334155] rounded-xl shadow-card py-1.5 z-50 animate-fade-in"
              onMouseLeave={() => setIsWorkspaceMenuOpen(false)}
            >
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                Your Workspaces
              </div>
              <div className="max-h-48 overflow-y-auto">
                {workspaces.map((ws) => (
                  <button
                    key={ws._id}
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      setIsWorkspaceMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                      currentWorkspace?._id === ws._id
                        ? 'bg-[#2563EB]/20 text-[#60A5FA] font-medium'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {currentWorkspace?._id === ws._id && (
                      <Check className="w-3.5 h-3.5 text-[#60A5FA] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-[#334155]/60 mt-1 pt-1">
                <button
                  onClick={() => {
                    setIsWorkspaceMenuOpen(false);
                    setIsCreateWsOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#60A5FA] hover:bg-[#1E293B] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose && onClose()}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-glow-sm'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111F33]'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Workspace Quick Link */}
        {currentWorkspace && (
          <div className="p-3 border-t border-[#334155]/40">
            <Link
              href={`/workspace/${currentWorkspace._id}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111F33] transition-colors"
            >
              <Layers className="w-4 h-4 text-[#60A5FA]" />
              <span className="truncate">Manage Workspace</span>
            </Link>
          </div>
        )}
      </aside>

      <WorkspaceModal
        isOpen={isCreateWsOpen}
        onClose={() => setIsCreateWsOpen(false)}
      />
    </>
  );
};

export default Sidebar;

