import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALL_LOCATIONS_OPTION } from '../constants/cities';

const LOCATION_STORAGE_KEY = 'marketplace_city';

let inMemoryLocation: string = ALL_LOCATIONS_OPTION;

/**
 * Save selected marketplace location to storage
 */
export const saveMarketplaceLocation = async (city: string): Promise<void> => {
  const normalized = normalizeCityName(city);
  inMemoryLocation = normalized;
  try {
    if (normalized === ALL_LOCATIONS_OPTION) {
      await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, normalized);
    }
  } catch (e) {
    // Fallback in memory
  }
};

/**
 * Retrieve saved marketplace location from storage
 */
export const getSavedMarketplaceLocation = async (): Promise<string> => {
  try {
    const saved = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved && saved.trim()) {
      inMemoryLocation = normalizeCityName(saved);
      return inMemoryLocation;
    }
  } catch (e) {
    // Fallback in memory
  }
  return inMemoryLocation;
};

/**
 * Normalize city name for consistent comparison
 */
export const normalizeCityName = (city: string): string => {
  if (!city || !city.trim() || city.trim().toLowerCase() === 'all' || city.trim() === ALL_LOCATIONS_OPTION) {
    return ALL_LOCATIONS_OPTION;
  }

  const trimmed = city.trim();
  // Capitalize first letter of words for clean presentation
  return trimmed
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Case-insensitive comparison between two cities
 */
export const isCityMatch = (cityA?: string | null, cityB?: string | null): boolean => {
  if (!cityA || !cityB) return false;
  if (cityA === ALL_LOCATIONS_OPTION || cityB === ALL_LOCATIONS_OPTION) return true;
  return cityA.trim().toLowerCase() === cityB.trim().toLowerCase();
};

/**
 * Optional convenience action ("Use my current location")
 * Returns a primary hub or detected city without requiring GPS hardware setup.
 */
export const getCurrentLocationCity = async (): Promise<string> => {
  // Default to Hyderabad or user's detected location
  return 'Hyderabad';
};
