import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { getUserFavorites } from '../../services/favorites';
import { getTickets } from '../../services/tickets';
import { TicketCard } from '../../components/TicketCard';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Ticket } from '../../types/ticket';
import { COLORS } from '../../constants/colors';

export default function FavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [favoriteTickets, setFavoriteTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const favIds = await getUserFavorites(user.id);
      const allTickets = await getTickets();
      const favList = allTickets.filter((t) => favIds.includes(t.id)).map((t) => ({ ...t, is_favorite: true }));
      setFavoriteTickets(favList);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
    }, [fetchFavorites])
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={{ padding: 16, gap: 14 }}>
          <Skeleton width="100%" height={160} borderRadius={20} />
          <Skeleton width="100%" height={160} borderRadius={20} />
        </View>
      ) : favoriteTickets.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Save tickets and events you love to find them here."
          buttonTitle="Explore Tickets"
          onButtonPress={() => router.push('/(tabs)/search')}
        />
      ) : (
        <FlatList
          data={favoriteTickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchFavorites} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => router.push(`/ticket/${item.id}`)}
              onBuyPress={() => router.push({ pathname: '/payment/checkout', params: { ticketId: item.id } })}
              onExchangePress={() => router.push({ pathname: '/exchange/create', params: { targetTicketId: item.id } })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
  },
});
