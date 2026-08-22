import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Filter, X, ArrowDownUp, Check } from 'lucide-react-native';
import { useTickets } from '../../hooks/useTickets';
import { SearchBar } from '../../components/SearchBar';
import { TicketCard } from '../../components/TicketCard';
import { CategoryCard } from '../../components/CategoryCard';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { EmptyState } from '../../components/EmptyState';
import { Loading } from '../../components/Loading';
import { CATEGORIES, Category } from '../../constants/categories';
import { COLORS } from '../../constants/colors';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'date'>('newest');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState<boolean>(false);

  const { tickets, loading, refetch } = useTickets({
    query,
    category_id: selectedCategory || undefined,
    city: cityFilter || undefined,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    sortBy,
  });

  const handleApplyFilter = () => {
    setIsFilterModalVisible(false);
    refetch();
  };

  const handleResetFilter = () => {
    setSelectedCategory(null);
    setCityFilter('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setIsFilterModalVisible(false);
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

        {/* Results counter & Sort summary */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsCount}>
            {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'} available
          </Text>
          <TouchableOpacity
            style={styles.sortTrigger}
            onPress={() => setIsFilterModalVisible(true)}
            activeOpacity={0.8}
          >
            <ArrowDownUp size={14} color={COLORS.secondary} />
            <Text style={styles.sortTriggerText}>Sort & Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <Loading message="Searching tickets..." />
      ) : tickets.length === 0 ? (
        <EmptyState
          title="No Matching Tickets"
          description="We couldn't find any tickets matching your search query or filters. Try adjusting your criteria."
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
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <X size={22} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
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
                  >
                    <Text style={[styles.sortChipText, sortBy === option.id ? styles.sortChipTextSelected : null]}>
                      {option.label}
                    </Text>
                    {sortBy === option.id && <Check size={14} color={COLORS.white} style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category Filter */}
              <Text style={styles.filterSectionTitle}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {CATEGORIES.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    isSelected={selectedCategory === category.id}
                    onSelect={(cat) => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  />
                ))}
              </ScrollView>

              {/* Location City */}
              <Input
                label="City / Location"
                placeholder="e.g. Bengaluru, New Delhi, Mumbai"
                value={cityFilter}
                onChangeText={setCityFilter}
              />

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
  resultsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultsCount: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  sortTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sortTriggerText: {
    color: COLORS.secondary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
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
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalBody: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6,
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
    fontWeight: '500',
  },
  sortChipTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
});
