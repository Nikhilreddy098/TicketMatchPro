'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { Ticket, Lock, Mail, ArrowRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendSuccess(null);
    setUnconfirmedEmail(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          setUnconfirmedEmail(cleanEmail);
          setError('Your email address has not been confirmed yet.');
        } else {
          setError(authError.message);
        }
      } else if (data.user) {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!unconfirmedEmail && !email) return;
    const targetEmail = (unconfirmedEmail || email).trim().toLowerCase();
    setResending(true);
    setResendSuccess(null);

    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail,
      });

      if (resendErr) {
        setError(resendErr.message);
      } else {
        setResendSuccess(`Confirmation email successfully sent to ${targetEmail}. Please check your inbox and spam folder.`);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-md shadow-primary/20 mb-2">
              <Ticket className="h-6 w-6 transform -rotate-12" />
            </div>
            <h1 className="text-2xl font-black text-textMain tracking-tight">Sign In to TicketMatchPro</h1>
            <p className="text-xs text-textSecondary">
              Use your existing Android app account or web credentials.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-8 border border-cardBorder shadow-xl space-y-6">
            {resendSuccess && (
              <div className="flex items-center gap-2 p-3.5 rounded-xl bg-success/10 text-success text-xs font-semibold border border-success/20">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {error && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-error/10 text-error text-xs font-semibold border border-error/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>

                {unconfirmedEmail && (
                  <div className="p-4 rounded-2xl bg-secondaryLight border border-primary/20 space-y-3">
                    <p className="text-xs text-textMain font-medium">
                      Need a new confirmation link? We can resend it to <strong>{unconfirmedEmail}</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-primary-dark transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                      {resending ? 'Sending Email...' : 'Resend Confirmation Email'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-textMain mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-background pl-10 pr-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-textMain">Password</label>
                  <Link href="/forgot-password" className="text-[11px] font-bold text-primary hover:underline">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-background pl-10 pr-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-xs font-extrabold text-white shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all transform active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="pt-4 border-t border-cardBorder text-center text-xs text-textSecondary">
              Don't have an account yet?{' '}
              <Link href="/register" className="font-bold text-primary hover:underline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
