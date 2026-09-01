import { supabase } from '../config/supabase';
import { TicketListing } from '../types';

export class TicketService {
  static async getTickets(filters: { city?: string; category?: string; search?: string } = {}): Promise<TicketListing[]> {
    try {
      let query = supabase.from('tickets').select('*, seller:profiles(*)').order('created_at', { ascending: false });

      if (filters.city && filters.city.toLowerCase() !== 'all locations') {
        query = query.ilike('city', `%${filters.city.trim()}%`);
      }

      if (filters.category && filters.category.toLowerCase() !== 'all') {
        query = query.eq('category_name', filters.category);
      }

      if (filters.search) {
        query = query.or(`event_name.ilike.%${filters.search}%,venue.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching tickets from Supabase:', error);
        return [];
      }

      return (data || []) as TicketListing[];
    } catch (e) {
      console.error('TicketService exception:', e);
      return [];
    }
  }

  static async getTicketById(id: string): Promise<TicketListing | null> {
    try {
      const { data, error } = await supabase.from('tickets').select('*, seller:profiles(*)').eq('id', id).single();
      if (error) return null;
      return data as TicketListing;
    } catch (e) {
      return null;
    }
  }

  static async createTicket(ticketData: Partial<TicketListing>): Promise<TicketListing | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          seller_id: ticketData.seller_id,
          event_name: ticketData.event_name,
          category_id: ticketData.category_id || '11111111-1111-1111-1111-111111111111',
          event_date: ticketData.event_date,
          event_time: ticketData.event_time || '19:00',
          venue: ticketData.venue,
          city: ticketData.city,
          ticket_type: ticketData.ticket_type || 'General Pass',
          section: ticketData.section || 'A',
          row: ticketData.row || '1',
          seat: ticketData.seat || '1',
          quantity: ticketData.quantity || 1,
          original_price: ticketData.original_price || 1000,
          selling_price: ticketData.selling_price || 900,
          description: ticketData.description || '',
          image_url: ticketData.image_url || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
          status: 'available',
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as TicketListing;
    } catch (e) {
      console.error('Error creating ticket:', e);
      return null;
    }
  }

  static async getUserListings(userId: string): Promise<TicketListing[]> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, seller:profiles(*)')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []) as TicketListing[];
    } catch (e) {
      return [];
    }
  }
}
