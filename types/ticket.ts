import { UserProfile } from './user';

export type TicketStatus = 'active' | 'reserved' | 'sold' | 'exchanged' | 'cancelled' | 'unavailable';

export interface Ticket {
  id: string;
  seller_id: string;
  event_name: string;
  category_id: string;
  category_name?: string;
  event_date: string;
  event_time: string;
  venue: string;
  city: string;
  ticket_type: string; // e.g. 'VIP', 'General', 'Early Bird'
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
  seller?: UserProfile;
  is_favorite?: boolean;
}
