import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Moon, Lock, HelpCircle, FileText, Trash2, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState<boolean>(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your TicketMatchPro account? All active listings and ticket history will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionHeader}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.iconCircle}>
            <Bell size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.settingTitle}>Push Notifications</Text>
            <Text style={styles.settingSub}>Alerts for exchanges, purchases, and messages</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.iconCircle}>
            <Moon size={18} color={COLORS.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.settingTitle}>Dark Theme Always</Text>
            <Text style={styles.settingSub}>Optimized for high contrast dark aesthetic</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{ false: COLORS.cardBorder, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      <Text style={styles.sectionHeader}>Support & Legal</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => Alert.alert('Help Center', 'Need assistance? Email support@ticketmatchpro.app')}
        >
          <View style={styles.iconCircle}>
            <HelpCircle size={18} color={COLORS.success} />
          </View>
          <Text style={[styles.settingTitle, { flex: 1, marginLeft: 12 }]}>Help & Support</Text>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => Alert.alert('Terms of Service', 'TicketMatchPro Peer-to-Peer Marketplace Terms v1.0')}
        >
          <View style={styles.iconCircle}>
            <FileText size={18} color={COLORS.warning} />
          </View>
          <Text style={[styles.settingTitle, { flex: 1, marginLeft: 12 }]}>Terms & Privacy Policy</Text>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Danger Zone</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount}>
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <Trash2 size={18} color={COLORS.error} />
          </View>
          <Text style={[styles.settingTitle, { color: COLORS.error, flex: 1, marginLeft: 12 }]}>
            Delete Account
          </Text>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.appVersionText}>TicketMatchPro v1.0.0 (Build 2026.08)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    backgroundColor: COLORS.background,
    paddingBottom: 40,
  },
  sectionHeader: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  settingSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 10,
  },
  appVersionText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
