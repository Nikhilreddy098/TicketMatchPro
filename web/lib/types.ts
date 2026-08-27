export type TicketStatus = 'active' | 'reserved' | 'sold' | 'cancelled' | 'exchanged';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone_number?: string;
  bio?: string;
  rating?: number;
  total_sales?: number;
  total_purchases?: number;
  total_exchanges?: number;
  is_verified?: boolean;
  role?: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  slug?: string;
}

export interface Ticket {
  id: string;
  seller_id: string;
  event_name: string;
  category_id?: string;
  category_name?: string;
  event_date: string;
  event_time: string;
  venue: string;
  city: string;
  ticket_type: string;
  section: string;
  row: string;
  seat: string;
  quantity: number;
  original_price: number;
  selling_price: number;
  description?: string;
  status: TicketStatus;
  image_url: string;
  created_at: string;
  updated_at: string;
  seller?: Profile;
  category?: Category;
  is_favorite?: boolean;
}

export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface ExchangeRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  offered_ticket_id: string;
  requested_ticket_id: string;
  message?: string;
  status: ExchangeStatus;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
  offered_ticket?: Ticket;
  requested_ticket?: Ticket;
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  ticket_id: string;
  quantity: number;
  unit_price: number;
  service_fee: number;
  total_amount: number;
  payment_method: string;
  payment_id?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  created_at: string;
  ticket?: Ticket;
  buyer?: Profile;
  seller?: Profile;
}
