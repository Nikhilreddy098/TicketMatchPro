import { supabase } from '../config/supabase';
import { ExchangeRequest } from '../types';

export class ExchangeService {
  static async getExchangeRequests(userId: string): Promise<ExchangeRequest[]> {
    try {
      const { data, error } = await supabase
        .from('exchange_requests')
        .select('*, offered_ticket:tickets!offered_ticket_id(*), requested_ticket:tickets!requested_ticket_id(*), sender_profile:profiles!sender_id(*)')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) return [];
      return (data || []) as ExchangeRequest[];
    } catch (e) {
      return [];
    }
  }

  static async createExchangeRequest(reqData: {
    sender_id: string;
    receiver_id: string;
    offered_ticket_id: string;
    requested_ticket_id: string;
    message?: string;
  }): Promise<ExchangeRequest | null> {
    try {
      const { data, error } = await supabase
        .from('exchange_requests')
        .insert({
          sender_id: reqData.sender_id,
          receiver_id: reqData.receiver_id,
          offered_ticket_id: reqData.offered_ticket_id,
          requested_ticket_id: reqData.requested_ticket_id,
          message: reqData.message || 'I would like to exchange my ticket for yours.',
          status: 'pending',
        })
        .select('*')
        .single();

      if (error) throw error;
      return data as ExchangeRequest;
    } catch (e) {
      console.error('Error creating exchange request:', e);
      return null;
    }
  }
}
