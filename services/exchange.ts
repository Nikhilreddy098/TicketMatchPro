import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExchangeRequest, ExchangeStatus } from '../types/exchange';
import { updateTicketStatus } from './tickets';
import { generateUniqueId } from '../utils/helpers';

let localExchanges: ExchangeRequest[] = [
  {
    id: 'ex-1',
    sender_id: 'demo-user-123',
    receiver_id: 'u-1',
    offered_ticket_id: 't-101',
    requested_ticket_id: 't-105',
    message: 'Hey Rahul, would love to swap my Summer Beats VIP ticket for your Chennai Cultural Pass!',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sender: {
      id: 'demo-user-123',
      full_name: 'Demo User',
      email: 'demo@ticketmatchpro.app',
      rating: 4.9,
      total_sales: 10,
      total_purchases: 8,
      total_exchanges: 4,
      is_verified: true,
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    receiver: {
      id: 'u-1',
      full_name: 'Rahul Sharma',
      email: 'rahul@example.com',
      rating: 4.9,
      total_sales: 12,
      total_purchases: 4,
      total_exchanges: 3,
      is_verified: true,
      role: 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

export const createExchangeRequest = async (
  senderId: string,
  receiverId: string,
  offeredTicketId: string,
  requestedTicketId: string,
  message?: string
): Promise<ExchangeRequest> => {
  const newExchange: ExchangeRequest = {
    id: generateUniqueId('ex'),
    sender_id: senderId,
    receiver_id: receiverId,
    offered_ticket_id: offeredTicketId,
    requested_ticket_id: requestedTicketId,
    message,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('exchange_requests').insert(newExchange).select().single();
      if (!error && data) return data as ExchangeRequest;
    } catch (e) {}
  }

  localExchanges.unshift(newExchange);
  return newExchange;
};

export const getUserExchanges = async (userId: string): Promise<ExchangeRequest[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('exchange_requests')
        .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*), offered_ticket:tickets!offered_ticket_id(*), requested_ticket:tickets!requested_ticket_id(*)')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      if (!error && data) return data as ExchangeRequest[];
    } catch (e) {}
  }

  return localExchanges.filter((ex) => ex.sender_id === userId || ex.receiver_id === userId);
};

export const updateExchangeStatus = async (exchangeId: string, status: ExchangeStatus): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('exchange_requests').update({ status }).eq('id', exchangeId);
      if (!error) {
        if (status === 'accepted') {
          // Lock tickets
          const { data: ex } = await supabase.from('exchange_requests').select('*').eq('id', exchangeId).single();
          if (ex) {
            await updateTicketStatus(ex.offered_ticket_id, 'exchanged');
            await updateTicketStatus(ex.requested_ticket_id, 'exchanged');
          }
        }
        return true;
      }
    } catch (e) {}
  }

  const ex = localExchanges.find((e) => e.id === exchangeId);
  if (ex) {
    ex.status = status;
    if (status === 'accepted') {
      await updateTicketStatus(ex.offered_ticket_id, 'exchanged');
      await updateTicketStatus(ex.requested_ticket_id, 'exchanged');
    }
    return true;
  }
  return false;
};
