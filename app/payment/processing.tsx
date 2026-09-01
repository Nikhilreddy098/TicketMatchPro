import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { processPaymentTransaction } from '../../lib/payment';
import { createOrder } from '../../services/orders';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    ticketId: string;
    sellerId: string;
    ticketPrice: string;
    serviceFee: string;
    isDemoMode: string;
    paymentMethod: string;
  }>();
  const { user } = useAuth();

  useEffect(() => {
    const runTransaction = async () => {
      if (!user || !params.ticketId) return;

      const ticketPrice = parseFloat(params.ticketPrice || '0');
      const serviceFee = parseFloat(params.serviceFee || '0');
      const isDemo = params.isDemoMode === 'true';

      const paymentRes = await processPaymentTransaction(
        {
          ticketId: params.ticketId,
          quantity: 1,
          paymentMethod: (params.paymentMethod as any) || 'upi',
          isDemoMode: isDemo,
        },
        {
          subtotal: ticketPrice,
          serviceFee,
          total: ticketPrice + serviceFee,
        }
      );

      if (paymentRes.success) {
        const { order, verification } = await createOrder(
          user.id,
          params.sellerId,
          params.ticketId,
          1,
          ticketPrice,
          serviceFee,
          isDemo ? 'demo' : 'razorpay',
          paymentRes.orderId,
          paymentRes.paymentId
        );

        router.replace({
          pathname: '/payment/success',
          params: {
            orderId: order.id,
            qrHash: verification.qr_hash,
            isDemoMode: isDemo ? 'true' : 'false',
          },
        });
      } else {
        router.replace({
          pathname: '/payment/failed',
          params: { error: paymentRes.error || 'Transaction refused' },
        });
      }
    };

    runTransaction();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
      <Text style={styles.title}>Processing Secure Payment</Text>
      <Text style={styles.subtitle}>Communicating with banking gateway. Please do not close or exit the application...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  spinner: {
    transform: [{ scale: 1.4 }],
    marginBottom: 24,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});
