'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/auth.service';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { User, Lock, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
          Account Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
          Manage your personal profile and security credentials.
        </p>
      </div>

      {/* Profile Overview */}
      <div className="bg-[#111F33] border border-[#334155] rounded-2xl p-6 shadow-card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
          Personal Profile
        </h2>

        <div className="flex items-center gap-4 py-2">
          <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xl font-bold shadow-glow-sm">
            {user?.firstName?.[0] || 'U'}
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F8FAFC]">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-xs text-[#94A3B8]">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Input
            label="First Name"
            value={user?.firstName || ''}
            disabled
            icon={User}
          />
          <Input
            label="Last Name"
            value={user?.lastName || ''}
            disabled
          />
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-[#111F33] border border-[#334155] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#60A5FA]" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#94A3B8]">
            Change Password
          </h2>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            icon={Lock}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            helperText="Include letters and numbers"
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isChangingPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

