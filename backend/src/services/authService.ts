import { supabase } from '../config/supabase';
import { UserProfile } from '../types';

export class AuthService {
  static async login(email: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profile) {
          return { user: profile as UserProfile };
        }

        const newProf: UserProfile = {
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          email: cleanEmail,
          rating: 5.0,
          total_sales: 0,
          total_purchases: 0,
          total_exchanges: 0,
          is_verified: true,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabase.from('profiles').upsert(newProf);
        return { user: newProf };
      }
    } catch (e: any) {
      return { user: null, error: e?.message || 'Authentication service error.' };
    }

    return { user: null, error: 'Invalid login credentials.' };
  }

  static async register(fullName: string, email: string, pass: string): Promise<{ user: UserProfile | null; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: { full_name: cleanName },
        },
      });

      if (error) {
        return { user: null, error: error.message };
      }

      if (data.user) {
        const newProf: UserProfile = {
          id: data.user.id,
          full_name: cleanName,
          email: cleanEmail,
          rating: 5.0,
          total_sales: 0,
          total_purchases: 0,
          total_exchanges: 0,
          is_verified: true,
          role: 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabase.from('profiles').upsert(newProf);
        return { user: newProf };
      }
    } catch (e: any) {
      return { user: null, error: e?.message || 'Registration service error.' };
    }

    return { user: null, error: 'Registration failed.' };
  }
}
