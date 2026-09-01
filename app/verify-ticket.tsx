import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { QrCode, CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react-native';
import { verifyTicketByQrHash } from '../services/orders';
import { TicketVerification } from '../types/database';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS } from '../constants/colors';
import { formatDate } from '../utils/formatting';
import { FONTS } from '../constants/typography';

export default function VerifyTicketScreen() {
  const { qrHash: initialHash } = useLocalSearchParams<{ qrHash?: string }>();
  const [hashInput, setHashInput] = useState<string>(initialHash || 'TMP-QR-T102-ORD8801-SECUREHASH99021');
  const [verificationResult, setVerificationResult] = useState<TicketVerification | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleVerify = async () => {
    if (!hashInput.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const result = await verifyTicketByQrHash(hashInput.trim());
      setVerificationResult(result);
    } catch (e) {
      setVerificationResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialHash) {
      handleVerify();
    }
  }, [initialHash]);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <QrCode size={36} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Ticket Verification Portal</Text>
        <Text style={styles.subtitle}>
          Verify entry authenticity and database validity of any TicketMatchPro digital ticket pass.
        </Text>
      </View>

      <View style={styles.card}>
        <Input
          label="Ticket ID / QR Verification Hash"
          placeholder="Paste or enter QR Hash e.g. TMP-QR-..."
          value={hashInput}
          onChangeText={setHashInput}
        />
        <Button title="Verify Authenticity" onPress={handleVerify} loading={loading} size="large" />
      </View>

      {/* Verification Result */}
      {hasSearched && (
        <View style={styles.resultCard}>
          {verificationResult && verificationResult.status === 'VALID' ? (
            <View style={styles.validResult}>
              <CheckCircle2 size={48} color={COLORS.success} />
              <Text style={styles.validTitle}>VERIFIED TICKET: VALID</Text>
              <Text style={styles.validSub}>
                This ticket is authentic, active, and valid for stadium/event entrance.
              </Text>
              <View style={styles.detailsBox}>
                <Text style={styles.detailText}>
                  Order Ref: <Text style={{ color: COLORS.white }}>{verificationResult.order_id}</Text>
                </Text>
                <Text style={styles.detailText}>
                  Issued On: <Text style={{ color: COLORS.white }}>{formatDate(verificationResult.created_at)}</Text>
                </Text>
              </View>
            </View>
          ) : verificationResult && verificationResult.status === 'USED' ? (
            <View style={styles.usedResult}>
              <AlertTriangle size={48} color={COLORS.warning} />
              <Text style={styles.usedTitle}>TICKET ALREADY USED</Text>
              <Text style={styles.validSub}>This QR code pass has already been scanned for event entry.</Text>
            </View>
          ) : (
            <View style={styles.invalidResult}>
              <XCircle size={48} color={COLORS.error} />
              <Text style={styles.invalidTitle}>INVALID / NOT FOUND</Text>
              <Text style={styles.validSub}>
                This QR hash could not be verified in the TicketMatchPro central database.
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.extraBold,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
  },
  validResult: {
    alignItems: 'center',
  },
  validTitle: {
    color: COLORS.success,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    marginTop: 12,
  },
  validSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  detailsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  detailText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  usedResult: {
    alignItems: 'center',
  },
  usedTitle: {
    color: COLORS.warning,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    marginTop: 12,
  },
  invalidResult: {
    alignItems: 'center',
  },
  invalidTitle: {
    color: COLORS.error,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    marginTop: 12,
  },
});
