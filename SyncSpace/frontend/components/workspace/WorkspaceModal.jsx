'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { workspaceService } from '@/services/workspace.service';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export const WorkspaceModal = ({ isOpen, onClose }) => {
  const { fetchWorkspaces, setCurrentWorkspace } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const newWs = await workspaceService.createWorkspace({
        name: name.trim(),
        description: description.trim(),
      });
      toast.success('Workspace created');
      await fetchWorkspaces();
      if (newWs) {
        setCurrentWorkspace(newWs);
      }
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Workspace"
      description="Workspaces let you collaborate on documents with your team."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Workspace Name"
          placeholder="e.g. Engineering, Marketing, Product"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          error={error}
          autoFocus
        />

        <div>
          <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
            Description (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="What is this workspace for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-[#F8FAFC] placeholder-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default WorkspaceModal;

