import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Lock, HelpCircle, FileText, Trash2, ChevronRight, Globe, Shield, Info } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { COLORS } from '../constants/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

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
      <Text style={styles.sectionHeader}>Account</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.iconCircle}>
            <Bell size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.settingTitle}>Notifications</Text>
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

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => Alert.alert('Privacy', 'Your profile and data are secured with end-to-end Supabase encryption.')}
        >
          <View style={styles.iconCircle}>
            <Lock size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.settingTitle}>Privacy & Security</Text>
            <Text style={styles.settingSub}>Manage profile visibility and password</Text>
          </View>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>App</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => Alert.alert('Language', 'Current language: English (India)')}
        >
          <View style={styles.iconCircle}>
            <Globe size={18} color={COLORS.secondary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.settingTitle}>Language</Text>
            <Text style={styles.settingSub}>English (IN)</Text>
          </View>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Support</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => Alert.alert('Help Center', 'Need assistance? Email support@ticketmatchpro.app')}
        >
          <View style={styles.iconCircle}>
            <HelpCircle size={18} color={COLORS.success} />
          </View>
          <Text style={[styles.settingTitle, { flex: 1, marginLeft: 12 }]}>Help Center</Text>
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

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.settingRow}
          onPress={() => Alert.alert('About TicketMatchPro', 'TicketMatchPro v1.0.0 — Peer-to-Peer Ticket Marketplace')}
        >
          <View style={styles.iconCircle}>
            <Info size={18} color={COLORS.primary} />
          </View>
          <Text style={[styles.settingTitle, { flex: 1, marginLeft: 12 }]}>About TicketMatchPro</Text>
          <ChevronRight size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Danger Zone</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount}>
          <View style={[styles.iconCircle, { backgroundColor: COLORS.errorBg }]}>
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
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    color: COLORS.textMain,
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    color: COLORS.textSecondary,
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
