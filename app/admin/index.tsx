import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, Ticket, DollarSign, ArrowRightLeft, AlertCircle, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { getAdminStats } from '../../services/admin';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/colors';
import { formatCurrency } from '../../utils/formatting';
import { FONTS } from '../../constants/typography';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 142,
    activeListings: 89,
    totalSalesVolume: 345000,
    totalExchanges: 47,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const data = await getAdminStats();
      setStats(data);
    };
    fetchStats();
  }, []);

  if (!isAdmin) {
    return (
      <View style={styles.unauthorizedContainer}>
        <AlertCircle size={48} color={COLORS.error} />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedSub}>This portal is restricted to TicketMatchPro administrators.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Header Banner */}
      <View style={styles.adminHeaderCard}>
        <ShieldCheck size={28} color={COLORS.secondary} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.adminTitle}>Admin Control Dashboard</Text>
          <Text style={styles.adminSub}>Platform Moderator Access ({user?.email})</Text>
        </View>
      </View>

      {/* Analytics Stats Grid */}
      <Text style={styles.sectionHeader}>Platform Overview</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(124, 58, 237, 0.15)' }]}>
            <Users size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statVal}>{stats.totalUsers}</Text>
          <Text style={styles.statLab}>Total Users</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <Ticket size={20} color={COLORS.secondary} />
          </View>
          <Text style={styles.statVal}>{stats.activeListings}</Text>
          <Text style={styles.statLab}>Active Listings</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
            <DollarSign size={20} color={COLORS.success} />
          </View>
          <Text style={styles.statVal}>{formatCurrency(stats.totalSalesVolume)}</Text>
          <Text style={styles.statLab}>Volume</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <ArrowRightLeft size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.statVal}>{stats.totalExchanges}</Text>
          <Text style={styles.statLab}>Exchanges</Text>
        </View>
      </View>

      {/* Management Navigation Links */}
      <Text style={styles.sectionHeader}>Management Sections</Text>
      <View style={styles.menuGroup}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/users')}>
          <Users size={20} color={COLORS.primary} />
          <Text style={styles.menuText}>User Management</Text>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/tickets')}>
          <Ticket size={20} color={COLORS.secondary} />
          <Text style={styles.menuText}>Ticket Listing Moderation</Text>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/transactions')}>
          <DollarSign size={20} color={COLORS.success} />
          <Text style={styles.menuText}>Order Transactions Log</Text>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/admin/reports')}>
          <AlertCircle size={20} color={COLORS.error} />
          <Text style={styles.menuText}>User Reports & Flagged Listings</Text>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    backgroundColor: COLORS.background,
    paddingBottom: 40,
  },
  adminHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 20,
  },
  adminTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
  },
  adminSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statVal: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.extraBold,
  },
  statLab: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  menuGroup: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  menuText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15,
    fontFamily: FONTS.semiBold,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
  },
  unauthorizedContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  unauthorizedTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginTop: 12,
  },
  unauthorizedSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
});
