import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile } from '../types/user';
import { Ticket } from '../types/ticket';
import { Order } from '../types/order';
import { Report } from '../types/database';

export const getAdminStats = async () => {
  return {
    totalUsers: 142,
    activeListings: 89,
    totalSalesVolume: 345000,
    totalExchanges: 47,
  };
};

export const getAdminUsers = async (): Promise<UserProfile[]> => {
  return [
    {
      id: 'demo-user-123',
      full_name: 'Demo Admin Account',
      email: 'demo@ticketmatchpro.app',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      rating: 5.0,
      total_sales: 10,
      total_purchases: 8,
      total_exchanges: 4,
      is_verified: true,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'u-1',
      full_name: 'Rahul Sharma',
      email: 'rahul@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      rating: 4.9,
      total_sales: 12,
      total_purchases: 4,
      total_exchanges: 3,
      is_verified: true,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'u-2',
      full_name: 'Ananya Verma',
      email: 'ananya@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      rating: 4.8,
      total_sales: 8,
      total_purchases: 6,
      total_exchanges: 2,
      is_verified: true,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
};

export const getAdminReports = async (): Promise<Report[]> => {
  return [
    {
      id: 'rep-1',
      reporter_id: 'u-2',
      ticket_id: 't-103',
      reason: 'Suspiciously high markup price on Champions League screening.',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
};

export const deleteTicketAdmin = async (ticketId: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('tickets').delete().eq('id', ticketId);
    } catch (e) {}
  }
  return true;
};
