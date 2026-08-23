import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext } from '../hooks/useAuth';
import { UserProfile } from '../types/user';
import { getCurrentUserProfile, loginWithEmail, registerWithEmail, logoutUser, DEMO_USER } from '../services/auth';
import { COLORS } from '../constants/colors';

export default function RootLayout() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const profile = await getCurrentUserProfile();
        setUser(profile || null);
      } catch (e) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const handleLogin = async (email: string, pass: string) => {
    setIsLoading(true);
    const res = await loginWithEmail(email, pass);
    if (res.user) setUser(res.user);
    setIsLoading(false);
    return res;
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    const res = await registerWithEmail(name, email, pass);
    if (res.user) setUser(res.user);
    setIsLoading(false);
    return res;
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await logoutUser();
    setUser(null);
    setIsLoading(false);
  };

  const isAdmin = Boolean(user && user.role === 'admin');

  return (
    <SafeAreaProvider>
      <AuthContext.Provider
        value={{
          user,
          isLoading,
          login: handleLogin,
          register: handleRegister,
          logout: handleLogout,
          isAdmin,
        }}
      >
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.background },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Stack Routes */}
          <Stack.Screen name="ticket/[id]" options={{ title: 'Ticket Details' }} />
          <Stack.Screen name="ticket/create" options={{ title: 'List a Ticket' }} />
          <Stack.Screen name="ticket/edit" options={{ title: 'Edit Ticket' }} />
          <Stack.Screen name="exchange/index" options={{ title: 'Ticket Exchanges' }} />
          <Stack.Screen name="exchange/create" options={{ title: 'Request Exchange' }} />
          <Stack.Screen name="exchange/[id]" options={{ title: 'Exchange Details' }} />
          <Stack.Screen name="chat/index" options={{ title: 'Messages' }} />
          <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
          <Stack.Screen name="payment/checkout" options={{ title: 'Checkout' }} />
          <Stack.Screen name="payment/processing" options={{ headerShown: false }} />
          <Stack.Screen name="payment/success" options={{ headerShown: false }} />
          <Stack.Screen name="payment/failed" options={{ title: 'Payment Failed' }} />
          <Stack.Screen name="orders/index" options={{ title: 'My Orders' }} />
          <Stack.Screen name="orders/[id]" options={{ title: 'Order Details' }} />
          <Stack.Screen name="my-tickets" options={{ title: 'My Tickets' }} />
          <Stack.Screen name="digital-ticket" options={{ title: 'Digital Ticket' }} />
          <Stack.Screen name="verify-ticket" options={{ title: 'Verify Ticket' }} />
          <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
          <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="admin/index" options={{ title: 'Admin Dashboard' }} />
          <Stack.Screen name="admin/users" options={{ title: 'Manage Users' }} />
          <Stack.Screen name="admin/tickets" options={{ title: 'Manage Tickets' }} />
          <Stack.Screen name="admin/transactions" options={{ title: 'Transactions' }} />
          <Stack.Screen name="admin/reports" options={{ title: 'Reports & Flagged' }} />
        </Stack>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
