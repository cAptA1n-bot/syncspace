'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { shareService } from '@/services/share.service';
import { Mail, Link as LinkIcon, Trash2, Check, Copy, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export const ShareModal = ({ isOpen, onClose, documentId }) => {
  const [data, setData] = useState(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadCollaborators = async () => {
    if (!documentId) return;
    try {
      setIsLoading(true);
      const res = await shareService.getCollaborators(documentId);
      setData(res);
    } catch (err) {
      console.error('Failed to load sharing info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      loadCollaborators();
    }
  }, [isOpen, documentId]);

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsSharing(true);
      await shareService.shareDocument(documentId, { email: email.trim(), role });
      toast.success(`Shared with ${email}`);
      setEmail('');
      await loadCollaborators();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to share document');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevoke = async (userId) => {
    try {
      await shareService.revokeShare(documentId, userId);
      toast.success('Access revoked');
      await loadCollaborators();
    } catch (err) {
      toast.error('Failed to revoke access');
    }
  };

  const handleToggleLink = async () => {
    const currentEnabled = !!data?.shareLink?.enabled;
    try {
      const updated = await shareService.updateShareLink(documentId, {
        enabled: !currentEnabled,
        role: data?.shareLink?.role || 'viewer',
      });
      setData((prev) => ({ ...prev, shareLink: updated }));
      toast.success(!currentEnabled ? 'Public link enabled' : 'Public link disabled');
    } catch (err) {
      toast.error('Failed to update share link');
    }
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/document/${documentId}?token=${data?.shareLink?.token || ''}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Document"
      description="Collaborate with team members in real-time."
    >
      <div className="space-y-6">
        {/* Share by email */}
        <form onSubmit={handleShare} className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Enter email address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-xs font-medium text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button type="submit" variant="primary" size="md" isLoading={isSharing}>
            Invite
          </Button>
        </form>

        {/* Share Link Toggle */}
        <div className="p-3.5 rounded-xl bg-[#0F172A] border border-[#334155]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center text-[#60A5FA]">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F8FAFC]">Link Sharing</p>
              <p className="text-[11px] text-[#94A3B8]">
                {data?.shareLink?.enabled
                  ? 'Anyone with the link can view'
                  : 'Only invited collaborators can access'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {data?.shareLink?.enabled && (
              <Button
                variant="outline"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={copyShareLink}
              >
                {copied ? 'Copied' : 'Copy Link'}
              </Button>
            )}
            <button
              onClick={handleToggleLink}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                data?.shareLink?.enabled ? 'bg-[#2563EB]' : 'bg-[#334155]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  data?.shareLink?.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Collaborators list */}
        <div>
          <h4 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2.5">
            People with access
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {/* Owner */}
            {data?.owner && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#1E293B]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold">
                    {data.owner.firstName?.[0] || 'O'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#F8FAFC]">
                      {data.owner.firstName} {data.owner.lastName}
                    </p>
                    <p className="text-[11px] text-[#64748B]">{data.owner.email}</p>
                  </div>
                </div>
                <span className="text-[11px] font-medium text-[#60A5FA] px-2 py-0.5 rounded bg-[#2563EB]/10 border border-[#2563EB]/20">
                  Owner
                </span>
              </div>
            )}

            {/* Invited collaborators */}
            {data?.collaborators?.map((collab) => (
              <div
                key={collab.user?._id || collab._id}
                className="flex items-center justify-between p-2 rounded-lg bg-[#1E293B]/40 hover:bg-[#1E293B] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#334155] text-[#F8FAFC] flex items-center justify-center text-xs font-bold">
                    {collab.user?.firstName?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#F8FAFC]">
                      {collab.user?.firstName} {collab.user?.lastName}
                    </p>
                    <p className="text-[11px] text-[#64748B]">{collab.user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#94A3B8] capitalize">
                    {collab.role}
                  </span>
                  <button
                    onClick={() => handleRevoke(collab.user?._id)}
                    className="p-1 rounded text-[#64748B] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove access"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShareModal;

