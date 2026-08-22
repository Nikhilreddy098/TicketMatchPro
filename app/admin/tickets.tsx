import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { getTickets, deleteTicketAdmin } from '../../services/tickets';
import { Ticket } from '../../types/ticket';
import { TicketCard } from '../../components/TicketCard';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';

export default function AdminTicketsScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTickets = async () => {
      const data = await getTickets();
      setTickets(data);
      setLoading(false);
    };
    fetchTickets();
  }, []);

  const handleDeleteListing = (ticket: Ticket) => {
    Alert.alert('Remove Listing', `Remove "${ticket.event_name}" from public marketplace?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove Listing',
        style: 'destructive',
        onPress: async () => {
          await deleteTicketAdmin(ticket.id);
          setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
          Alert.alert('Removed', 'Listing was deleted by administrator.');
        },
      },
    ]);
  };

  if (loading) return <Loading message="Loading active listings..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <TicketCard ticket={item} onPress={() => {}} showActions={false} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleDeleteListing(item)}>
              <Text style={styles.removeBtnText}>Remove Listing from Marketplace</Text>
            </TouchableOpacity>
          </View>
        )}
      />
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
  },
  cardWrapper: {
    marginBottom: 16,
  },
  removeBtn: {
    backgroundColor: COLORS.error,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: -8,
  },
  removeBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
