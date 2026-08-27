import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { sendPhoneOTP, verifyPhoneOTP } from '../../services/auth';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    setError('');
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    const res = await sendPhoneOTP(cleanPhone);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Failed to send OTP.');
      Alert.alert('SMS OTP Error', res.error || 'Failed to send OTP.');
    } else {
      setStep('otp');
      setCooldown(60);
      if (res.isDemoMode) {
        Alert.alert('Demo SMS Mode', 'SMS gateway in demo mode. Enter any 6-digit code (e.g. 123456) to sign in.');
      } else {
        Alert.alert('OTP Sent', `A 6-digit verification code has been sent to +91 ${cleanPhone.slice(-10)} via SMS.`);
      }
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (otp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code received via SMS.');
      return;
    }

    setLoading(true);
    const res = await verifyPhoneOTP(phone, otp);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      Alert.alert('Verification Failed', res.error);
    } else if (res.user) {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={() => (step === 'otp' ? setStep('phone') : router.back())} style={styles.backBtn} activeOpacity={0.7}>
        <ArrowLeft size={20} color={COLORS.textMain} />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Phone size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Phone Authentication</Text>
        <Text style={styles.subtitle}>
          {step === 'phone'
            ? 'Enter your 10-digit mobile number to receive an SMS OTP.'
            : `Enter the 6-digit code sent to +91 ${phone.slice(-10)}`}
        </Text>
      </View>

      <View style={styles.formCard}>
        {step === 'phone' ? (
          <>
            <Input
              label="Mobile Number (India)"
              placeholder="98765 43210"
              value={phone}
              onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
              error={error}
              keyboardType="phone-pad"
              maxLength={10}
              leftIcon={<Text style={styles.countryCode}>+91</Text>}
            />

            <Button title="Send OTP via SMS" onPress={handleSendOtp} loading={loading} size="large" style={styles.actionBtn} />
          </>
        ) : (
          <>
            <Input
              label="6-Digit Verification Code"
              placeholder="1 2 3 4 5 6"
              value={otp}
              onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
              error={error}
              keyboardType="number-pad"
              maxLength={6}
              leftIcon={<KeyRound size={20} color={COLORS.textSecondary} />}
            />

            <Button title="Verify & Sign In" onPress={handleVerifyOtp} loading={loading} size="large" style={styles.actionBtn} />

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive code? </Text>
              <TouchableOpacity disabled={cooldown > 0} onPress={handleSendOtp}>
                <Text style={[styles.resendLink, cooldown > 0 && styles.disabledText]}>
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setStep('phone')} style={styles.changePhoneBtn}>
              <Text style={styles.changePhoneText}>Change Mobile Number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.securityBadge}>
        <ShieldCheck size={16} color={COLORS.success} />
        <Text style={styles.securityText}>Secured by Supabase Phone Auth</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 40,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: COLORS.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
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
  countryCode: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
    marginRight: 6,
  },
  actionBtn: {
    marginTop: 12,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  resendText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  resendLink: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  disabledText: {
    color: COLORS.textMuted,
  },
  changePhoneBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  changePhoneText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 6,
  },
  securityText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
