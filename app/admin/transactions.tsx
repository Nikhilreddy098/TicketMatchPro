import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { getUserOrders } from '../../services/orders';
import { Order } from '../../types/order';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatCurrency, formatDate } from '../../utils/formatting';

export default function AdminTransactionsScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const data = await getUserOrders('demo-user-123');
      setOrders(data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  if (loading) return <Loading message="Loading transaction logs..." />;

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.txCard}>
            <View style={styles.txHeader}>
              <Text style={styles.txTitle}>Order #{item.id}</Text>
              <Text style={styles.txStatus}>{item.payment_status.toUpperCase()}</Text>
            </View>
            <Text style={styles.txSub}>Amount: {formatCurrency(item.total_amount)} ({item.payment_provider})</Text>
            <Text style={styles.txDate}>{formatDate(item.created_at)}</Text>
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
  txCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  txTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  txStatus: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '800',
  },
  txSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  txDate: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
});
