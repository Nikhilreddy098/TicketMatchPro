export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  rating: number;
  total_sales: number;
  total_purchases: number;
  total_exchanges: number;
  is_verified: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
