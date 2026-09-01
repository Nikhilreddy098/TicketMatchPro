'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import { Ticket, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendSuccess(null);
    setEmailConfirmationRequired(false);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        // Create matching public profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: cleanName,
          email: cleanEmail,
          is_verified: true,
          role: 'user',
          updated_at: new Date().toISOString(),
        });

        if (!data.session) {
          setEmailConfirmationRequired(true);
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    setResending(true);
    setResendSuccess(null);

    try {
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (resendErr) {
        setError(resendErr.message);
      } else {
        setResendSuccess(`Confirmation link sent again to ${cleanEmail}. Please check your inbox and spam folder.`);
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
        <div className="w-full max-w-md">
          <div className="rounded-3xl bg-white p-8 border border-cardBorder shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Ticket className="h-4 w-4 transform -rotate-12" />
              </div>
              <span className="text-sm font-bold text-textMain">TicketMatchPro</span>
            </div>

            <div>
              <h1 className="text-[22px] font-extrabold text-textMain tracking-tight mb-1">Create your account</h1>
              <p className="text-xs text-textSecondary">
                Join TicketMatchPro to buy, sell, and exchange verified event tickets.
              </p>
            </div>

            {emailConfirmationRequired ? (
              <div className="space-y-4 text-center py-2">
                <div className="h-14 w-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-base font-black text-textMain">Check Your Email Inbox</h3>
                <p className="text-xs text-textSecondary">
                  Account created successfully! We sent a confirmation link to <strong>{email}</strong>. Please click the link in your email to log in.
                </p>

                {resendSuccess && (
                  <div className="p-3 rounded-xl bg-success/10 text-success text-xs font-semibold">
                    {resendSuccess}
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resending}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-xs font-extrabold text-white hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Resending...' : 'Resend Confirmation Email'}
                  </button>

                  <Link href="/login" className="text-xs font-bold text-primary hover:underline pt-2">
                    Back to Sign In
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-error/10 text-error text-xs font-semibold border border-error/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-textMain mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-full bg-background pl-11 pr-4 py-3 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textMain mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                      <input
                        type="email"
                        required
                        placeholder="e.g. rahul@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-full bg-background pl-11 pr-4 py-3 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textMain mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Minimum 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-full bg-background pl-11 pr-4 py-3 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-xs font-extrabold text-white hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                <div className="pt-4 border-t border-cardBorder text-center text-xs text-textSecondary">
                  Already registered?{' '}
                  <Link href="/login" className="font-bold text-primary hover:underline">
                    Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
