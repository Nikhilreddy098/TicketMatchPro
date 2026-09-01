import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Home, Search, PlusCircle, Heart, User } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function TabsLayout() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('[TABS LAYOUT GUARD] Logged out user accessed tabs -> NAVIGATING TO LOGIN');
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTintColor: COLORS.textMain,
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: COLORS.cardBorder,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          position: 'absolute',
          bottom: 12,
          left: 16,
          right: 16,
          borderRadius: 24,
          elevation: 8,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FONTS.bold,
        },
        sceneStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Browse',
          headerTitle: 'Find Tickets',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          headerTitle: 'List Your Ticket',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={[styles.sellIconBadge, focused ? styles.sellIconBadgeActive : null]}>
              <PlusCircle size={size} color={focused ? COLORS.white : COLORS.primary} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          headerTitle: 'Saved Tickets',
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sellIconBadge: {
    padding: 2,
    borderRadius: 14,
  },
  sellIconBadgeActive: {
    backgroundColor: COLORS.primary,
    padding: 4,
    borderRadius: 16,
  },
});
