import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
} from '@expo-google-fonts/be-vietnam-pro';

import { AuthContext, useAuth } from '../hooks/useAuth';
import { UserProfile } from '../types/user';
import { Loading } from '../components/Loading';

import {
  getCurrentUserProfile,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
} from '../services/auth';

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Default every <Text> to the app's body font; any explicit fontFamily
// set on a specific style (e.g. bold headings) still overrides this.
(Text as any).defaultProps = (Text as any).defaultProps || {};
(Text as any).defaultProps.style = [{ fontFamily: FONTS.regular }, (Text as any).defaultProps.style];

function AuthRouterGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string | undefined;
    const inAuthGroup = firstSegment === '(auth)';

    if (!user && !inAuthGroup) {
      console.log('[ROUTER] Redirecting to LOGIN');
      router.replace('/(auth)/login');
    } else if (user && (inAuthGroup || firstSegment === 'index' || !firstSegment)) {
      console.log('[ROUTER] Redirecting to HOME');
      router.replace('/(tabs)/home');
    }
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return <Loading message="Launching TicketMatchPro..." fullScreen />;
  }

  if (!user && (segments[0] as string) === '(tabs)') {
    return <Loading message="Authenticating..." fullScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontFamily: FONTS.bold,
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
  );
}

export default function RootLayout() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // --------------------------------------------------
  // AUTH INITIALIZATION & SESSION LISTENER
  // --------------------------------------------------
  useEffect(() => {
    let authSubscription: any;

    const initAuth = async () => {
      console.log('[ROUTER] App booted');
      console.log('[ROUTER] Checking Supabase session');
      try {
        if (isSupabaseConfigured()) {
          const { data: { session } } = await supabase.auth.getSession();
          console.log('[ROUTER] Session:', session?.user ? 'PRESENT' : 'NULL');

          if (session?.user) {
            const profile = await getCurrentUserProfile();
            setUser(profile || null);
          } else {
            setUser(null);
          }

          const { data: listener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              console.log('[ROUTER] Auth event:', event, 'Session:', session?.user ? 'PRESENT' : 'NULL');
              if (session?.user) {
                const profile = await getCurrentUserProfile();
                setUser(profile || null);
              } else {
                setUser(null);
              }
            }
          );
          authSubscription = listener?.subscription;
        } else {
          console.log('[ROUTER] Checking user profile');
          const profile = await getCurrentUserProfile();
          setUser(profile || null);
          console.log('[ROUTER] Session:', profile ? 'PRESENT' : 'NULL');
        }
      } catch (e) {
        console.error('[ROUTER] Boot error:', e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
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

  if (!fontsLoaded && !fontError) {
    return null;
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
        <StatusBar style="dark" />
        <AuthRouterGuard />
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
    fontFamily: FONTS.extraBold,
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
    fontFamily: FONTS.bold,
  },

  footerText: {
    color: '#71717A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 22,
  },
});
