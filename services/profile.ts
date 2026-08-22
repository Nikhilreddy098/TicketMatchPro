import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types/user';

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (!error && data) return data as UserProfile;
    } catch (e) {}
  }

  return {
    id: userId,
    full_name: updates.full_name || 'Demo Account',
    email: updates.email || 'demo@ticketmatchpro.app',
    bio: updates.bio,
    avatar_url: updates.avatar_url,
    rating: 4.9,
    total_sales: 10,
    total_purchases: 8,
    total_exchanges: 4,
    is_verified: true,
    role: 'admin',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};
