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

let currentUser: UserProfile | null = null;

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  if (isSupabaseConfigured()) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          currentUser = profile as UserProfile;
          return currentUser;
        }
      }
    } catch (e) {}
  }
  return currentUser;
};

export const loginWithEmail = async (email: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> => {
  const cleanEmail = email.trim().toLowerCase();

  // Demo Account credential check
  if (cleanEmail === CONFIG.demoAccount.email.toLowerCase()) {
    if (pass === 'Demo@12345') {
      currentUser = DEMO_USER;
      return { user: DEMO_USER };
    } else {
      return { user: null, error: 'Invalid password. Password for Demo Account is Demo@12345' };
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
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

  // Fallback dev/test account logic when Supabase is not configured
  if (pass.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters long.' };
  }

  currentUser = {
    id: `u-${Date.now()}`,
    full_name: cleanEmail.split('@')[0],
    email: cleanEmail,
    rating: 5.0,
    total_sales: 0,
    total_purchases: 0,
    total_exchanges: 0,
    is_verified: true,
    role: cleanEmail.includes('admin') ? 'admin' : 'user',
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

export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (phone.startsWith('+')) return phone;
  return `+${digits}`;
};

export const sendPhoneOTP = async (
  phone: string
): Promise<{ success: boolean; error?: string; isDemoMode?: boolean }> => {
  const formattedPhone = formatPhoneNumber(phone);
  if (formattedPhone.length < 12) {
    return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to send OTP SMS.' };
    }
  }

  // Development simulation when Supabase credentials are missing
  return {
    success: true,
    isDemoMode: true,
  };
};

export const verifyPhoneOTP = async (
  phone: string,
  token: string
): Promise<{ user: UserProfile | null; error?: string }> => {
  const formattedPhone = formatPhoneNumber(phone);
  if (token.trim().length !== 6) {
    return { user: null, error: 'Please enter the 6-digit OTP code.' };
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: token.trim(),
        type: 'sms',
      });

      if (error) return { user: null, error: error.message };
      if (data.user) {
        const profile = await getCurrentUserProfile();
        if (profile) {
          currentUser = profile;
          return { user: profile };
        }

        // New phone user profile setup
        const newProf: UserProfile = {
          id: data.user.id,
          full_name: `User ${formattedPhone.slice(-4)}`,
          email: `${formattedPhone.replace('+', '')}@phone.ticketmatchpro.app`,
          phone: formattedPhone,
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
      return { user: null, error: e?.message || 'OTP Verification failed.' };
    }
  }

  // Local fallback for testing UI when Supabase keys are not present
  currentUser = {
    id: `u-phone-${Date.now()}`,
    full_name: `User ${formattedPhone.slice(-4)}`,
    email: `${formattedPhone.replace('+', '')}@phone.ticketmatchpro.app`,
    phone: formattedPhone,
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

