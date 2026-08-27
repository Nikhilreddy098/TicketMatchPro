import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { Loading } from '../components/Loading';
import { COLORS } from '../constants/colors';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('[INDEX ROUTE CHECK] isLoading:', isLoading, 'user:', user?.id || 'NO USER');
    if (!isLoading) {
      if (user) {
        console.log('NAVIGATING TO HOME');
        router.replace('/(tabs)/home');
      } else {
        console.log('NAVIGATING TO LOGIN');
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading, router]);

  return (
    <View style={styles.container}>
      <Loading message="Launching TicketMatchPro..." fullScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
