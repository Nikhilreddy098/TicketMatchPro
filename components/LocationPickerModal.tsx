import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { MapPin, Search, Navigation, X, Check, Globe } from 'lucide-react-native';
import { Input } from './Input';
import { Button } from './Button';
import { POPULAR_CITIES, ALL_LOCATIONS_OPTION, searchCities } from '../constants/cities';
import { getCurrentLocationCity } from '../services/location';
import { COLORS } from '../constants/colors';

interface LocationPickerModalProps {
  visible: boolean;
  selectedCity: string;
  onClose: () => void;
  onSelectCity: (city: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  selectedCity,
  onClose,
  onSelectCity,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [detectingLocation, setDetectingLocation] = useState<boolean>(false);

  const filteredCities = searchCities(searchQuery);

  const handleSelect = (cityName: string) => {
    onSelectCity(cityName);
    onClose();
  };

  const handleUseCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      const city = await getCurrentLocationCity();
      handleSelect(city);
    } catch (e) {
      handleSelect('Hyderabad');
    } finally {
      setDetectingLocation(false);
    }
  };

  const isCustomQueryNew =
    searchQuery.trim().length > 0 &&
    !filteredCities.some((c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase());

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MapPin size={20} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Select Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7} style={styles.closeBtn}>
              <X size={20} color={COLORS.textMain} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Input
              placeholder="Search any city or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              leftIcon={<Search size={18} color={COLORS.textSecondary} />}
            />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Quick Actions */}
            <View style={styles.quickActionsRow}>
              {/* Use My Current Location Action */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.locationActionBtn}
                onPress={handleUseCurrentLocation}
              >
                <Navigation size={16} color={COLORS.primary} />
                <Text style={styles.locationActionText}>
                  {detectingLocation ? 'Detecting Location...' : 'Use My Current Location'}
                </Text>
              </TouchableOpacity>

              {/* All Locations Option */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.allLocationsBtn,
                  selectedCity === ALL_LOCATIONS_OPTION ? styles.allLocationsBtnActive : null,
                ]}
                onPress={() => handleSelect(ALL_LOCATIONS_OPTION)}
              >
                <Globe size={16} color={selectedCity === ALL_LOCATIONS_OPTION ? COLORS.white : COLORS.textMain} />
                <Text
                  style={[
                    styles.allLocationsText,
                    selectedCity === ALL_LOCATIONS_OPTION ? styles.allLocationsTextActive : null,
                  ]}
                >
                  All Locations
                </Text>
              </TouchableOpacity>
            </View>

            {/* Custom typed city selection fallback */}
            {isCustomQueryNew && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.customCityOption}
                onPress={() => handleSelect(searchQuery.trim())}
              >
                <MapPin size={18} color={COLORS.primary} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.customCityTitle}>Select "{searchQuery.trim()}"</Text>
                  <Text style={styles.customCitySub}>Filter marketplace tickets for {searchQuery.trim()}</Text>
                </View>
                <Check size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}

            {/* Popular Cities Grid */}
            {!searchQuery.trim() && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Popular Cities</Text>
                <View style={styles.popularGrid}>
                  {POPULAR_CITIES.map((city) => {
                    const isSelected = selectedCity.toLowerCase() === city.name.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={city.id}
                        activeOpacity={0.8}
                        style={[styles.cityChip, isSelected ? styles.cityChipSelected : null]}
                        onPress={() => handleSelect(city.name)}
                      >
                        <Text style={[styles.cityChipText, isSelected ? styles.cityChipTextSelected : null]}>
                          {city.name}
                        </Text>
                        {isSelected && <Check size={14} color={COLORS.white} style={{ marginLeft: 4 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* City List Results */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>
                {searchQuery.trim() ? 'Search Results' : 'All Cities'}
              </Text>
              {filteredCities.map((item) => {
                const isSelected = selectedCity.toLowerCase() === item.name.toLowerCase();
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.7}
                    style={styles.cityRow}
                    onPress={() => handleSelect(item.name)}
                  >
                    <MapPin size={16} color={isSelected ? COLORS.primary : COLORS.textMuted} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.cityName, isSelected ? styles.cityNameSelected : null]}>
                        {item.name}
                      </Text>
                      {item.state && <Text style={styles.cityState}>{item.state}</Text>}
                    </View>
                    {isSelected && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 17, 20, 0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: COLORS.textMain,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    marginBottom: 12,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  locationActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  locationActionText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  allLocationsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  allLocationsBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  allLocationsText: {
    color: COLORS.textMain,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  allLocationsTextActive: {
    color: COLORS.white,
  },
  customCityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.3)',
    marginBottom: 16,
  },
  customCityTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  customCitySub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  cityChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cityChipText: {
    color: COLORS.textMain,
    fontSize: 13,
    fontWeight: '600',
  },
  cityChipTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  cityName: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '700',
  },
  cityNameSelected: {
    color: COLORS.primary,
  },
  cityState: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
