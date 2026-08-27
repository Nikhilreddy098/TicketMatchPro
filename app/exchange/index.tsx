import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowRightLeft, CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { getUserExchanges, acceptExchangeRequest, rejectExchangeRequest } from '../../services/exchange';
import { ExchangeRequest } from '../../types/exchange';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { formatDate, formatCurrency } from '../../utils/formatting';

export default function ExchangeListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchExchanges = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getUserExchanges(user.id);
      setExchanges(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchExchanges();
    }, [fetchExchanges])
  );

  const incomingExchanges = exchanges.filter((ex) => ex.receiver_id === user?.id);
  const outgoingExchanges = exchanges.filter((ex) => ex.sender_id === user?.id);
  const currentList = activeTab === 'incoming' ? incomingExchanges : outgoingExchanges;

  const handleAccept = async (exchangeId: string) => {
    if (!user) return;
    setUpdatingId(exchangeId);
    try {
      await acceptExchangeRequest(exchangeId, user.id);
      Alert.alert('Exchange Accepted! 🎉', 'You have accepted the ticket exchange request.');
      fetchExchanges();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to accept exchange request.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (exchangeId: string) => {
    if (!user) return;
    setUpdatingId(exchangeId);
    try {
      await rejectExchangeRequest(exchangeId, user.id);
      Alert.alert('Exchange Rejected', 'The exchange request has been rejected.');
      fetchExchanges();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to reject exchange request.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.successBg }]}>
            <CheckCircle2 size={12} color={COLORS.success} />
            <Text style={[styles.badgeText, { color: COLORS.success }]}>Accepted</Text>
          </View>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.errorBg }]}>
            <XCircle size={12} color={COLORS.error} />
            <Text style={[styles.badgeText, { color: COLORS.error }]}>{status}</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, { backgroundColor: COLORS.warningBg }]}>
            <Clock size={12} color={COLORS.warning} />
            <Text style={[styles.badgeText, { color: COLORS.warning }]}>Pending</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabBtn, activeTab === 'incoming' ? styles.tabBtnActive : null]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles.tabText, activeTab === 'incoming' ? styles.tabTextActive : null]}>
            Incoming ({incomingExchanges.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabBtn, activeTab === 'outgoing' ? styles.tabBtnActive : null]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text style={[styles.tabText, activeTab === 'outgoing' ? styles.tabTextActive : null]}>
            Sent Requests ({outgoingExchanges.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loading message="Loading exchange requests..." />
      ) : currentList.length === 0 ? (
        <EmptyState
          title={activeTab === 'incoming' ? 'No Incoming Exchange Requests' : 'No Sent Exchange Requests'}
          description={
            activeTab === 'incoming'
              ? 'When buyers propose ticket swaps for your active listings, they will appear here.'
              : 'Browse tickets in the marketplace to propose a ticket swap!'
          }
          buttonTitle="Explore Marketplace"
          onButtonPress={() => router.push('/(tabs)/search')}
        />
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchExchanges} tintColor={COLORS.primary} />}
          renderItem={({ item }) => {
            const isSender = item.sender_id === user?.id;
            const otherParty = isSender ? item.receiver : item.sender;
            const isPending = item.status === 'pending';
            const isReceiver = item.receiver_id === user?.id;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => router.push(`/exchange/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.partyRow}>
                    <Avatar url={otherParty?.avatar_url} name={otherParty?.full_name} size={38} isVerified={otherParty?.is_verified} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.partyName}>{otherParty?.full_name || 'Ticket Trader'}</Text>
                      <Text style={styles.partyRole}>{isSender ? 'Sent by You' : 'Incoming Request'}</Text>
                    </View>
                  </View>
                  {getStatusBadge(item.status)}
                </View>

                <View style={styles.swapDetailsRow}>
                  <View style={styles.swapBox}>
                    <Text style={styles.swapLabel}>Offered Ticket</Text>
                    <Text style={styles.swapValue} numberOfLines={1}>
                      {item.offered_ticket?.event_name || 'Offered Event Ticket'}
                    </Text>
                    {item.offered_ticket?.selling_price ? (
                      <Text style={styles.swapPrice}>{formatCurrency(item.offered_ticket.selling_price)}</Text>
                    ) : null}
                  </View>

                  <View style={styles.swapIconCircle}>
                    <ArrowRightLeft size={16} color={COLORS.primary} />
                  </View>

                  <View style={styles.swapBox}>
                    <Text style={styles.swapLabel}>Requested Ticket</Text>
                    <Text style={styles.swapValue} numberOfLines={1}>
                      {item.requested_ticket?.event_name || 'Requested Event Ticket'}
                    </Text>
                    {item.requested_ticket?.selling_price ? (
                      <Text style={styles.swapPrice}>{formatCurrency(item.requested_ticket.selling_price)}</Text>
                    ) : null}
                  </View>
                </View>

                {item.message ? <Text style={styles.messageText} numberOfLines={2}>"{item.message}"</Text> : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>

                  {/* Inline Accept/Reject for Pending Incoming Requests */}
                  {isPending && isReceiver && (
                    <View style={styles.quickActions}>
                      <Button
                        title="Accept"
                        size="small"
                        loading={updatingId === item.id}
                        onPress={() => handleAccept(item.id)}
                        style={{ backgroundColor: COLORS.success, paddingHorizontal: 12 }}
                      />
                      <Button
                        title="Reject"
                        variant="danger"
                        size="small"
                        loading={updatingId === item.id}
                        onPress={() => handleReject(item.id)}
                        style={{ paddingHorizontal: 12 }}
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 18,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyName: {
    color: COLORS.textMain,
    fontSize: 15,
    fontWeight: '800',
  },
  partyRole: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  swapDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  swapBox: {
    flex: 1,
  },
  swapLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  swapValue: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  swapPrice: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  swapIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  messageText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
});
