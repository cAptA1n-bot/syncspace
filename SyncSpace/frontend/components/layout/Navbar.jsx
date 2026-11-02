'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { documentService } from '@/services/document.service';
import Button from '@/components/ui/Button';
import { Search, Plus, User, LogOut, Settings, Sparkles, Menu } from 'lucide-react';
import toast from 'react-hot-toast';

export const Navbar = ({ onToggleSidebar }) => {
  const router = useRouter();
  const { user, logout, currentWorkspace } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateDocument = async () => {
    if (!currentWorkspace?._id) {
      toast.error('Please select a workspace first');
      return;
    }
    try {
      setIsCreating(true);
      const doc = await documentService.createDocument({
        workspaceId: currentWorkspace._id,
        title: 'Untitled Document',
      });
      toast.success('Document created');
      router.push(`/document/${doc._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create document');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <header className="h-16 border-b border-[#334155] bg-[#0F172A]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
          <span className="font-medium text-[#F8FAFC]">
            {currentWorkspace?.name || 'Workspace'}
          </span>
          {currentWorkspace?.isPersonal && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#1E293B] text-[#60A5FA] border border-[#334155]">
              Personal
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/search"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#27354A] border border-[#334155] text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search documents...</span>
          <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-[#0F172A] border border-[#334155] rounded text-[#64748B]">
            /
          </kbd>
        </Link>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          isLoading={isCreating}
          onClick={handleCreateDocument}
        >
          <span className="hidden sm:inline">New Document</span>
        </Button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full border border-[#334155] bg-[#1E293B] hover:border-[#60A5FA] transition-colors"
            aria-label="User account"
          >
            <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-semibold text-xs">
              {user?.firstName?.[0] || 'U'}
            </div>
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-[#111F33] border border-[#334155] rounded-xl shadow-card py-1.5 z-50 animate-fade-in"
              onMouseLeave={() => setIsMenuOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-[#334155]/60 mb-1">
                <p className="text-xs font-semibold text-[#F8FAFC] truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-[#64748B] truncate">{user?.email}</p>
              </div>

              <Link
                href="/settings"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

