import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getTicketById, updateTicketStatus } from '../../services/tickets';
import { Ticket, TicketStatus } from '../../types/ticket';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function TicketEditScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [status, setStatus] = useState<TicketStatus>('active');

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;
      const data = await getTicketById(ticketId);
      if (data) {
        setTicket(data);
        setStatus(data.status);
      }
      setLoading(false);
    };
    loadTicket();
  }, [ticketId]);

  const handleSave = async () => {
    if (!ticketId) return;
    await updateTicketStatus(ticketId, status);
    Alert.alert('Listing Updated', 'Ticket status updated successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  if (loading) return <Loading message="Loading ticket details..." />;
  if (!ticket) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Listing Status</Text>
      <Text style={styles.eventName}>{ticket.event_name}</Text>

      <View style={styles.statusGroup}>
        {(['active', 'reserved', 'sold', 'unavailable', 'cancelled'] as TicketStatus[]).map((st) => (
          <Button
            key={st}
            title={st.toUpperCase()}
            variant={status === st ? 'primary' : 'outline'}
            onPress={() => setStatus(st)}
            style={{ marginBottom: 10 }}
          />
        ))}
      </View>

      <Button title="Save Listing Status" onPress={handleSave} size="large" style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  eventName: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginBottom: 20,
    marginTop: 4,
  },
  statusGroup: {
    marginVertical: 12,
  },
});
