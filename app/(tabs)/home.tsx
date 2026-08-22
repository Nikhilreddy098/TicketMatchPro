import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles, Shield, QrCode } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';
import { CATEGORIES, Category } from '../../constants/categories';
import { CategoryCard } from '../../components/CategoryCard';
import { EventCard } from '../../components/EventCard';
import { TicketCard } from '../../components/TicketCard';
import { SearchBar } from '../../components/SearchBar';
import { Avatar } from '../../components/Avatar';
import { NotificationBadge } from '../../components/NotificationBadge';
import { COLORS } from '../../constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { tickets, loading, refetch } = useTickets();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleCategoryPress = (cat: Category) => {
    if (selectedCategory === cat.id) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(cat.id);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (selectedCategory && t.category_id !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.event_name.toLowerCase().includes(q) ||
        t.venue.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const featuredTickets = tickets.slice(0, 4);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8} style={styles.userRow}>
            <Avatar url={user?.avatar_url} name={user?.full_name} size={42} isVerified={user?.is_verified} />
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.full_name || 'Guest User'}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.push('/admin')}
                style={styles.adminBadge}
                activeOpacity={0.8}
              >
                <Shield size={16} color={COLORS.secondary} />
                <Text style={styles.adminText}>Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push('/verify-ticket')} style={styles.verifyBtn} activeOpacity={0.8}>
              <QrCode size={20} color={COLORS.white} />
            </TouchableOpacity>
            <NotificationBadge count={2} onPress={() => router.push('/notifications')} />
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFilterPress={() => router.push('/(tabs)/search')}
          placeholder="Search concerts, sports, festivals..."
        />

        {/* Categories Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onSelect={handleCategoryPress}
            />
          ))}
        </ScrollView>

        {/* Featured Events Horizontal Carousel */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Sparkles size={16} color={COLORS.secondary} />
            <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>Featured Events</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
          {featuredTickets.map((item) => (
            <EventCard key={item.id} ticket={item} onPress={() => router.push(`/ticket/${item.id}`)} />
          ))}
        </ScrollView>

        {/* Popular Available Tickets Feed */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Tickets</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <ArrowRight size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tickets found</Text>
            <Text style={styles.emptySub}>Try searching for another event or category.</Text>
          </View>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onPress={() => router.push(`/ticket/${ticket.id}`)}
              onBuyPress={() => router.push({ pathname: '/payment/checkout', params: { ticketId: ticket.id } })}
              onExchangePress={() => router.push({ pathname: '/exchange/create', params: { targetTicketId: ticket.id } })}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingTextContainer: {
    marginLeft: 12,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  adminText: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  verifyBtn: {
    backgroundColor: COLORS.card,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
  },
  seeAllText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  categoriesScroll: {
    marginBottom: 10,
  },
  featuredScroll: {
    marginBottom: 10,
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
});
