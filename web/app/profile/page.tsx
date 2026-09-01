'use client';

import React, { useState } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';
import { ShieldCheck, User, Mail, Star, ShoppingBag, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, refetchProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        bio: bio,
        updated_at: new Date().toISOString(),
      });

      if (!error) {
        setMessage('Profile updated successfully!');
        refetchProfile();
      }
    } catch (e) {
      console.error('Profile update error:', e);
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 text-xs font-bold text-textMain">
          Please sign in to view your profile.
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-textMain tracking-tight">Account Profile</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1">
            Manage your TicketMatchPro user settings and verification status.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Profile Stats Sidebar */}
          <div className="md:col-span-4 space-y-4">
            <div className="rounded-3xl bg-white p-6 border border-cardBorder shadow-sm text-center space-y-3">
              <div className="h-20 w-20 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-2xl mx-auto shadow-lg shadow-primary/20">
                {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>

              <div>
                <div className="flex items-center justify-center gap-1.5 text-base font-extrabold text-textMain">
                  <span>{profile?.full_name || 'Fan Account'}</span>
                  {profile?.is_verified && <ShieldCheck className="h-4 w-4 text-success" />}
                </div>
                <div className="text-xs text-textSecondary">{user.email}</div>
              </div>

              <div className="pt-3 border-t border-cardBorder grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-black text-textMain">{profile?.total_sales || 1}</div>
                  <div className="text-[10px] text-textSecondary">Sales</div>
                </div>
                <div>
                  <div className="font-black text-textMain">{profile?.total_purchases || 2}</div>
                  <div className="text-[10px] text-textSecondary">Bought</div>
                </div>
                <div>
                  <div className="font-black text-textMain flex items-center justify-center gap-0.5 text-accentGold">
                    5.0 <Star className="h-3 w-3 fill-accentGold" />
                  </div>
                  <div className="text-[10px] text-textSecondary">Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="md:col-span-8">
            <div className="rounded-3xl bg-white p-6 sm:p-8 border border-cardBorder shadow-xl space-y-6">
              {message && (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-success/10 text-success text-xs font-semibold border border-success/20">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-textMain mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-full bg-background px-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-textMain mb-1.5">Bio / Description</label>
                  <textarea
                    rows={3}
                    placeholder="Tell other fans about your favorite music genres or sports teams..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl bg-background p-4 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-extrabold text-white shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {updating ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
