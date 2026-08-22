import { Ticket } from './ticket';
import { UserProfile } from './user';

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  ticket_id: string;
  quantity: number;
  ticket_price: number;
  service_fee: number;
  total_amount: number;
  currency: string;
  payment_status: OrderStatus;
  payment_provider: 'razorpay' | 'demo';
  provider_order_id?: string;
  provider_payment_id?: string;
  created_at: string;
  updated_at: string;
  ticket?: Ticket;
  buyer?: UserProfile;
  seller?: UserProfile;
}
