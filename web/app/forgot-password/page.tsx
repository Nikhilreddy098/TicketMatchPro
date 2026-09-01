'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://ticketmatchpro.com/login',
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-black text-textMain tracking-tight">Reset Your Password</h1>
            <p className="text-xs text-textSecondary">
              Enter your account email to receive a password reset link.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 border border-cardBorder shadow-xl space-y-6">
            {success ? (
              <div className="text-center space-y-3 p-4 bg-success/10 rounded-2xl border border-success/20">
                <CheckCircle className="h-10 w-10 text-success mx-auto" />
                <div className="text-sm font-bold text-textMain">Password Reset Email Sent</div>
                <p className="text-xs text-textSecondary">
                  We've sent instructions to <strong>{email}</strong>. Please check your inbox.
                </p>
                <Link
                  href="/login"
                  className="inline-block text-xs font-bold text-primary underline mt-2"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-error/10 text-error text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-textMain mb-1.5">Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-full bg-background pl-10 pr-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-xs font-extrabold text-white shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending Request...' : 'Send Reset Link'}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-cardBorder text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs font-bold text-textSecondary hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
