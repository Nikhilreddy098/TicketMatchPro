import { Ticket } from './ticket';
import { UserProfile } from './user';

export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

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
  sender?: UserProfile;
  receiver?: UserProfile;
  offered_ticket?: Ticket;
  requested_ticket?: Ticket;
}
