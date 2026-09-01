import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Ticket, QrCode, ArrowRight } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { orderId, qrHash, isDemoMode } = useLocalSearchParams<{
    orderId: string;
    qrHash: string;
    isDemoMode: string;
  }>();

  const isDemo = isDemoMode === 'true';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconCircle}>
        <CheckCircle2 size={54} color={COLORS.success} />
      </View>

      <Text style={styles.title}>Payment Successful! 🎉</Text>
      <Text style={styles.subtitle}>Your digital ticket has been issued and verified in the database.</Text>

      {isDemo && (
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>DEMO PAYMENT MODE SIMULATION COMPLETED</Text>
        </View>
      )}

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Order Reference ID</Text>
          <Text style={styles.infoVal}>{orderId || 'ORD-99021'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Verification Hash</Text>
          <Text style={styles.hashVal} numberOfLines={1}>
            {qrHash || 'TMP-QR-HASH-99021'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="VIEW DIGITAL QR TICKET"
          onPress={() => router.replace({ pathname: '/digital-ticket', params: { orderId } })}
          size="large"
          icon={<QrCode size={18} color={COLORS.white} />}
          style={{ width: '100%', marginBottom: 12 }}
        />

        <Button
          title="Go to My Tickets"
          variant="outline"
          onPress={() => router.replace('/my-tickets')}
          icon={<Ticket size={18} color={COLORS.white} />}
          style={{ width: '100%' }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  title: {
    color: COLORS.white,
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  demoBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 14,
  },
  demoBadgeText: {
    color: COLORS.success,
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginVertical: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  infoVal: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  hashVal: {
    color: COLORS.secondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 10,
  },
  actions: {
    width: '100%',
  },
});
