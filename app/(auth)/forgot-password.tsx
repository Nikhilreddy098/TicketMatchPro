import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleResetPassword = () => {
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.description}>
        Enter your registered email address and we will send you instructions to reset your password.
      </Text>

      {submitted ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>Check Your Inbox! 📧</Text>
          <Text style={styles.successText}>
            We've sent password reset instructions to <Text style={{ color: COLORS.textMain, fontWeight: '700' }}>{email}</Text>.
          </Text>
          <Button title="Back to Sign In" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 16 }} />
        </View>
      ) : (
        <View style={styles.formCard}>
          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Mail size={18} color={COLORS.textSecondary} />}
          />
          <Button title="Send Reset Link" onPress={handleResetPassword} size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 24,
    fontFamily: FONTS.extraBold,
    marginBottom: 8,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  successBox: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  successTitle: {
    color: COLORS.success,
    fontSize: 18,
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
  successText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
