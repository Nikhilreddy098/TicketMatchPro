import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Ticket,
  ShoppingBag,
  ArrowRightLeft,
  Heart,
  Bell,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Star,
  ChevronRight,
  ShieldAlert,
  QrCode,
} from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/typography';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out of TicketMatchPro?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileHeaderCard}>
          <Avatar url={user?.avatar_url} name={user?.full_name} size={80} isVerified={user?.is_verified} />

          <Text style={styles.userName}>{user?.full_name || 'Guest User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>

          {user?.bio && <Text style={styles.userBio}>{user.bio}</Text>}

          <View style={styles.badgeRow}>
            {user?.is_verified && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={13} color={COLORS.success} />
                <Text style={styles.verifiedBadgeText}>Verified Trader</Text>
              </View>
            )}

            <View style={styles.ratingBadge}>
              <Star size={13} color={COLORS.warning} fill={COLORS.warning} />
              <Text style={styles.ratingBadgeText}>{user?.rating || 5.0} Rating</Text>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{user?.total_sales || 0}</Text>
              <Text style={styles.statLabel}>Tickets Sold</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{user?.total_purchases || 0}</Text>
              <Text style={styles.statLabel}>Purchased</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{user?.total_exchanges || 0}</Text>
              <Text style={styles.statLabel}>Exchanged</Text>
            </View>
          </View>

          <Button
            title="Edit Profile"
            variant="outline"
            size="small"
            onPress={() => router.push('/edit-profile')}
            style={styles.editProfileBtn}
          />
        </View>

        {/* Quick Admin Access (if Admin Role) */}
        {isAdmin && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.adminBanner}
            onPress={() => router.push('/admin')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ShieldAlert size={20} color={COLORS.primary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.adminBannerTitle}>Admin Control Center</Text>
                <Text style={styles.adminBannerSub}>Moderate listings, users & transactions</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Menu Options */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuSectionHeader}>My Activity</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/my-tickets')} activeOpacity={0.7}>
            <View style={styles.menuIconCircle}>
              <Ticket size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>My Tickets & Listings</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/orders')} activeOpacity={0.7}>
            <View style={styles.menuIconCircle}>
              <ShoppingBag size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>My Orders</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/exchange/index')} activeOpacity={0.7}>
            <View style={styles.menuIconCircle}>
              <ArrowRightLeft size={18} color={COLORS.secondary} />
            </View>
            <Text style={styles.menuText}>Exchange Requests</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/favorites')} activeOpacity={0.7}>
            <View style={styles.menuIconCircle}>
              <Heart size={18} color={COLORS.error} />
            </View>
            <Text style={styles.menuText}>Saved Favorites</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')} activeOpacity={0.7}>
            <View style={styles.menuIconCircle}>
              <Bell size={18} color={COLORS.warning} />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuGroup}>
          <Text style={styles.menuSectionHeader}>Settings & Support</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/verify-ticket')} activeOpacity={0.7}>
            <View style={styles.menuIconCircle}>
              <QrCode size={18} color={COLORS.success} />
            </View>
            <Text style={styles.menuText}>Verify Ticket QR Code</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')} activeOpacity={0.7}>
            <View style={styles.menuIconCircle}>
              <SettingsIcon size={18} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.menuText}>Settings & Preferences</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings')} activeOpacity={0.7}>
            <View style={styles.menuIconCircle}>
              <HelpCircle size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Help & Support</Text>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIconCircle, { backgroundColor: COLORS.errorBg }]}>
              <LogOut size={18} color={COLORS.error} />
            </View>
            <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 90,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  userName: {
    color: COLORS.textMain,
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    marginTop: 12,
  },
  userEmail: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  userBio: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    color: COLORS.success,
    fontSize: 11,
    fontFamily: FONTS.bold,
    marginLeft: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingBadgeText: {
    color: COLORS.warning,
    fontSize: 11,
    fontFamily: FONTS.bold,
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 18,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: COLORS.textMain,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: COLORS.cardBorder,
  },
  editProfileBtn: {
    marginTop: 18,
    width: '100%',
  },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.secondaryLight,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
    marginBottom: 16,
  },
  adminBannerTitle: {
    color: COLORS.textMain,
    fontSize: 15,
    fontFamily: FONTS.extraBold,
  },
  adminBannerSub: {
    color: COLORS.primary,
    fontSize: 12,
    marginTop: 2,
  },
  menuGroup: {
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
  menuSectionHeader: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontFamily: FONTS.extraBold,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuText: {
    flex: 1,
    color: COLORS.textMain,
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
});
