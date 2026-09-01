import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Filter, X, ArrowDownUp, Check, MapPin } from 'lucide-react-native';
import { useTickets } from '../../hooks/useTickets';
import { SearchBar } from '../../components/SearchBar';
import { TicketCard } from '../../components/TicketCard';
import { CategoryCard } from '../../components/CategoryCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { LocationPickerModal } from '../../components/LocationPickerModal';
import { CATEGORIES } from '../../constants/categories';
import { ALL_LOCATIONS_OPTION } from '../../constants/cities';
import { getSavedMarketplaceLocation, saveMarketplaceLocation } from '../../services/location';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string>(ALL_LOCATIONS_OPTION);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'date'>('newest');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState<boolean>(false);

  useEffect(() => {
    const loadLocation = async () => {
      const saved = await getSavedMarketplaceLocation();
      setCityFilter(saved);
    };
    loadLocation();
  }, []);

  const { tickets, loading, refetch } = useTickets({
    query,
    category_id: selectedCategory || undefined,
    city: cityFilter === ALL_LOCATIONS_OPTION ? undefined : cityFilter,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    sortBy,
  });

  const handleSelectLocation = async (cityName: string) => {
    setCityFilter(cityName);
    await saveMarketplaceLocation(cityName);
    refetch();
  };

  const handleApplyFilter = () => {
    setIsFilterModalVisible(false);
    refetch();
  };

  const handleResetFilter = async () => {
    setSelectedCategory(null);
    setCityFilter(ALL_LOCATIONS_OPTION);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setIsFilterModalVisible(false);
    await saveMarketplaceLocation(ALL_LOCATIONS_OPTION);
    refetch();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <SearchBar
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            refetch();
          }}
          onFilterPress={() => setIsFilterModalVisible(true)}
          placeholder="Search event, venue, city..."
        />

        {/* Location Trigger Chip + Category Horizontal Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.locationChip,
              cityFilter !== ALL_LOCATIONS_OPTION ? styles.locationChipActive : null,
            ]}
            onPress={() => setIsLocationModalVisible(true)}
          >
            <MapPin size={14} color={cityFilter !== ALL_LOCATIONS_OPTION ? COLORS.white : COLORS.primary} />
            <Text
              style={[
                styles.locationChipText,
                cityFilter !== ALL_LOCATIONS_OPTION ? styles.locationChipTextActive : null,
              ]}
            >
              {cityFilter === ALL_LOCATIONS_OPTION ? 'All Locations' : cityFilter}
            </Text>
          </TouchableOpacity>

          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onSelect={(cat) => {
                setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                refetch();
              }}
            />
          ))}
        </ScrollView>

        {/* Results counter & Sort trigger */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>
            {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} available
            {cityFilter !== ALL_LOCATIONS_OPTION ? ` in ${cityFilter}` : ''}
          </Text>
          <TouchableOpacity
            style={styles.sortTrigger}
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <ArrowDownUp size={14} color={COLORS.primary} />
            <Text style={styles.sortTriggerText}>Sort & Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 14 }}>
          <Skeleton width="100%" height={160} borderRadius={20} />
          <Skeleton width="100%" height={160} borderRadius={20} />
        </View>
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No Matching Tickets"
          description={
            cityFilter !== ALL_LOCATIONS_OPTION
              ? `No active tickets found matching your search in ${cityFilter}. Try selecting All Locations or adjusting filters.`
              : "We couldn't find any tickets matching your search query or filters. Try adjusting your criteria."
          }
          buttonTitle="Reset Search Filters"
          onButtonPress={handleResetFilter}
        />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TicketCard
              ticket={item}
              onPress={() => router.push(`/ticket/${item.id}`)}
              onBuyPress={() => router.push({ pathname: '/payment/checkout', params: { ticketId: item.id } })}
              onExchangePress={() => router.push({ pathname: '/exchange/create', params: { targetTicketId: item.id } })}
            />
          )}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={isFilterModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Filter size={18} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Filter & Sort Tickets</Text>
              </View>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} activeOpacity={0.7}>
                <X size={22} color={COLORS.textMain} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              {/* Location Picker Trigger in Filter Modal */}
              <Text style={styles.filterSectionTitle}>Location / City</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.modalLocationBtn}
                onPress={() => {
                  setIsFilterModalVisible(false);
                  setIsLocationModalVisible(true);
                }}
              >
                <MapPin size={16} color={COLORS.primary} />
                <Text style={styles.modalLocationBtnText}>
                  {cityFilter === ALL_LOCATIONS_OPTION ? 'All Locations' : cityFilter}
                </Text>
              </TouchableOpacity>

              {/* Sort Options */}
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortGroup}>
                {[
                  { id: 'newest', label: 'Recently Listed' },
                  { id: 'price_low', label: 'Price: Low → High' },
                  { id: 'price_high', label: 'Price: High → Low' },
                  { id: 'date', label: 'Event Date' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.sortChip, sortBy === option.id ? styles.sortChipSelected : null]}
                    onPress={() => setSortBy(option.id as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sortChipText, sortBy === option.id ? styles.sortChipTextSelected : null]}>
                      {option.label}
                    </Text>
                    {sortBy === option.id && <Check size={14} color={COLORS.white} style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range */}
              <Text style={styles.filterSectionTitle}>Price Range (₹)</Text>
              <View style={styles.priceRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Input
                    placeholder="Min ₹"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Input
                    placeholder="Max ₹"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Reset All" variant="outline" onPress={handleResetFilter} style={{ flex: 1 }} />
              <Button title="Apply Filters" onPress={handleApplyFilter} style={{ flex: 1.5 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={isLocationModalVisible}
        selectedCity={cityFilter}
        onClose={() => setIsLocationModalVisible(false)}
        onSelectCity={handleSelectLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerArea: {
    padding: 16,
    paddingBottom: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginRight: 8,
  },
  locationChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  locationChipText: {
    color: COLORS.textMain,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginLeft: 6,
  },
  locationChipTextActive: {
    color: COLORS.white,
  },
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultsCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sortTriggerText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 20, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    marginLeft: 8,
  },
  modalBody: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    color: COLORS.textMain,
    fontSize: 15,
    fontFamily: FONTS.bold,
    marginBottom: 10,
    marginTop: 6,
  },
  modalLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  modalLocationBtnText: {
    color: COLORS.textMain,
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginLeft: 8,
  },
  sortGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sortChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  sortChipTextSelected: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  priceRow: {
    flexDirection: 'row',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
});
