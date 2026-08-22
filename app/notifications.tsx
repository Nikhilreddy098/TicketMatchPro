import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, ArrowRightLeft, ShoppingBag, MessageSquare, Heart, Check } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/notifications';
import { AppNotification } from '../types/database';
import { EmptyState } from '../components/EmptyState';
import { Loading } from '../components/Loading';
import { COLORS } from '../constants/colors';
import { formatDate } from '../utils/formatting';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getUserNotifications(user.id);
      setNotifications(data);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handlePressNotification = async (notif: AppNotification) => {
    await markNotificationAsRead(notif.id);
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)));

    if (notif.type === 'exchange') router.push('/exchange');
    if (notif.type === 'order') router.push('/my-tickets');
    if (notif.type === 'chat') router.push('/chat');
  };

  const renderIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'exchange':
        return <ArrowRightLeft size={18} color={COLORS.secondary} />;
      case 'order':
        return <ShoppingBag size={18} color={COLORS.success} />;
      case 'chat':
        return <MessageSquare size={18} color={COLORS.primary} />;
      case 'favorite':
        return <Heart size={18} color={COLORS.error} />;
      default:
        return <Bell size={18} color={COLORS.warning} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Activity Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <Loading message="Fetching notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications"
          description="You're all caught up! Updates regarding ticket sales, exchanges, and messages will show up here."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} tintColor={COLORS.primary} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.notifCard, !item.is_read ? styles.unreadCard : null]}
              onPress={() => handlePressNotification(item)}
            >
              <View style={styles.iconCircle}>{renderIcon(item.type)}</View>
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{item.title}</Text>
                  {!item.is_read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.timestamp}>{formatDate(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  markReadText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 10,
  },
  unreadCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  body: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  timestamp: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
});
