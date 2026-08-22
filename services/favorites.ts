import { supabase, isSupabaseConfigured } from '../lib/supabase';

let localFavorites: Set<string> = new Set(['t-102']);

export const toggleFavorite = async (userId: string, ticketId: string): Promise<boolean> => {
  const isFav = localFavorites.has(ticketId);

  if (isSupabaseConfigured()) {
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', userId).eq('ticket_id', ticketId);
      } else {
        await supabase.from('favorites').insert({ user_id: userId, ticket_id: ticketId });
      }
    } catch (e) {}
  }

  if (isFav) {
    localFavorites.delete(ticketId);
    return false; // Returns new favorite state
  } else {
    localFavorites.add(ticketId);
    return true;
  }
};

export const isTicketFavorite = async (userId: string, ticketId: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('favorites').select('id').eq('user_id', userId).eq('ticket_id', ticketId).single();
      return Boolean(data);
    } catch (e) {}
  }
  return localFavorites.has(ticketId);
};

export const getUserFavorites = async (userId: string): Promise<string[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('favorites').select('ticket_id').eq('user_id', userId);
      if (data) return data.map((item) => item.ticket_id);
    } catch (e) {}
  }
  return Array.from(localFavorites);
};
