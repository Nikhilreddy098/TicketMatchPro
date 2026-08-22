import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

export const isSupabaseConfigured = () => {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder')
  );
};

const getAsyncStorage = () => {
  if (AsyncStorage && typeof AsyncStorage.getItem === 'function') return AsyncStorage;
  if (AsyncStorage && (AsyncStorage as any).default && typeof (AsyncStorage as any).default.getItem === 'function') {
    return (AsyncStorage as any).default;
  }
  return null;
};

// Platform & SSR safe storage adapter for Supabase Auth session persistence
const ExpoSupabaseStorage = {
  getItem: (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' || typeof window !== 'undefined') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null);
    }
    const storage = getAsyncStorage();
    if (storage) return storage.getItem(key);
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' || typeof window !== 'undefined') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return Promise.resolve();
    }
    const storage = getAsyncStorage();
    if (storage) return storage.setItem(key);
    return Promise.resolve();
  },
  removeItem: (key: string): Promise<void> => {
    if (Platform.OS === 'web' || typeof window !== 'undefined') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return Promise.resolve();
    }
    const storage = getAsyncStorage();
    if (storage) return storage.removeItem(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSupabaseStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

