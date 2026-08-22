import { useState, useEffect, useCallback } from 'react';
import { ExchangeRequest } from '../types/exchange';
import { getUserExchanges } from '../services/exchange';

export const useExchange = (userId: string) => {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchExchanges = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getUserExchanges(userId);
      setExchanges(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  return { exchanges, loading, refetch: fetchExchanges };
};
