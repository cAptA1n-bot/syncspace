'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Sparkles, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      await login({ email, password });
      toast.success('Welcome back to SyncSpace');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#60A5FA] flex items-center justify-center text-white shadow-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#F8FAFC]">
              SyncSpace
            </span>
          </Link>
          <h2 className="text-xl font-bold text-[#F8FAFC]">Sign in to your account</h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Write, collaborate, and stay in sync.
          </p>
        </div>

        {/* Card form */}
        <div className="bg-[#111F33] border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@domain.com"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#334155]/60 text-center text-xs text-[#94A3B8]">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-[#60A5FA] hover:text-[#93C5FD] font-semibold underline underline-offset-4"
            >
              Create one now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

