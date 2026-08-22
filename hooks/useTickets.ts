import { useState, useEffect, useCallback } from 'react';
import { Ticket } from '../types/ticket';
import { getTickets, SearchTicketsFilter } from '../services/tickets';

export const useTickets = (initialFilter?: SearchTicketsFilter) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (filter?: SearchTicketsFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTickets(filter || initialFilter);
      setTickets(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  }, [initialFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
};
