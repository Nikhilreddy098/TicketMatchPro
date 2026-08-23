import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../constants/colors';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'Sign In', headerShown: false }} />
      <Stack.Screen name="register" options={{ title: 'Create Account', headerShown: false }} />
      <Stack.Screen name="phone-auth" options={{ title: 'Phone OTP', headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Reset Password' }} />
    </Stack>
  );
}
