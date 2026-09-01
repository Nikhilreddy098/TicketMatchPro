import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRightLeft, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { getTicketById, getUserListings } from '../../services/tickets';
import { createExchangeRequest, hasPendingExchangeRequest } from '../../services/exchange';
import { Ticket } from '../../types/ticket';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { FONTS } from '../../constants/typography';

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
      if (!user || !targetTicketId) {
        setLoading(false);
        return;
      }
      try {
        const target = await getTicketById(targetTicketId);
        if (!target) {
          Alert.alert('Error', 'Requested ticket listing could not be found.');
          router.back();
          return;
        }

        if (target.seller_id === user.id) {
          Alert.alert('Notice', 'You cannot request an exchange for your own ticket.');
          router.back();
          return;
        }

        const isDuplicate = await hasPendingExchangeRequest(user.id, target.id);
        if (isDuplicate) {
          Alert.alert(
            'Pending Request Exists',
            'You already have a pending exchange request for this ticket.',
            [
              { text: 'View My Requests', onPress: () => router.replace('/exchange') },
              { text: 'Cancel', style: 'cancel', onPress: () => router.back() },
            ]
          );
          return;
        }

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
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to propose an exchange.');
      return;
    }
    if (!requestedTicket) return;

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

      Alert.alert('Exchange Request Sent! 🔄', 'Your exchange request has been sent to the ticket owner.', [
        { text: 'View Exchange Requests', onPress: () => router.replace('/exchange') },
      ]);
    } catch (e: any) {
      Alert.alert('Request Failed', e?.message || 'Failed to submit exchange request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading exchange details..." />;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Propose Ticket Exchange</Text>
      <Text style={styles.subtitle}>Swap one of your active ticket listings for the ticket below.</Text>

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
    color: COLORS.textMain,
    fontSize: 24,
    fontFamily: FONTS.extraBold,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  targetCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  eventTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
  },
  eventSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  eventPrice: {
    color: COLORS.success,
    fontSize: 17,
    fontFamily: FONTS.extraBold,
    marginTop: 8,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 14,
  },
  arrowCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    color: COLORS.textMain,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    marginBottom: 12,
  },
  noTicketsBox: {
    alignItems: 'center',
    padding: 16,
  },
  noTicketsTitle: {
    color: COLORS.textMain,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  noTicketsSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  ticketOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 8,
  },
  ticketOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.secondaryLight,
  },
  ticketOptionName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  ticketOptionSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
