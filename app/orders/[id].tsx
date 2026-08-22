import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getUserOrders } from '../../services/orders';
import { Order } from '../../types/order';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatCurrency, formatDate } from '../../utils/formatting';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrder = async () => {
      const all = await getUserOrders('demo-user-123');
      const item = all.find((o) => o.id === id) || all[0];
      setOrder(item || null);
      setLoading(false);
    };
    fetchOrder();
  }, [id]);

  if (loading) return <Loading message="Loading order details..." />;
  if (!order) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Order Summary #{order.id}</Text>
      <Text style={styles.date}>Purchased on {formatDate(order.created_at)}</Text>

      <View style={styles.card}>
        <Text style={styles.eventTitle}>{order.ticket?.event_name || 'Bengaluru Music Fest'}</Text>
        <Text style={styles.subText}>Quantity: {order.quantity} ticket(s)</Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.label}>Ticket Price</Text>
          <Text style={styles.val}>{formatCurrency(order.ticket_price)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Service Fee</Text>
          <Text style={styles.val}>{formatCurrency(order.service_fee)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Amount Paid</Text>
          <Text style={styles.totalVal}>{formatCurrency(order.total_amount)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment Provider</Text>
          <Text style={styles.val}>{order.payment_provider.toUpperCase()}</Text>
        </View>
      </View>

      <Button
        title="View Digital QR Ticket"
        onPress={() => router.push({ pathname: '/digital-ticket', params: { orderId: order.id } })}
        size="large"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
  },
  date: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  eventTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  subText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  val: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  totalVal: {
    color: COLORS.success,
    fontSize: 16,
    fontWeight: '800',
  },
});
