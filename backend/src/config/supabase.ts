import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zfvhnuliowfqnhghwbcb.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_swgqn8wXn9C29hJP6tTZFQ_w7N8nrSr';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
