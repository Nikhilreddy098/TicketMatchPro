import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Ticket, TicketStatus } from '../types/ticket';
import { generateUniqueId } from '../utils/helpers';
import { ALL_LOCATIONS_OPTION } from '../constants/cities';

// Rich initial seed tickets for smooth offline / demo experience
const MOCK_TICKETS: Ticket[] = [
  {
    id: 't-101',
    seller_id: 'u-1',
    event_name: 'Summer Beats Music Festival 2026',
    category_id: '11111111-1111-1111-1111-111111111111',
    category_name: 'Concerts',
    event_date: '2026-09-15',
    event_time: '18:00',
    venue: 'JLN Stadium Ground',
    city: 'New Delhi',
    ticket_type: 'VIP Gold',
    section: 'Zone A',
    row: 'R3',
    seat: 'A-14',
    quantity: 2,
    original_price: 3500,
    selling_price: 2800,
    description: 'Front row experience for the biggest electronic music festival. Food & drink pass included!',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
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
    is_favorite: false,
  },
  {
    id: 't-102',
    seller_id: 'u-2',
    event_name: 'Bengaluru Music Fest & EDM Carnival',
    category_id: '11111111-1111-1111-1111-111111111111',
    category_name: 'Concerts',
    event_date: '2026-09-20',
    event_time: '17:30',
    venue: 'Manpho Convention Center',
    city: 'Bengaluru',
    ticket_type: 'Fan Pit',
    section: 'VIP Pit',
    row: 'Standing',
    seat: 'P-88',
    quantity: 1,
    original_price: 4999,
    selling_price: 3999,
    description: 'Includes backstage pass access and complimentary merch store voucher.',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
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
    is_favorite: true,
  },
  {
    id: 't-103',
    seller_id: 'u-3',
    event_name: 'UEFA Champions League Night Screening',
    category_id: '22222222-2222-2222-2222-222222222222',
    category_name: 'Sports',
    event_date: '2026-10-05',
    event_time: '23:00',
    venue: 'Sree Kanteerava Stadium',
    city: 'Bengaluru',
    ticket_type: 'Premium Lounge',
    section: 'East Stand',
    row: 'Row 5',
    seat: 'E-42',
    quantity: 3,
    original_price: 1500,
    selling_price: 1200,
    description: 'Giant 4K screen live stadium experience with food counter access.',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=60',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
      id: 'u-3',
      full_name: 'Vikramaditya Roy',
      email: 'vikram@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      rating: 4.7,
      total_sales: 5,
      total_purchases: 2,
      total_exchanges: 1,
      is_verified: false,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    is_favorite: false,
  },
  {
    id: 't-104',
    seller_id: 'u-4',
    event_name: 'Hyderabad Live Standup Comedy Gala',
    category_id: '55555555-5555-5555-5555-555555555555',
    category_name: 'Theatre',
    event_date: '2026-09-28',
    event_time: '19:00',
    venue: 'Shilpakala Vedika',
    city: 'Hyderabad',
    ticket_type: 'Front Row',
    section: 'Executive',
    row: 'Row A',
    seat: 'A-05',
    quantity: 1,
    original_price: 2000,
    selling_price: 1600,
    description: 'Top Indian comedians perform live for 3 straight hours.',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=60',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
      id: 'u-4',
      full_name: 'Priya Sundaram',
      email: 'priya@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rating: 5.0,
      total_sales: 15,
      total_purchases: 10,
      total_exchanges: 5,
      is_verified: true,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    is_favorite: false,
  },
  {
    id: 't-105',
    seller_id: 'u-1',
    event_name: 'Chennai Cultural & Folk Fest 2026',
    category_id: '44444444-4444-4444-4444-444444444444',
    category_name: 'Festivals',
    event_date: '2026-10-12',
    event_time: '16:00',
    venue: 'Kalakshetra Foundation Ground',
    city: 'Chennai',
    ticket_type: 'All Access Pass',
    section: 'Open Lawn',
    row: 'Free Seating',
    seat: 'L-12',
    quantity: 2,
    original_price: 1200,
    selling_price: 950,
    description: 'Experience traditional dance, artisan stalls, and South Indian food trucks.',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=60',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
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
    is_favorite: false,
  },
  {
    id: 't-106',
    seller_id: 'u-2',
    event_name: 'Inter-College Cultural Youth Festival',
    category_id: '66666666-6666-6666-6666-666666666666',
    category_name: 'College Events',
    event_date: '2026-09-18',
    event_time: '10:00',
    venue: 'IIT Madras Auditorium',
    city: 'Chennai',
    ticket_type: 'Student Pass',
    section: 'Main Hall',
    row: 'Row M',
    seat: 'M-22',
    quantity: 1,
    original_price: 500,
    selling_price: 350,
    description: 'Battle of the bands, dance competitions, and celebrity guest appearance!',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=60',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
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
    is_favorite: false,
  },
  {
    id: 't-107',
    seller_id: 'u-3',
    event_name: 'Mumbai International Film Screening',
    category_id: '33333333-3333-3333-3333-333333333333',
    category_name: 'Movies',
    event_date: '2026-10-02',
    event_time: '19:30',
    venue: 'NCPA Mumbai',
    city: 'Mumbai',
    ticket_type: 'VIP Pass',
    section: 'Auditorium A',
    row: 'R5',
    seat: 'A-12',
    quantity: 2,
    original_price: 1800,
    selling_price: 1400,
    description: 'Exclusive red carpet screening with director Q&A session.',
    status: 'active',
    image_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=60',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    seller: {
      id: 'u-3',
      full_name: 'Vikramaditya Roy',
      email: 'vikram@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      rating: 4.7,
      total_sales: 5,
      total_purchases: 2,
      total_exchanges: 1,
      is_verified: false,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    is_favorite: false,
  },
];

let localTickets: Ticket[] = [...MOCK_TICKETS];

export interface SearchTicketsFilter {
  query?: string;
  category_id?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_low' | 'price_high' | 'date' | 'newest';
}

export const getTickets = async (filter?: SearchTicketsFilter): Promise<Ticket[]> => {
  const isCityFilterActive =
    filter?.city &&
    filter.city !== ALL_LOCATIONS_OPTION &&
    filter.city.trim().length > 0;

  if (isSupabaseConfigured()) {
    try {
      let query = supabase.from('tickets').select('*, seller:profiles(*)').eq('status', 'active');

      if (filter?.category_id) {
        query = query.eq('category_id', filter.category_id);
      }
      if (isCityFilterActive) {
        query = query.ilike('city', `%${filter!.city!.trim()}%`);
      }
      if (filter?.query) {
        query = query.or(`event_name.ilike.%${filter.query}%,venue.ilike.%${filter.query}%,city.ilike.%${filter.query}%`);
      }
      if (filter?.minPrice !== undefined) {
        query = query.gte('selling_price', filter.minPrice);
      }
      if (filter?.maxPrice !== undefined) {
        query = query.lte('selling_price', filter.maxPrice);
      }

      if (filter?.sortBy === 'price_low') {
        query = query.order('selling_price', { ascending: true });
      } else if (filter?.sortBy === 'price_high') {
        query = query.order('selling_price', { ascending: false });
      } else if (filter?.sortBy === 'date') {
        query = query.order('event_date', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      if (data && data.length > 0) return data as Ticket[];
      if (data && data.length === 0) return [];
    } catch (e: any) {
      console.warn('Supabase fetch tickets failed, using local store', e);
    }
  }

  // Local filtered fallback search
  let result = [...localTickets].filter((t) => t.status === 'active');

  if (filter?.category_id) {
    result = result.filter((t) => t.category_id === filter.category_id);
  }
  if (isCityFilterActive) {
    const targetCity = filter!.city!.trim().toLowerCase();
    result = result.filter((t) => t.city.toLowerCase().includes(targetCity));
  }
  if (filter?.query) {
    const q = filter.query.toLowerCase();
    result = result.filter(
      (t) =>
        t.event_name.toLowerCase().includes(q) ||
        t.venue.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q)
    );
  }
  if (filter?.minPrice !== undefined) {
    result = result.filter((t) => t.selling_price >= filter.minPrice!);
  }
  if (filter?.maxPrice !== undefined) {
    result = result.filter((t) => t.selling_price <= filter.maxPrice!);
  }

  if (filter?.sortBy === 'price_low') {
    result.sort((a, b) => a.selling_price - b.selling_price);
  } else if (filter?.sortBy === 'price_high') {
    result.sort((a, b) => b.selling_price - a.selling_price);
  } else if (filter?.sortBy === 'date') {
    result.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  } else {
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return result;
};

export const getTicketById = async (id: string): Promise<Ticket | null> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, seller:profiles(*)')
        .eq('id', id)
        .single();
      if (!error && data) return data as Ticket;
    } catch (e) {
      console.warn('Supabase fetch ticket by id failed, using memory store');
    }
  }

  return localTickets.find((t) => t.id === id) || null;
};

export const createTicketListing = async (
  ticketData: Omit<Ticket, 'id' | 'created_at' | 'updated_at' | 'status'>
): Promise<Ticket> => {
  console.log(`[TICKET CREATE] seller_id being inserted: ${ticketData.seller_id}`);

  if (isSupabaseConfigured()) {
    try {
      const payload = {
        seller_id: ticketData.seller_id,
        event_name: ticketData.event_name,
        category_id: ticketData.category_id,
        event_date: ticketData.event_date,
        event_time: ticketData.event_time,
        venue: ticketData.venue,
        city: ticketData.city,
        ticket_type: ticketData.ticket_type,
        section: ticketData.section,
        row: ticketData.row,
        seat: ticketData.seat,
        quantity: ticketData.quantity,
        original_price: ticketData.original_price,
        selling_price: ticketData.selling_price,
        description: ticketData.description,
        status: 'active',
        image_url: ticketData.image_url,
      };

      const { data, error } = await supabase
        .from('tickets')
        .insert(payload)
        .select('*, seller:profiles(*)')
        .single();

      if (error) {
        console.error('[TICKET CREATE ERROR]', error.message);
        throw new Error(error.message);
      }

      if (data) {
        const created = data as Ticket;
        console.log(`[TICKET CREATE SUCCESS] inserted ticket ID: ${created.id}, seller_id: ${created.seller_id}`);
        const existingIdx = localTickets.findIndex((t) => t.id === created.id);
        if (existingIdx === -1) {
          localTickets.unshift(created);
        } else {
          localTickets[existingIdx] = created;
        }
        return created;
      }
    } catch (e: any) {
      console.error('[TICKET CREATE EXCEPTION]', e?.message);
      throw new Error(e?.message || 'Database ticket listing creation failed.');
    }
  }

  const newTicket: Ticket = {
    ...ticketData,
    id: generateUniqueId('ticket'),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localTickets.unshift(newTicket);
  return newTicket;
};

export const updateTicketStatus = async (id: string, status: TicketStatus): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('tickets').update({ status }).eq('id', id);
      if (!error) return true;
    } catch (e) {
      console.warn('Supabase update status failed');
    }
  }

  const index = localTickets.findIndex((t) => t.id === id);
  if (index !== -1) {
    localTickets[index].status = status;
    return true;
  }
  return false;
};

export const getUserListings = async (userId: string): Promise<Ticket[]> => {
  if (!userId) return [];
  console.log(`[MY LISTINGS] querying seller_id: ${userId}`);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, seller:profiles(*)')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MY LISTINGS FETCH ERROR]', error.message);
      } else if (data) {
        console.log(`[MY LISTINGS FETCH SUCCESS] retrieved ${data.length} listings from Supabase for seller_id: ${userId}`);
        return data as Ticket[];
      }
    } catch (e: any) {
      console.warn('[MY LISTINGS EXCEPTION]', e?.message);
    }
  }

  const localMatches = localTickets.filter((t) => t.seller_id === userId);
  console.log(`[MY LISTINGS LOCAL FALLBACK] retrieved ${localMatches.length} listings for seller_id: ${userId}`);
  return localMatches;
};

export const deleteTicketAdmin = async (ticketId: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
      if (!error) {
        localTickets = localTickets.filter((t) => t.id !== ticketId);
        return true;
      }
    } catch (e) {
      console.warn('Supabase delete ticket failed');
    }
  }

  localTickets = localTickets.filter((t) => t.id !== ticketId);
  return true;
};
