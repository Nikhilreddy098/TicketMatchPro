import { UserProfile } from './user';
import { Ticket } from './ticket';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  sender?: UserProfile;
}

export interface Conversation {
  id: string;
  ticket_id?: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  ticket?: Ticket;
  participants: UserProfile[];
  unread_count?: number;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'exchange' | 'order' | 'chat' | 'favorite' | 'system';
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

export interface TicketVerification {
  id: string;
  ticket_id: string;
  order_id: string;
  qr_hash: string;
  status: 'VALID' | 'USED' | 'CANCELLED' | 'NOT_FOUND';
  verified_at?: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  ticket_id?: string;
  reported_user_id?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}
