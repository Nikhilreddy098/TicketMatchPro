import { useState, useEffect, useCallback } from 'react';
import { ExchangeRequest } from '../types/exchange';
import { getUserExchanges, getExchangeRequestsForSeller, getExchangeRequestsForRequester } from '../services/exchange';

export const useExchange = (userId: string) => {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchExchanges = useCallback(async () => {
    if (!userId) {
      setExchanges([]);
      setLoading(false);
      return;
    }
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

export const useSellerExchanges = (sellerId: string) => {
  const [incomingExchanges, setIncomingExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchIncoming = useCallback(async () => {
    if (!sellerId) {
      setIncomingExchanges([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getExchangeRequestsForSeller(sellerId);
      setIncomingExchanges(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchIncoming();
  }, [fetchIncoming]);

  return { incomingExchanges, loading, refetch: fetchIncoming };
};

export const useRequesterExchanges = (requesterId: string) => {
  const [outgoingExchanges, setOutgoingExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOutgoing = useCallback(async () => {
    if (!requesterId) {
      setOutgoingExchanges([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getExchangeRequestsForRequester(requesterId);
      setOutgoingExchanges(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [requesterId]);

  useEffect(() => {
    fetchOutgoing();
  }, [fetchOutgoing]);

  return { outgoingExchanges, loading, refetch: fetchOutgoing };
};
