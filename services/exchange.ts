import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ExchangeRequest, ExchangeStatus } from '../types/exchange';
import { updateTicketStatus } from './tickets';
import { generateUniqueId } from '../utils/helpers';

let localExchanges: ExchangeRequest[] = [];

/**
 * Check if a user already has an active pending request for a specific ticket
 */
export const hasPendingExchangeRequest = async (
  senderId: string,
  requestedTicketId: string
): Promise<boolean> => {
  if (!senderId || !requestedTicketId) return false;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('exchange_requests')
        .select('id')
        .eq('sender_id', senderId)
        .eq('requested_ticket_id', requestedTicketId)
        .eq('status', 'pending')
        .limit(1);

      if (!error && data && data.length > 0) {
        return true;
      }
    } catch (e) {}
  }

  return localExchanges.some(
    (ex) => ex.sender_id === senderId && ex.requested_ticket_id === requestedTicketId && ex.status === 'pending'
  );
};

/**
 * Create a real exchange request in Supabase
 */
export const createExchangeRequest = async (
  senderId: string,
  receiverId: string,
  offeredTicketId: string,
  requestedTicketId: string,
  message?: string
): Promise<ExchangeRequest> => {
  if (!senderId) {
    throw new Error('Authentication required to submit exchange request.');
  }

  if (senderId === receiverId) {
    throw new Error('You cannot request an exchange for your own ticket.');
  }

  // Duplicate request check
  const isDuplicate = await hasPendingExchangeRequest(senderId, requestedTicketId);
  if (isDuplicate) {
    throw new Error('You already have a pending exchange request for this ticket.');
  }

  const newExchange: ExchangeRequest = {
    id: generateUniqueId('ex'),
    sender_id: senderId,
    receiver_id: receiverId,
    offered_ticket_id: offeredTicketId,
    requested_ticket_id: requestedTicketId,
    message: message || '',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from('exchange_requests')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        offered_ticket_id: offeredTicketId,
        requested_ticket_id: requestedTicketId,
        message: message || null,
        status: 'pending',
      })
      .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*), offered_ticket:tickets!offered_ticket_id(*), requested_ticket:tickets!requested_ticket_id(*)')
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to submit exchange request to database.');
    }
    if (data) return data as ExchangeRequest;
  }

  localExchanges.unshift(newExchange);
  return newExchange;
};

/**
 * Get all exchange requests where user is participant (sender or receiver)
 */
export const getUserExchanges = async (userId: string): Promise<ExchangeRequest[]> => {
  if (!userId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('exchange_requests')
        .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*), offered_ticket:tickets!offered_ticket_id(*), requested_ticket:tickets!requested_ticket_id(*)')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (!error && data) return data as ExchangeRequest[];
    } catch (e) {}
  }

  return localExchanges.filter((ex) => ex.sender_id === userId || ex.receiver_id === userId);
};

/**
 * Get exchange requests sent TO user (where user is receiver/seller)
 */
export const getExchangeRequestsForSeller = async (sellerId: string): Promise<ExchangeRequest[]> => {
  if (!sellerId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('exchange_requests')
        .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*), offered_ticket:tickets!offered_ticket_id(*), requested_ticket:tickets!requested_ticket_id(*)')
        .eq('receiver_id', sellerId)
        .order('created_at', { ascending: false });

      if (!error && data) return data as ExchangeRequest[];
    } catch (e) {}
  }

  return localExchanges.filter((ex) => ex.receiver_id === sellerId);
};

/**
 * Get exchange requests sent BY user (where user is sender/requester)
 */
export const getExchangeRequestsForRequester = async (requesterId: string): Promise<ExchangeRequest[]> => {
  if (!requesterId) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('exchange_requests')
        .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*), offered_ticket:tickets!offered_ticket_id(*), requested_ticket:tickets!requested_ticket_id(*)')
        .eq('sender_id', requesterId)
        .order('created_at', { ascending: false });

      if (!error && data) return data as ExchangeRequest[];
    } catch (e) {}
  }

  return localExchanges.filter((ex) => ex.sender_id === requesterId);
};

/**
 * Get single exchange request by ID
 */
export const getExchangeRequestById = async (id: string): Promise<ExchangeRequest | null> => {
  if (!id) return null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('exchange_requests')
        .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*), offered_ticket:tickets!offered_ticket_id(*), requested_ticket:tickets!requested_ticket_id(*)')
        .eq('id', id)
        .single();

      if (!error && data) return data as ExchangeRequest;
    } catch (e) {}
  }

  return localExchanges.find((ex) => ex.id === id) || null;
};

/**
 * Update exchange status (Accept, Reject, Cancel)
 */
export const updateExchangeStatus = async (
  exchangeId: string,
  status: ExchangeStatus,
  currentUserId?: string
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    // If currentUserId provided, enforce authorization check
    if (currentUserId) {
      const { data: currentEx } = await supabase
        .from('exchange_requests')
        .select('sender_id, receiver_id')
        .eq('id', exchangeId)
        .single();

      if (currentEx) {
        if (status === 'accepted' || status === 'rejected') {
          if (currentEx.receiver_id !== currentUserId) {
            throw new Error('Only the ticket seller can accept or reject an exchange request.');
          }
        } else if (status === 'cancelled') {
          if (currentEx.sender_id !== currentUserId) {
            throw new Error('Only the requester can cancel their exchange request.');
          }
        }
      }
    }

    const { error } = await supabase
      .from('exchange_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', exchangeId);

    if (error) {
      throw new Error(error.message || 'Failed to update exchange request status in database.');
    }

    if (status === 'accepted') {
      const { data: ex } = await supabase
        .from('exchange_requests')
        .select('offered_ticket_id, requested_ticket_id')
        .eq('id', exchangeId)
        .single();

      if (ex) {
        await updateTicketStatus(ex.offered_ticket_id, 'exchanged');
        await updateTicketStatus(ex.requested_ticket_id, 'exchanged');
      }
    }
    return true;
  }

  const ex = localExchanges.find((e) => e.id === exchangeId);
  if (ex) {
    if (currentUserId) {
      if ((status === 'accepted' || status === 'rejected') && ex.receiver_id !== currentUserId) {
        throw new Error('Only the ticket seller can accept or reject an exchange request.');
      }
      if (status === 'cancelled' && ex.sender_id !== currentUserId) {
        throw new Error('Only the requester can cancel their exchange request.');
      }
    }

    ex.status = status;
    ex.updated_at = new Date().toISOString();
    if (status === 'accepted') {
      await updateTicketStatus(ex.offered_ticket_id, 'exchanged');
      await updateTicketStatus(ex.requested_ticket_id, 'exchanged');
    }
    return true;
  }
  return false;
};

/**
 * Seller accepts exchange request
 */
export const acceptExchangeRequest = async (exchangeId: string, currentUserId: string): Promise<boolean> => {
  return updateExchangeStatus(exchangeId, 'accepted', currentUserId);
};

/**
 * Seller rejects exchange request
 */
export const rejectExchangeRequest = async (exchangeId: string, currentUserId: string): Promise<boolean> => {
  return updateExchangeStatus(exchangeId, 'rejected', currentUserId);
};

/**
 * Requester cancels exchange request
 */
export const cancelExchangeRequest = async (exchangeId: string, currentUserId: string): Promise<boolean> => {
  return updateExchangeStatus(exchangeId, 'cancelled', currentUserId);
};
