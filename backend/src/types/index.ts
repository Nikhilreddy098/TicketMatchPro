export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  phone?: string;
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

export interface TicketListing {
  id: string;
  seller_id: string;
  event_name: string;
  category_id: string;
  category_name?: string;
  event_date: string;
  event_time?: string;
  venue: string;
  city: string;
  ticket_type: string;
  section?: string;
  row?: string;
  seat?: string;
  quantity: number;
  original_price: number;
  selling_price: number;
  description?: string;
  status: 'available' | 'reserved' | 'sold' | 'cancelled';
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  seller?: UserProfile;
}

export interface ExchangeRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  offered_ticket_id: string;
  requested_ticket_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  offered_ticket?: TicketListing;
  requested_ticket?: TicketListing;
  sender_profile?: UserProfile;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
