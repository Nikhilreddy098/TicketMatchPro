import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRightLeft, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { getTicketById, getUserListings } from '../../services/tickets';
import { createExchangeRequest } from '../../services/exchange';
import { Ticket } from '../../types/ticket';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';

export default function CreateExchangeScreen() {
  const router = useRouter();
  const { targetTicketId } = useLocalSearchParams<{ targetTicketId: string }>();
  const { user } = useAuth();

  const [requestedTicket, setRequestedTicket] = useState<Ticket | null>(null);
  const [myListings, setMyListings] = useState<Ticket[]>([]);
  const [selectedOfferedTicket, setSelectedOfferedTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !targetTicketId) return;
      try {
        const target = await getTicketById(targetTicketId);
        setRequestedTicket(target);

        const mine = await getUserListings(user.id);
        const activeMine = mine.filter((t) => t.status === 'active');
        setMyListings(activeMine);

        if (activeMine.length > 0) {
          setSelectedOfferedTicket(activeMine[0]);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [targetTicketId, user]);

  const handleSubmitExchange = async () => {
    if (!user || !requestedTicket) return;
    if (!selectedOfferedTicket) {
      Alert.alert(
        'No Ticket Selected',
        'You need to have an active ticket listing to offer in exchange. Would you like to create one now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Listing', onPress: () => router.push('/(tabs)/sell') },
        ]
      );
      return;
    }

    setSubmitting(true);
    try {
      await createExchangeRequest(
        user.id,
        requestedTicket.seller_id,
        selectedOfferedTicket.id,
        requestedTicket.id,
        message
      );

      Alert.alert('Exchange Request Sent! 🔄', 'The ticket owner will be notified to accept or decline.', [
        { text: 'View Exchanges', onPress: () => router.replace('/exchange') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit exchange request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading exchange details..." />;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Propose Ticket Exchange</Text>
      <Text style={styles.subtitle}>Swap one of your tickets for the event below seamlessly.</Text>

      {/* Target Requested Ticket Summary */}
      {requestedTicket && (
        <View style={styles.targetCard}>
          <Text style={styles.cardLabel}>Requested Ticket</Text>
          <Text style={styles.eventTitle}>{requestedTicket.event_name}</Text>
          <Text style={styles.eventSub}>
            {requestedTicket.venue}, {requestedTicket.city} • Sec {requestedTicket.section}
          </Text>
          <Text style={styles.eventPrice}>{formatCurrency(requestedTicket.selling_price)}</Text>
        </View>
      )}

      <View style={styles.arrowContainer}>
        <View style={styles.arrowCircle}>
          <ArrowRightLeft size={22} color={COLORS.primary} />
        </View>
      </View>

      {/* Offered Ticket Selector */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Select Your Offered Ticket</Text>

        {myListings.length === 0 ? (
          <View style={styles.noTicketsBox}>
            <Text style={styles.noTicketsTitle}>No Active Listings Available</Text>
            <Text style={styles.noTicketsSub}>You need at least 1 active ticket listing to offer in an exchange.</Text>
            <Button
              title="Create a Ticket Listing"
              variant="outline"
              size="small"
              onPress={() => router.push('/(tabs)/sell')}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          myListings.map((ticket) => {
            const isSelected = selectedOfferedTicket?.id === ticket.id;
            return (
              <TouchableOpacity
                key={ticket.id}
                activeOpacity={0.8}
                style={[styles.ticketOption, isSelected ? styles.ticketOptionSelected : null]}
                onPress={() => setSelectedOfferedTicket(ticket)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketOptionName}>{ticket.event_name}</Text>
                  <Text style={styles.ticketOptionSub}>
                    Sec {ticket.section} • {formatCurrency(ticket.selling_price)}
                  </Text>
                </View>
                {isSelected && <CheckCircle2 size={20} color={COLORS.primary} />}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Optional Note */}
      <Input
        label="Optional Message to Seller"
        placeholder="Add a friendly note about why you want to swap tickets..."
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={3}
        style={{ height: 80, textAlignVertical: 'top' }}
      />

      <Button
        title="Send Exchange Request"
        onPress={handleSubmitExchange}
        loading={submitting}
        size="large"
        disabled={myListings.length === 0}
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    backgroundColor: COLORS.background,
    paddingBottom: 40,
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  targetCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cardLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  eventTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  eventSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  eventPrice: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  sectionHeader: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  noTicketsBox: {
    alignItems: 'center',
    padding: 16,
  },
  noTicketsTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  noTicketsSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  ticketOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 8,
  },
  ticketOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
  },
  ticketOptionName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  ticketOptionSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
