import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { registerSchema } from '../../utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleRegister = async () => {
    setErrors({});
    const validation = registerSchema.safeParse({ fullName, email, password, confirmPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const res = await register(fullName, email, password);
    if (res.error) {
      Alert.alert('Registration Error', res.error);
    } else if (res.needsEmailConfirmation) {
      Alert.alert(
        'Verify Email Address ✉️',
        `Account created successfully! A confirmation email has been sent to ${email.trim()}. Please click the link in your email to activate your account and log in.`,
        [
          {
            text: 'Go to Sign In',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } else if (res.user) {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.title}>Create your TicketMatchPro account</Text>
        <Text style={styles.subtitle}>Join thousands of verified ticket buyers & sellers</Text>
      </View>

      <View style={styles.formCard}>
        <Input
          label="Full Name"
          placeholder="Rahul Sharma"
          value={fullName}
          onChangeText={setFullName}
          error={errors.fullName}
          leftIcon={<User size={18} color={COLORS.textSecondary} />}
        />

        <Input
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Mail size={18} color={COLORS.textSecondary} />}
        />

        <Input
          label="Password"
          placeholder="At least 6 characters"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          leftIcon={<Lock size={18} color={COLORS.textSecondary} />}
        />

        <Input
          label="Confirm Password"
          placeholder="Re-enter password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={errors.confirmPassword}
          secureTextEntry
          leftIcon={<ShieldCheck size={18} color={COLORS.textSecondary} />}
        />

        <Button title="Create Account" onPress={handleRegister} loading={isLoading} size="large" style={styles.registerBtn} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.signInText}> Sign In</Text>
        </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginBottom: 12,
  },
  title: {
    color: COLORS.textMain,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
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
  registerBtn: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  signInText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
