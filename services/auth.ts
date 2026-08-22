import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types/user';
import { CONFIG } from '../constants/config';

export const DEMO_USER: UserProfile = {
  id: 'demo-user-123',
  full_name: 'Demo Account',
  email: CONFIG.demoAccount.email,
  avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
  bio: 'Event enthusiast & verified ticket trader.',
  rating: 4.9,
  total_sales: 10,
  total_purchases: 8,
  total_exchanges: 4,
  is_verified: true,
  role: 'admin', // Demo account has admin access for reviewer convenience
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

let currentUser: UserProfile | null = DEMO_USER;

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (isSupabaseConfigured()) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) return profile as UserProfile;
      }
    } catch (e) {}
  }
  return currentUser;
};

export const loginWithEmail = async (email: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> => {
  if (email.toLowerCase() === CONFIG.demoAccount.email.toLowerCase()) {
    currentUser = DEMO_USER;
    return { user: DEMO_USER };
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const profile = await getCurrentUserProfile();
        currentUser = profile;
        return { user: profile };
      }
    } catch (e: any) {
      return { user: null, error: e?.message || 'Login failed' };
    }
  }

  // Fallback dev account
  currentUser = {
    id: `u-${Date.now()}`,
    full_name: email.split('@')[0],
    email,
    rating: 5.0,
    total_sales: 0,
    total_purchases: 0,
    total_exchanges: 0,
    is_verified: true,
    role: email.includes('admin') ? 'admin' : 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { user: currentUser };
};

export const registerWithEmail = async (
  fullName: string,
  email: string,
  pass: string
): Promise<{ user: UserProfile | null; error?: string }> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const newProf: UserProfile = {
          id: data.user.id,
          full_name: fullName,
          email,
          rating: 5.0,
          total_sales: 0,
          total_purchases: 0,
          total_exchanges: 0,
          is_verified: true,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        await supabase.from('profiles').insert(newProf);
        currentUser = newProf;
        return { user: newProf };
      }
    } catch (e: any) {
      return { user: null, error: e?.message || 'Registration failed' };
    }
  }

  currentUser = {
    id: `u-${Date.now()}`,
    full_name: fullName,
    email,
    rating: 5.0,
    total_sales: 0,
    total_purchases: 0,
    total_exchanges: 0,
    is_verified: true,
    role: 'user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { user: currentUser };
};

export const logoutUser = async (): Promise<void> => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  currentUser = null;
};
