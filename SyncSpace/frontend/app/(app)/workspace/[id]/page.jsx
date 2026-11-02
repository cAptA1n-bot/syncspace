'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { workspaceService } from '@/services/workspace.service';
import { documentService } from '@/services/document.service';
import { useAuth } from '@/context/AuthContext';
import DocumentCard from '@/components/common/DocumentCard';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import {
  Layers,
  Users,
  Plus,
  UserPlus,
  Trash2,
  FileText,
  Mail,
  Shield,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.id;
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState(null);
  const [memberRole, setMemberRole] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [isInviting, setIsInviting] = useState(false);

  const fetchWorkspaceData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const [wsData, docs, memberList] = await Promise.all([
        workspaceService.getWorkspace(workspaceId),
        documentService.getDocuments(workspaceId),
        workspaceService.getMembers(workspaceId).catch(() => []),
      ]);
      setWorkspace(wsData?.workspace);
      setMemberRole(wsData?.memberRole);
      setDocuments(docs);
      setMembers(memberList || []);
    } catch (err) {
      console.error('Failed to load workspace:', err);
      toast.error('Failed to load workspace');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, router]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const handleCreateDocument = async () => {
    try {
      const doc = await documentService.createDocument({
        workspaceId,
        title: 'Untitled Document',
      });
      toast.success('Document created');
      router.push(`/document/${doc._id}`);
    } catch (err) {
      toast.error('Failed to create document');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setIsInviting(true);
      await workspaceService.addMember(workspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success(`Invited ${inviteEmail}`);
      setInviteEmail('');
      setIsInviteOpen(false);
      fetchWorkspaceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberUserId, memberName) => {
    if (!window.confirm(`Remove ${memberName || 'this member'} from the workspace?`)) return;
    try {
      await workspaceService.removeMember(workspaceId, memberUserId);
      toast.success('Member removed');
      fetchWorkspaceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <LoadingSpinner text="Loading workspace..." size="lg" />
      </div>
    );
  }

  if (!workspace) return null;

  const isAdminOrOwner = ['owner', 'admin'].includes(memberRole);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#334155]/60">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#60A5FA]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
                {workspace.name}
              </h1>
              {workspace.isPersonal && (
                <span className="px-2 py-0.5 rounded text-xs bg-[#1E293B] text-[#60A5FA] border border-[#334155]">
                  Personal Space
                </span>
              )}
            </div>
            {workspace.description && (
              <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
                {workspace.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdminOrOwner && (
            <Button
              variant="secondary"
              size="sm"
              icon={UserPlus}
              onClick={() => setIsInviteOpen(true)}
            >
              Invite Member
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={handleCreateDocument}
          >
            New Document
          </Button>
        </div>
      </div>

      {/* Workspace Members Section */}
      {members.length > 0 && (
        <div className="bg-[#111F33] border border-[#334155] rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#60A5FA]" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
                Team Members ({members.length})
              </h2>
            </div>
            {isAdminOrOwner && (
              <Button
                variant="ghost"
                size="sm"
                icon={UserPlus}
                onClick={() => setIsInviteOpen(true)}
                className="text-xs text-[#60A5FA]"
              >
                Add Member
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {members.map((m) => {
              const u = m.user || {};
              const isCurrentUser = u._id === user?.id || u._id === user?._id;
              const isOwner = m.role === 'owner';

              return (
                <div
                  key={m._id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#1E293B]/60 border border-[#334155]/60"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {u.firstName?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#F8FAFC] truncate">
                        {u.firstName} {u.lastName} {isCurrentUser && '(You)'}
                      </p>
                      <p className="text-[11px] text-[#64748B] truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[#0F172A] text-[#60A5FA] border border-[#334155]">
                      {m.role}
                    </span>

                    {isAdminOrOwner && !isOwner && !isCurrentUser && (
                      <button
                        onClick={() => handleRemoveMember(u._id, `${u.firstName} ${u.lastName}`)}
                        className="p-1 rounded text-[#64748B] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workspace Documents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#3B82F6]" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
              Documents in this Workspace
            </h2>
          </div>
          <span className="text-xs text-[#64748B]">
            {documents.length} document{documents.length === 1 ? '' : 's'}
          </span>
        </div>

        {documents.length === 0 ? (
          <EmptyState
            title="No documents in this workspace"
            description="Create a document to start writing and collaborating with team members."
            actionLabel="Create Document"
            onAction={handleCreateDocument}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc._id}
                document={doc}
                onDelete={async (d) => {
                  if (window.confirm('Move to trash?')) {
                    await documentService.deleteDocument(d._id);
                    fetchWorkspaceData();
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Invite Member to Workspace"
        description="Enter the user's email address to invite them to this workspace."
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="member@domain.com"
            icon={Mail}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            autoFocus
          />

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Workspace Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] focus:border-[#2563EB] focus:outline-none"
            >
              <option value="member">Member (Can create and edit docs)</option>
              <option value="admin">Admin (Can manage members and settings)</option>
              <option value="viewer">Viewer (Read-only access)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsInviteOpen(false)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isInviting}>
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
