import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { XCircle, RefreshCw } from 'lucide-react-native';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';

export default function PaymentFailedScreen() {
  const router = useRouter();
  const { error } = useLocalSearchParams<{ error: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <XCircle size={54} color={COLORS.error} />
      </View>

      <Text style={styles.title}>Payment Could Not Process</Text>
      <Text style={styles.subtitle}>
        {error || 'Your transaction was declined by the bank server or gateway.'}
      </Text>

      <Button
        title="Try Payment Again"
        onPress={() => router.back()}
        size="large"
        icon={<RefreshCw size={18} color={COLORS.white} />}
        style={{ marginTop: 24, width: '100%' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
