import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Shield, QrCode, Ticket as TicketIcon, MapPin, ChevronDown } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTickets } from '../../hooks/useTickets';
import { CATEGORIES, Category } from '../../constants/categories';
import { CategoryCard } from '../../components/CategoryCard';
import { EventCard } from '../../components/EventCard';
import { TicketCard } from '../../components/TicketCard';
import { SearchBar } from '../../components/SearchBar';
import { Avatar } from '../../components/Avatar';
import { NotificationBadge } from '../../components/NotificationBadge';
import { Loading } from '../../components/Loading';
import { SectionHeader } from '../../components/SectionHeader';
import { Skeleton } from '../../components/Skeleton';
import { LocationPickerModal } from '../../components/LocationPickerModal';
import { ALL_LOCATIONS_OPTION } from '../../constants/cities';
import { getSavedMarketplaceLocation, saveMarketplaceLocation } from '../../services/location';
import { COLORS } from '../../constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>(ALL_LOCATIONS_OPTION);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);

  // Load saved location from storage on mount
  useEffect(() => {
    const loadLocation = async () => {
      const saved = await getSavedMarketplaceLocation();
      setSelectedLocation(saved);
    };
    loadLocation();
  }, []);

  const { tickets, loading, refetch } = useTickets({
    city: selectedLocation === ALL_LOCATIONS_OPTION ? undefined : selectedLocation,
    category_id: selectedCategory || undefined,
    query: searchQuery || undefined,
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch, selectedLocation])
  );

  const handleSelectLocation = async (cityName: string) => {
    setSelectedLocation(cityName);
    await saveMarketplaceLocation(cityName);
    refetch();
  };

  if (!user && !isLoading) {
    return <Loading message="Authenticating..." fullScreen />;
  }

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

  const featuredTickets = tickets.slice(0, 4);

  const dynamicSectionTitle =
    selectedLocation === ALL_LOCATIONS_OPTION
      ? 'All available tickets'
      : `Tickets in ${selectedLocation}`;

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
            <Avatar url={user?.avatar_url} name={user?.full_name} size={44} isVerified={user?.is_verified} />
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
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
                <Shield size={14} color={COLORS.primary} />
                <Text style={styles.adminText}>Admin</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push('/verify-ticket')} style={styles.verifyBtn} activeOpacity={0.8}>
              <QrCode size={18} color={COLORS.textMain} />
            </TouchableOpacity>
            <NotificationBadge count={2} onPress={() => router.push('/notifications')} />
          </View>
        </View>

        {/* Location Picker Header Trigger Badge */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.locationSelectorBadge}
          onPress={() => setIsLocationModalVisible(true)}
        >
          <MapPin size={16} color={COLORS.primary} />
          <Text style={styles.locationSelectorText}>
            {selectedLocation === ALL_LOCATIONS_OPTION ? 'All Locations' : selectedLocation}
          </Text>
          <ChevronDown size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Hero Title & Search Bar */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Find your next experience</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              refetch();
            }}
            onFilterPress={() => router.push('/(tabs)/search')}
            placeholder="Search events, artists, venues..."
          />
        </View>

        {/* Categories Horizontal Scroll */}
        <SectionHeader title="Categories" />

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
        <SectionHeader
          title="Featured Events"
          actionText="See all"
          onActionPress={() => router.push('/(tabs)/search')}
          icon={<Sparkles size={18} color={COLORS.primary} />}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredScroll}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton width={260} height={170} borderRadius={20} />
              <Skeleton width={260} height={170} borderRadius={20} />
            </View>
          ) : (
            featuredTickets.map((item) => (
              <EventCard key={item.id} ticket={item} onPress={() => router.push(`/ticket/${item.id}`)} />
            ))
          )}
        </ScrollView>

        {/* Dynamic Location-Based Marketplace Feed */}
        <SectionHeader
          title={dynamicSectionTitle}
          subtitle={
            selectedLocation === ALL_LOCATIONS_OPTION
              ? 'Real-time verified tickets from community sellers across all cities'
              : `Real-time verified tickets available in ${selectedLocation}`
          }
          actionText="View all"
          onActionPress={() => router.push('/(tabs)/search')}
        />

        {loading ? (
          <View style={{ gap: 14 }}>
            <Skeleton width="100%" height={160} borderRadius={20} />
            <Skeleton width="100%" height={160} borderRadius={20} />
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyCard}>
            <TicketIcon size={32} color={COLORS.primary} />
            <Text style={styles.emptyTitle}>
              {selectedLocation === ALL_LOCATIONS_OPTION
                ? 'No tickets found'
                : `No tickets found in ${selectedLocation} yet.`}
            </Text>
            <Text style={styles.emptySub}>
              Try searching for another city, category, or view all available listings.
            </Text>
            {selectedLocation !== ALL_LOCATIONS_OPTION && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.viewAllBtn}
                onPress={() => handleSelectLocation(ALL_LOCATIONS_OPTION)}
              >
                <Text style={styles.viewAllBtnText}>View All Locations</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          tickets.map((ticket) => (
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

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={isLocationModalVisible}
        selectedCity={selectedLocation}
        onClose={() => setIsLocationModalVisible(false)}
        onSelectCity={handleSelectLocation}
      />
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
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greetingTextContainer: {
    marginLeft: 10,
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  userName: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  adminText: {
    color: COLORS.primary,
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
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationSelectorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationSelectorText: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '800',
    marginHorizontal: 6,
  },
  heroSection: {
    marginBottom: 4,
  },
  heroTitle: {
    color: COLORS.textMain,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  categoriesScroll: {
    marginBottom: 8,
  },
  featuredScroll: {
    marginBottom: 8,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginVertical: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  emptyTitle: {
    color: COLORS.textMain,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  viewAllBtn: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  viewAllBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
