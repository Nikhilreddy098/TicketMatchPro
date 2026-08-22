import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, Info, Sparkles } from 'lucide-react-native';
import { getTicketById } from '../../services/tickets';
import { calculateOrderTotal, isRazorpayConfigured, processPaymentTransaction } from '../../lib/payment';
import { useAuth } from '../../hooks/useAuth';
import { Ticket } from '../../types/ticket';
import { PaymentMethodType } from '../../types/payment';
import { PaymentMethodCard } from '../../components/PaymentMethodCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';

export default function CheckoutScreen() {
  const router = useRouter();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  const [upiId, setUpiId] = useState<string>('user@upi');
  const [forceDemoMode, setForceDemoMode] = useState<boolean>(!isRazorpayConfigured());
  const [processing, setProcessing] = useState<boolean>(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketId) return;
      try {
        const data = await getTicketById(ticketId);
        setTicket(data);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [ticketId]);

  if (loading) return <Loading message="Preparing checkout..." />;
  if (!ticket) return null;

  const totals = calculateOrderTotal(ticket.selling_price, 1);
  const isDemo = !isRazorpayConfigured() || forceDemoMode;

  const handleProceedPayment = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to complete purchase.');
      return;
    }

    setProcessing(true);

    // Navigate to processing screen first for realistic user experience
    router.push({
      pathname: '/payment/processing',
      params: {
        ticketId: ticket.id,
        sellerId: ticket.seller_id,
        ticketPrice: ticket.selling_price,
        serviceFee: totals.serviceFee,
        isDemoMode: isDemo ? 'true' : 'false',
        paymentMethod,
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Demo Mode Notice Banner */}
      {isDemo && (
        <View style={styles.demoNoticeCard}>
          <Sparkles size={20} color={COLORS.success} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.demoNoticeTitle}>DEMO PAYMENT MODE ACTIVE</Text>
            <Text style={styles.demoNoticeSub}>
              No real money will be charged. This simulates the complete Razorpay checkout, order creation, and ticket QR issuance flow for review.
            </Text>
          </View>
        </View>
      )}

      {/* Ticket Details Summary */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Order Item</Text>
        <Text style={styles.eventTitle}>{ticket.event_name}</Text>
        <Text style={styles.eventSub}>
          {ticket.venue}, {ticket.city} • Sec {ticket.section}, Row {ticket.row || '1'}, Seat {ticket.seat || 'A1'}
        </Text>
        <Text style={styles.ticketTypeBadge}>{ticket.ticket_type}</Text>
      </View>

      {/* Price Summary Breakdown */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Order Summary</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Ticket Price (1x)</Text>
          <Text style={styles.priceVal}>{formatCurrency(totals.subtotal)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Platform Service Fee (5%)</Text>
          <Text style={styles.priceVal}>{formatCurrency(totals.serviceFee)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.priceRow}>
          <Text style={styles.totalLabel}>Total Payable Amount</Text>
          <Text style={styles.totalVal}>{formatCurrency(totals.total)}</Text>
        </View>
      </View>

      {/* Payment Method Selector */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Select Payment Method</Text>

        <PaymentMethodCard
          id="upi"
          title="UPI Payment (GPay / PhonePe / Paytm)"
          subtitle="Instant transfer via UPI ID or QR"
          isSelected={paymentMethod === 'upi'}
          onSelect={setPaymentMethod}
        />

        {paymentMethod === 'upi' && (
          <Input
            placeholder="Enter Virtual Payment Address (e.g. 9876543210@paytm)"
            value={upiId}
            onChangeText={setUpiId}
            style={{ marginBottom: 12 }}
          />
        )}

        <PaymentMethodCard
          id="card"
          title="Credit / Debit Card"
          subtitle="Visa, Mastercard, RuPay, Maestro"
          isSelected={paymentMethod === 'card'}
          onSelect={setPaymentMethod}
        />

        <PaymentMethodCard
          id="netbanking"
          title="Net Banking"
          subtitle="All major Indian public & private banks"
          isSelected={paymentMethod === 'netbanking'}
          onSelect={setPaymentMethod}
        />

        <PaymentMethodCard
          id="wallet"
          title="Digital Wallets"
          subtitle="Amazon Pay, Paytm Wallet, Mobikwik"
          isSelected={paymentMethod === 'wallet'}
          onSelect={setPaymentMethod}
        />
      </View>

      {/* Razorpay vs Demo mode toggle */}
      <View style={styles.modeToggleRow}>
        <Text style={styles.modeToggleText}>Simulate Demo Payment Mode</Text>
        <Switch
          value={forceDemoMode}
          onValueChange={setForceDemoMode}
          trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
          thumbColor={COLORS.white}
        />
      </View>

      {/* Security Guarantee */}
      <View style={styles.securityRow}>
        <ShieldCheck size={16} color={COLORS.success} />
        <Text style={styles.securityText}>256-bit Encrypted Secure Gateway • Ticket Guarantee</Text>
      </View>

      <Button
        title={`PAY ${formatCurrency(totals.total)}`}
        onPress={handleProceedPayment}
        loading={processing}
        size="large"
        style={styles.payBtn}
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
  demoNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    marginBottom: 16,
  },
  demoNoticeTitle: {
    color: COLORS.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoNoticeSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
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
  eventTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  eventSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  ticketTypeBadge: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  priceVal: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 10,
  },
  totalLabel: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  totalVal: {
    color: COLORS.success,
    fontSize: 20,
    fontWeight: '800',
  },
  modeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  modeToggleText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  securityText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 6,
  },
  payBtn: {
    backgroundColor: COLORS.primary,
  },
});
