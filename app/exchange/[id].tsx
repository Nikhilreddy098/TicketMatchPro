import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRightLeft, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react-native';
import { getExchangeRequestById, acceptExchangeRequest, rejectExchangeRequest, cancelExchangeRequest } from '../../services/exchange';
import { useAuth } from '../../hooks/useAuth';
import { ExchangeRequest } from '../../types/exchange';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatDate, formatCurrency } from '../../utils/formatting';
import { FONTS } from '../../constants/typography';

export default function ExchangeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [exchange, setExchange] = useState<ExchangeRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    const loadExchange = async () => {
      if (!user || !id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const item = await getExchangeRequestById(id);
        setExchange(item);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    loadExchange();
  }, [id, user]);

  const handleAccept = async () => {
    if (!exchange || !user) return;
    setUpdating(true);
    try {
      await acceptExchangeRequest(exchange.id, user.id);
      setExchange((prev) => (prev ? { ...prev, status: 'accepted' } : null));
      Alert.alert('Exchange Accepted! 🎉', 'Both tickets have been marked as exchanged in the marketplace.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to accept exchange request.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!exchange || !user) return;
    setUpdating(true);
    try {
      await rejectExchangeRequest(exchange.id, user.id);
      setExchange((prev) => (prev ? { ...prev, status: 'rejected' } : null));
      Alert.alert('Exchange Rejected', 'The exchange request status has been updated to rejected.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject exchange request.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!exchange || !user) return;
    setUpdating(true);
    try {
      await cancelExchangeRequest(exchange.id, user.id);
      setExchange((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      Alert.alert('Request Cancelled', 'Your exchange request has been cancelled.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to cancel exchange request.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loading message="Loading exchange details..." />;

  if (!exchange) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Exchange Request Not Found</Text>
        <Button title="Back to Exchange Requests" onPress={() => router.replace('/exchange')} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isReceiver = exchange.receiver_id === user?.id;
  const isSender = exchange.sender_id === user?.id;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerBox}>
        <Text style={styles.statusLabel}>STATUS: {exchange.status.toUpperCase()}</Text>
        <Text style={styles.createdDate}>Submitted on {formatDate(exchange.created_at)}</Text>
      </View>

      {/* Participants Card */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Exchange Participants</Text>
        <View style={styles.participantRow}>
          <Avatar url={exchange.sender?.avatar_url} name={exchange.sender?.full_name} size={44} isVerified={exchange.sender?.is_verified} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.participantName}>{exchange.sender?.full_name || 'Sender'}</Text>
            <Text style={styles.participantRole}>Sender (Offered Ticket Owner)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.participantRow}>
          <Avatar url={exchange.receiver?.avatar_url} name={exchange.receiver?.full_name} size={44} isVerified={exchange.receiver?.is_verified} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.participantName}>{exchange.receiver?.full_name || 'Receiver'}</Text>
            <Text style={styles.participantRole}>Receiver (Requested Ticket Seller)</Text>
          </View>
        </View>
      </View>

      {/* Swap Tickets Overview */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Tickets in Swap</Text>

        <View style={styles.ticketBox}>
          <Text style={styles.ticketBoxTag}>OFFERED TICKET</Text>
          <Text style={styles.ticketBoxTitle}>
            {exchange.offered_ticket?.event_name || 'Offered Event Ticket'}
          </Text>
          <Text style={styles.ticketBoxSub}>
            Venue: {exchange.offered_ticket?.venue || 'N/A'}, {exchange.offered_ticket?.city || ''} • Sec {exchange.offered_ticket?.section || 'A'}
          </Text>
          {exchange.offered_ticket?.selling_price ? (
            <Text style={styles.ticketPrice}>{formatCurrency(exchange.offered_ticket.selling_price)}</Text>
          ) : null}
        </View>

        <View style={styles.swapIconRow}>
          <View style={styles.swapIconCircle}>
            <ArrowRightLeft size={22} color={COLORS.primary} />
          </View>
        </View>

        <View style={styles.ticketBox}>
          <Text style={styles.ticketBoxTag}>REQUESTED TICKET</Text>
          <Text style={styles.ticketBoxTitle}>
            {exchange.requested_ticket?.event_name || 'Requested Event Ticket'}
          </Text>
          <Text style={styles.ticketBoxSub}>
            Venue: {exchange.requested_ticket?.venue || 'N/A'}, {exchange.requested_ticket?.city || ''} • Sec {exchange.requested_ticket?.section || 'A'}
          </Text>
          {exchange.requested_ticket?.selling_price ? (
            <Text style={styles.ticketPrice}>{formatCurrency(exchange.requested_ticket.selling_price)}</Text>
          ) : null}
        </View>
      </View>

      {exchange.message ? (
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Requester Note</Text>
          <Text style={styles.noteText}>"{exchange.message}"</Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      {exchange.status === 'pending' && (
        <View style={styles.actionsBox}>
          {isReceiver && (
            <>
              <Button
                title="Accept Exchange"
                onPress={handleAccept}
                loading={updating}
                icon={<CheckCircle2 size={18} color={COLORS.white} />}
                style={{ flex: 1, backgroundColor: COLORS.success }}
              />
              <Button
                title="Reject"
                variant="danger"
                onPress={handleReject}
                loading={updating}
                icon={<XCircle size={18} color={COLORS.white} />}
                style={{ flex: 1 }}
              />
            </>
          )}

          {isSender && (
            <Button
              title="Cancel Exchange Request"
              variant="outline"
              onPress={handleCancel}
              loading={updating}
              style={{ width: '100%' }}
            />
          )}
        </View>
      )}

      {exchange.status === 'accepted' && (
        <View style={styles.lockedNotice}>
          <ShieldCheck size={20} color={COLORS.success} />
          <Text style={styles.lockedText}>
            This exchange request has been accepted! Both tickets have been marked as exchanged in the marketplace.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    backgroundColor: COLORS.background,
    paddingBottom: 40,
  },
  headerBox: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  statusLabel: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    letterSpacing: 1,
  },
  createdDate: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    fontFamily: FONTS.semiBold,
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
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontFamily: FONTS.extraBold,
  },
  participantRole: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 12,
  },
  ticketBox: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  ticketBoxTag: {
    color: COLORS.secondary,
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    marginBottom: 4,
  },
  ticketBoxTitle: {
    color: COLORS.textMain,
    fontSize: 15,
    fontFamily: FONTS.extraBold,
  },
  ticketBoxSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.semiBold,
  },
  ticketPrice: {
    color: COLORS.success,
    fontSize: 14,
    fontFamily: FONTS.extraBold,
    marginTop: 6,
  },
  swapIconRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  swapIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  noteText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionsBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginTop: 8,
  },
  lockedText: {
    color: COLORS.success,
    fontSize: 13,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
    fontFamily: FONTS.bold,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
  },
});
