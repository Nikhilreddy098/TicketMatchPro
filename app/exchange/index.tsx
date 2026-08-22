import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRightLeft, CheckCircle2, XCircle, Clock } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useExchange } from '../../hooks/useExchange';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { Avatar } from '../../components/Avatar';
import { COLORS } from '../../constants/colors';
import { formatDate } from '../../utils/formatting';

export default function ExchangeListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { exchanges, loading, refetch } = useExchange(user?.id || '');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
            <CheckCircle2 size={12} color={COLORS.success} />
            <Text style={[styles.badgeText, { color: COLORS.success }]}>Accepted</Text>
          </View>
        );
      case 'rejected':
      case 'cancelled':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <XCircle size={12} color={COLORS.error} />
            <Text style={[styles.badgeText, { color: COLORS.error }]}>{status}</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Clock size={12} color={COLORS.warning} />
            <Text style={[styles.badgeText, { color: COLORS.warning }]}>Pending</Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <Loading message="Loading exchange requests..." />
      ) : exchanges.length === 0 ? (
        <EmptyState
          title="No Exchange Requests"
          description="You don't have any active ticket exchange requests. You can request to swap tickets with other users directly from any ticket listing!"
          buttonTitle="Browse Tickets to Exchange"
          onButtonPress={() => router.push('/(tabs)/search')}
        />
      ) : (
        <FlatList
          data={exchanges}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />}
          renderItem={({ item }) => {
            const isSender = item.sender_id === user?.id;
            const otherParty = isSender ? item.receiver : item.sender;

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.card}
                onPress={() => router.push(`/exchange/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.partyRow}>
                    <Avatar url={otherParty?.avatar_url} name={otherParty?.full_name} size={36} isVerified={otherParty?.is_verified} />
                    <View style={{ marginLeft: 10 }}>
                      <Text style={styles.partyName}>{otherParty?.full_name || 'Ticket Trader'}</Text>
                      <Text style={styles.partyRole}>{isSender ? 'Requested by You' : 'Incoming Exchange'}</Text>
                    </View>
                  </View>
                  {getStatusBadge(item.status)}
                </View>

                <View style={styles.swapDetailsRow}>
                  <View style={styles.swapBox}>
                    <Text style={styles.swapLabel}>Offered Ticket</Text>
                    <Text style={styles.swapValue} numberOfLines={1}>
                      {item.offered_ticket?.event_name || 'Summer Beats VIP Gold'}
                    </Text>
                  </View>

                  <View style={styles.swapIconCircle}>
                    <ArrowRightLeft size={16} color={COLORS.secondary} />
                  </View>

                  <View style={styles.swapBox}>
                    <Text style={styles.swapLabel}>Requested Ticket</Text>
                    <Text style={styles.swapValue} numberOfLines={1}>
                      {item.requested_ticket?.event_name || 'Chennai Cultural Fest'}
                    </Text>
                  </View>
                </View>

                {item.message && <Text style={styles.messageText} numberOfLines={2}>"{item.message}"</Text>}

                <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partyName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  partyRole: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
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
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  swapBox: {
    flex: 1,
  },
  swapLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  swapValue: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  swapIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  messageText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
