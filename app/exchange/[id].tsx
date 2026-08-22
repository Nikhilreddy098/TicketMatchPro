import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRightLeft, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react-native';
import { getUserExchanges, updateExchangeStatus } from '../../services/exchange';
import { useAuth } from '../../hooks/useAuth';
import { ExchangeRequest } from '../../types/exchange';
import { Button } from '../../components/Button';
import { Avatar } from '../../components/Avatar';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatDate } from '../../utils/formatting';

export default function ExchangeDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [exchange, setExchange] = useState<ExchangeRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    const loadExchange = async () => {
      if (!user || !id) return;
      try {
        const all = await getUserExchanges(user.id);
        const item = all.find((e) => e.id === id);
        setExchange(item || null);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    loadExchange();
  }, [id, user]);

  const handleAction = async (status: 'accepted' | 'rejected' | 'cancelled') => {
    if (!exchange) return;
    setUpdating(true);
    try {
      await updateExchangeStatus(exchange.id, status);
      setExchange((prev) => (prev ? { ...prev, status } : null));

      if (status === 'accepted') {
        Alert.alert(
          'Exchange Accepted! 🎉',
          'Both tickets have been locked from further sales/exchanges and ownership has been updated.'
        );
      } else {
        Alert.alert('Status Updated', `Exchange request status changed to ${status}.`);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update exchange status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <Loading message="Loading exchange details..." />;
  if (!exchange) return null;

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
          <Avatar url={exchange.sender?.avatar_url} name={exchange.sender?.full_name} size={42} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.participantName}>{exchange.sender?.full_name || 'Sender'}</Text>
            <Text style={styles.participantRole}>Sender (Offered Ticket)</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.participantRow}>
          <Avatar url={exchange.receiver?.avatar_url} name={exchange.receiver?.full_name} size={42} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={styles.participantName}>{exchange.receiver?.full_name || 'Receiver'}</Text>
            <Text style={styles.participantRole}>Receiver (Requested Ticket)</Text>
          </View>
        </View>
      </View>

      {/* Swap Tickets Overview */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Tickets in Swap</Text>

        <View style={styles.ticketBox}>
          <Text style={styles.ticketBoxTag}>OFFERED TICKET</Text>
          <Text style={styles.ticketBoxTitle}>
            {exchange.offered_ticket?.event_name || 'Summer Beats VIP Gold'}
          </Text>
          <Text style={styles.ticketBoxSub}>
            Venue: {exchange.offered_ticket?.venue || 'JLN Stadium'} • Sec {exchange.offered_ticket?.section || 'Zone A'}
          </Text>
        </View>

        <View style={styles.swapIconRow}>
          <ArrowRightLeft size={24} color={COLORS.primary} />
        </View>

        <View style={styles.ticketBox}>
          <Text style={styles.ticketBoxTag}>REQUESTED TICKET</Text>
          <Text style={styles.ticketBoxTitle}>
            {exchange.requested_ticket?.event_name || 'Chennai Cultural Fest'}
          </Text>
          <Text style={styles.ticketBoxSub}>
            Venue: {exchange.requested_ticket?.venue || 'Kalakshetra Ground'} • Sec {exchange.requested_ticket?.section || 'Lawn'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      {exchange.status === 'pending' && (
        <View style={styles.actionsBox}>
          {isReceiver && (
            <>
              <Button
                title="Accept Exchange"
                onPress={() => handleAction('accepted')}
                loading={updating}
                icon={<CheckCircle2 size={18} color={COLORS.white} />}
                style={{ flex: 1, backgroundColor: COLORS.success }}
              />
              <Button
                title="Reject"
                variant="danger"
                onPress={() => handleAction('rejected')}
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
              onPress={() => handleAction('cancelled')}
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
            This exchange has been completed! Both tickets have been locked from further marketplace actions.
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
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  statusLabel: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  createdDate: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
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
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  participantRole: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 12,
  },
  ticketBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  ticketBoxTag: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  ticketBoxTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  ticketBoxSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  swapIconRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  actionsBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: 16,
    padding: 14,
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
    fontWeight: '600',
  },
});
