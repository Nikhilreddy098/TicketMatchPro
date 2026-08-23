import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';

import { AuthContext } from '../hooks/useAuth';
import { UserProfile } from '../types/user';

import {
  getCurrentUserProfile,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
} from '../services/auth';

import { COLORS } from '../constants/colors';

export default function RootLayout() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // null = still checking
  // true = internet available
  // false = no internet
  const [isInternetReachable, setIsInternetReachable] = useState<
    boolean | null
  >(null);

  // --------------------------------------------------
  // INTERNET CONNECTION CHECK
  // --------------------------------------------------
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const reachable =
        state.isConnected === true &&
        state.isInternetReachable !== false;

      setIsInternetReachable(reachable);
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      const reachable =
        state.isConnected === true &&
        state.isInternetReachable !== false;

      setIsInternetReachable(reachable);
    });

    return () => unsubscribe();
  }, []);

  // --------------------------------------------------
  // AUTH INITIALIZATION
  // --------------------------------------------------
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

  // --------------------------------------------------
  // AUTH FUNCTIONS
  // --------------------------------------------------
  const handleLogin = async (email: string, pass: string) => {
    setIsLoading(true);

    const res = await loginWithEmail(email, pass);

    if (res.user) {
      setUser(res.user);
    }

    setIsLoading(false);

    return res;
  };

  const handleRegister = async (
    name: string,
    email: string,
    pass: string
  ) => {
    setIsLoading(true);

    const res = await registerWithEmail(name, email, pass);

    if (res.user) {
      setUser(res.user);
    }

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

  // --------------------------------------------------
  // CHECKING INTERNET
  // --------------------------------------------------
  if (isInternetReachable === null) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />

        <View style={styles.connectionScreen}>
          <View style={styles.iconCircle}>
            <Text style={styles.wifiIcon}>◉</Text>
          </View>

          <Text style={styles.title}>Checking Connection</Text>

          <Text style={styles.subtitle}>
            Please wait while we check your internet connection.
          </Text>

          <ActivityIndicator
            size="large"
            color="#8B5CF6"
            style={styles.loader}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  // --------------------------------------------------
  // NO INTERNET
  // --------------------------------------------------
  if (!isInternetReachable) {
    const checkConnection = async () => {
      const state = await NetInfo.fetch();

      const reachable =
        state.isConnected === true &&
        state.isInternetReachable !== false;

      setIsInternetReachable(reachable);
    };

    return (
      <SafeAreaProvider>
        <StatusBar style="light" />

        <View style={styles.connectionScreen}>
          <View style={styles.iconCircle}>
            <Text style={styles.wifiIcon}>⌁</Text>
          </View>

          <Text style={styles.title}>No Internet Connection</Text>

          <Text style={styles.subtitle}>
            TicketMatchPro requires an internet connection to work.
            {'\n\n'}
            Please connect to Wi-Fi or mobile data and try again.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={checkConnection}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>

          <Text style={styles.footerText}>
            Your connection will be checked automatically.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // --------------------------------------------------
  // NORMAL APPLICATION
  // --------------------------------------------------
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
            headerStyle: {
              backgroundColor: COLORS.background,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: '700',
            },
            contentStyle: {
              backgroundColor: COLORS.background,
            },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Stack Routes */}
          <Stack.Screen
            name="ticket/[id]"
            options={{ title: 'Ticket Details' }}
          />

          <Stack.Screen
            name="ticket/create"
            options={{ title: 'List a Ticket' }}
          />

          <Stack.Screen
            name="ticket/edit"
            options={{ title: 'Edit Ticket' }}
          />

          <Stack.Screen
            name="exchange/index"
            options={{ title: 'Ticket Exchanges' }}
          />

          <Stack.Screen
            name="exchange/create"
            options={{ title: 'Request Exchange' }}
          />

          <Stack.Screen
            name="exchange/[id]"
            options={{ title: 'Exchange Details' }}
          />

          <Stack.Screen
            name="chat/index"
            options={{ title: 'Messages' }}
          />

          <Stack.Screen
            name="chat/[id]"
            options={{ title: 'Chat' }}
          />

          <Stack.Screen
            name="payment/checkout"
            options={{ title: 'Checkout' }}
          />

          <Stack.Screen
            name="payment/processing"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="payment/success"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="payment/failed"
            options={{ title: 'Payment Failed' }}
          />

          <Stack.Screen
            name="orders/index"
            options={{ title: 'My Orders' }}
          />

          <Stack.Screen
            name="orders/[id]"
            options={{ title: 'Order Details' }}
          />

          <Stack.Screen
            name="my-tickets"
            options={{ title: 'My Tickets' }}
          />

          <Stack.Screen
            name="digital-ticket"
            options={{ title: 'Digital Ticket' }}
          />

          <Stack.Screen
            name="verify-ticket"
            options={{ title: 'Verify Ticket' }}
          />

          <Stack.Screen
            name="notifications"
            options={{ title: 'Notifications' }}
          />

          <Stack.Screen
            name="edit-profile"
            options={{ title: 'Edit Profile' }}
          />

          <Stack.Screen
            name="settings"
            options={{ title: 'Settings' }}
          />

          <Stack.Screen
            name="admin/index"
            options={{ title: 'Admin Dashboard' }}
          />

          <Stack.Screen
            name="admin/users"
            options={{ title: 'Manage Users' }}
          />

          <Stack.Screen
            name="admin/tickets"
            options={{ title: 'Manage Tickets' }}
          />

          <Stack.Screen
            name="admin/transactions"
            options={{ title: 'Transactions' }}
          />

          <Stack.Screen
            name="admin/reports"
            options={{ title: 'Reports & Flagged' }}
          />
        </Stack>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}

// --------------------------------------------------
// OFFLINE SCREEN STYLES
// --------------------------------------------------

const styles = StyleSheet.create({
  connectionScreen: {
    flex: 1,
    backgroundColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#211044',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  wifiIcon: {
    fontSize: 52,
    color: '#8B5CF6',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },

  subtitle: {
    color: '#A1A1AA',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 350,
  },

  loader: {
    marginTop: 30,
  },

  retryButton: {
    width: '100%',
    maxWidth: 350,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },

  buttonPressed: {
    opacity: 0.75,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  footerText: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 22,
  },
});
