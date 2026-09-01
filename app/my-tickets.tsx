import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ticket, ShoppingBag, ArrowRightLeft, Edit3, QrCode } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { getUserListings } from '../services/tickets';
import { getUserOrders } from '../services/orders';
import { Ticket as TicketType } from '../types/ticket';
import { Order } from '../types/order';
import { TicketCard } from '../components/TicketCard';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Loading } from '../components/Loading';
import { COLORS } from '../constants/colors';
import { formatCurrency, formatDate } from '../utils/formatting';
import { FONTS } from '../constants/typography';

type TabType = 'listings' | 'purchased' | 'sold' | 'exchanges';

export default function MyTicketsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('listings');
  const [listings, setListings] = useState<TicketType[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    if (!user) {
      setListings([]);
      setOrders([]);
      setLoading(false);
      return;
    }
    console.log('[MY TICKETS SCREEN] loading data for user.id:', user.id);
    try {
      setLoading(true);
      const userListings = await getUserListings(user.id);
      setListings(userListings);

      const userOrders = await getUserOrders(user.id);
      setOrders(userOrders);
    } catch (e: any) {
      console.error('[MY TICKETS SCREEN ERROR]', e?.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const soldListings = listings.filter((l) => l.status === 'sold');
  const myActiveListings = listings.filter((l) => l.status !== 'sold');

  return (
    <View style={styles.container}>
      {/* Top Segmented Tabs */}
      <View style={styles.tabsHeader}>
        {[
          { id: 'listings', label: 'My Listings' },
          { id: 'purchased', label: 'Purchased' },
          { id: 'sold', label: 'Sold' },
          { id: 'exchanges', label: 'Exchanges' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.8}
            style={[styles.tabChip, activeTab === tab.id ? styles.tabChipActive : null]}
            onPress={() => setActiveTab(tab.id as TabType)}
          >
            <Text style={[styles.tabText, activeTab === tab.id ? styles.tabTextActive : null]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <Loading message="Loading tickets..." />
      ) : activeTab === 'listings' ? (
        myActiveListings.length === 0 ? (
          <EmptyState
            title="No Listings Found"
            description="You haven't posted any tickets for sale yet. List your spare event tickets in seconds!"
            buttonTitle="List a Ticket Now"
            onButtonPress={() => router.push('/(tabs)/sell')}
          />
        ) : (
          <FlatList
            data={myActiveListings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={COLORS.primary} />}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <TicketCard
                  ticket={item}
                  onPress={() => router.push(`/ticket/${item.id}`)}
                  showActions={false}
                />
                <View style={styles.listingActionsRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => router.push({ pathname: '/ticket/edit', params: { ticketId: item.id } })}
                  >
                    <Edit3 size={14} color={COLORS.primary} />
                    <Text style={styles.editBtnText}>Edit Status ({item.status})</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      ) : activeTab === 'purchased' ? (
        orders.length === 0 ? (
          <EmptyState
            title="No Purchased Tickets"
            description="You haven't bought any tickets yet. Explore active listings on the home screen!"
            buttonTitle="Explore Events"
            onButtonPress={() => router.push('/(tabs)/home')}
          />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={COLORS.primary} />}
            renderItem={({ item }) => (
              <View style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderTitle}>{item.ticket?.event_name || 'Bengaluru Music Fest'}</Text>
                    <Text style={styles.orderSub}>
                      Order #{item.id} • Purchased on {formatDate(item.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.orderPrice}>{formatCurrency(item.total_amount)}</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.qrTicketBtn}
                  onPress={() => router.push({ pathname: '/digital-ticket', params: { orderId: item.id } })}
                >
                  <QrCode size={16} color={COLORS.white} />
                  <Text style={styles.qrTicketBtnText}>View Digital QR Ticket</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )
      ) : activeTab === 'sold' ? (
        soldListings.length === 0 ? (
          <EmptyState
            title="No Sold Tickets Yet"
            description="When buyers purchase your listed tickets, they will appear right here."
          />
        ) : (
          <FlatList
            data={soldListings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TicketCard ticket={item} onPress={() => router.push(`/ticket/${item.id}`)} showActions={false} />
            )}
          />
        )
      ) : (
        <View style={styles.exchangeTabContent}>
          <Button
            title="Open Exchange Requests Portal"
            onPress={() => router.push('/exchange')}
            icon={<ArrowRightLeft size={18} color={COLORS.white} />}
            style={{ width: '100%' }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 6,
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  cardWrapper: {
    marginBottom: 8,
  },
  listingActionsRow: {
    flexDirection: 'row',
    marginTop: -10,
    marginBottom: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  editBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONTS.bold,
    marginLeft: 6,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 14,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  orderTitle: {
    color: COLORS.textMain,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
  },
  orderSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONTS.semiBold,
  },
  orderPrice: {
    color: COLORS.success,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
  },
  qrTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  qrTicketBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginLeft: 8,
  },
  exchangeTabContent: {
    padding: 24,
  },
});
