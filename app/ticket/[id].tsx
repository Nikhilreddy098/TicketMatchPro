import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, ShieldCheck, Heart, ArrowRightLeft, MessageSquare, ShoppingBag, Star, UserCheck, CheckCircle } from 'lucide-react-native';
import { getTicketById } from '../../services/tickets';
import { startConversation } from '../../services/chat';
import { toggleFavorite } from '../../services/favorites';
import { hasPendingExchangeRequest } from '../../services/exchange';
import { useAuth } from '../../hooks/useAuth';
import { Ticket } from '../../types/ticket';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatting';
import { FONTS } from '../../constants/typography';

export default function TicketDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFav, setIsFav] = useState<boolean>(false);
  const [isPendingExchange, setIsPendingExchange] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getTicketById(id);
        setTicket(data);
        if (data?.is_favorite) setIsFav(true);

        if (user && data) {
          const hasPending = await hasPendingExchangeRequest(user.id, data.id);
          setIsPendingExchange(hasPending);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, user]);

  const handleFavoriteToggle = async () => {
    if (!user || !ticket) {
      Alert.alert('Sign In Required', 'Please log in to save tickets to your favorites.');
      return;
    }
    const newState = await toggleFavorite(user.id, ticket.id);
    setIsFav(newState);
  };

  const handleMessageSeller = async () => {
    if (!user || !ticket) {
      Alert.alert('Sign In Required', 'Please log in to message sellers.');
      return;
    }
    if (ticket.seller_id === user.id) {
      Alert.alert('Notice', 'This is your own ticket listing.');
      return;
    }
    try {
      const conv = await startConversation(ticket.id, user.id, ticket.seller_id);
      router.push(`/chat/${conv.id}`);
    } catch (e: any) {
      Alert.alert('Chat Error', e?.message || 'Could not start conversation.');
    }
  };

  const handleBuy = () => {
    if (!ticket) return;
    if (user && ticket.seller_id === user.id) {
      Alert.alert('Own Ticket', 'You cannot buy your own ticket listing.');
      return;
    }
    router.push({ pathname: '/payment/checkout', params: { ticketId: ticket.id } });
  };

  const handleExchange = () => {
    if (!ticket) return;
    if (!user) {
      Alert.alert('Sign In Required', 'Please log in to request a ticket exchange.', [
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (ticket.seller_id === user.id) {
      Alert.alert('Own Ticket', 'This is your ticket. You cannot request an exchange for your own listing.');
      return;
    }
    if (isPendingExchange) {
      Alert.alert('Pending Request', 'You already have a pending exchange request for this ticket.', [
        { text: 'View Requests', onPress: () => router.push('/exchange') },
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }
    router.push({ pathname: '/exchange/create', params: { targetTicketId: ticket.id } });
  };

  if (loading) return <Loading message="Loading ticket details..." />;

  if (!ticket) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Ticket Not Found</Text>
        <Text style={styles.errorSub}>This ticket listing may have been removed or sold.</Text>
        <Button title="Back to Marketplace" onPress={() => router.replace('/(tabs)/home')} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const isOwner = user?.id === ticket.seller_id;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Image Header */}
        <View style={styles.imageCard}>
          <Image source={{ uri: ticket.image_url }} style={styles.bannerImage} />
          <TouchableOpacity style={styles.favBtn} onPress={handleFavoriteToggle} activeOpacity={0.8}>
            <Heart size={20} color={isFav ? COLORS.error : COLORS.white} fill={isFav ? COLORS.error : 'transparent'} />
          </TouchableOpacity>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{ticket.ticket_type}</Text>
          </View>
        </View>

        {/* Owner Banner Notice */}
        {isOwner && (
          <View style={styles.ownerNoticeBanner}>
            <UserCheck size={18} color={COLORS.primary} />
            <Text style={styles.ownerNoticeText}>This is your ticket listing</Text>
          </View>
        )}

        {/* Title & Info Card */}
        <View style={styles.card}>
          <Text style={styles.eventName}>{ticket.event_name}</Text>

          <View style={styles.metaGroup}>
            <View style={styles.metaRow}>
              <Calendar size={16} color={COLORS.primary} />
              <Text style={styles.metaText}>{formatDate(ticket.event_date)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Clock size={16} color={COLORS.secondary} />
              <Text style={styles.metaText}>{formatTime(ticket.event_time)}</Text>
            </View>
            <View style={styles.metaRow}>
              <MapPin size={16} color={COLORS.error} />
              <Text style={styles.metaText} numberOfLines={2}>
                {ticket.venue}, {ticket.city}
              </Text>
            </View>
          </View>

          {/* Seat Breakdown */}
          <Text style={styles.sectionTitle}>Seating Breakdown</Text>
          <View style={styles.seatGrid}>
            <View style={styles.seatBox}>
              <Text style={styles.seatLabel}>Section</Text>
              <Text style={styles.seatValue}>{ticket.section}</Text>
            </View>
            <View style={styles.seatBox}>
              <Text style={styles.seatLabel}>Row</Text>
              <Text style={styles.seatValue}>{ticket.row || 'N/A'}</Text>
            </View>
            <View style={styles.seatBox}>
              <Text style={styles.seatLabel}>Seat</Text>
              <Text style={styles.seatValue}>{ticket.seat || 'N/A'}</Text>
            </View>
            <View style={styles.seatBox}>
              <Text style={styles.seatLabel}>Quantity</Text>
              <Text style={styles.seatValue}>{ticket.quantity}</Text>
            </View>
          </View>

          {ticket.description && (
            <>
              <Text style={styles.sectionTitle}>Seller Description</Text>
              <Text style={styles.descriptionText}>{ticket.description}</Text>
            </>
          )}
        </View>

        {/* Seller Info Card */}
        {ticket.seller && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ticket Seller</Text>
            <View style={styles.sellerHeader}>
              <Avatar
                url={ticket.seller.avatar_url}
                name={ticket.seller.full_name}
                size={50}
                isVerified={ticket.seller.is_verified}
              />
              <View style={styles.sellerDetails}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.sellerName}>{ticket.seller.full_name}</Text>
                  {ticket.seller.is_verified && <ShieldCheck size={16} color={COLORS.success} style={{ marginLeft: 6 }} />}
                </View>
                <View style={styles.ratingRow}>
                  <Star size={13} color={COLORS.warning} fill={COLORS.warning} />
                  <Text style={styles.ratingText}>
                    {ticket.seller.rating} • {ticket.seller.total_sales} tickets sold
                  </Text>
                </View>
              </View>

              {!isOwner && (
                <TouchableOpacity activeOpacity={0.8} style={styles.chatBtn} onPress={handleMessageSeller}>
                  <MessageSquare size={18} color={COLORS.primary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Price & Purchase Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceGroup}>
          <Text style={styles.priceLabel}>Selling Price</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.bottomPrice}>{formatCurrency(ticket.selling_price)}</Text>
            {ticket.original_price > ticket.selling_price && (
              <Text style={styles.bottomOriginal}>{formatCurrency(ticket.original_price)}</Text>
            )}
          </View>
        </View>

        <View style={styles.bottomActionsGroup}>
          {isOwner ? (
            <View style={styles.ownerBadgeBox}>
              <Text style={styles.ownerBadgeText}>This is your ticket</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.exchangeBarBtn,
                  isPendingExchange ? styles.exchangeBarBtnPending : null,
                ]}
                onPress={handleExchange}
              >
                {isPendingExchange ? (
                  <CheckCircle size={16} color={COLORS.warning} />
                ) : (
                  <ArrowRightLeft size={16} color={COLORS.primary} />
                )}
                <Text
                  style={[
                    styles.exchangeBarBtnText,
                    isPendingExchange ? { color: COLORS.warning } : null,
                  ]}
                >
                  {isPendingExchange ? 'Pending' : 'Exchange'}
                </Text>
              </TouchableOpacity>

              <Button
                title="BUY TICKET"
                onPress={handleBuy}
                icon={<ShoppingBag size={16} color={COLORS.white} />}
                style={styles.buyBarBtn}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  imageCard: {
    height: 210,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(17, 17, 20, 0.75)',
    padding: 10,
    borderRadius: 20,
  },
  categoryTag: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  ownerNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  ownerNoticeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginLeft: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  eventName: {
    color: COLORS.textMain,
    fontSize: 22,
    fontFamily: FONTS.extraBold,
    marginBottom: 14,
  },
  metaGroup: {
    gap: 10,
    marginBottom: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 10,
    fontFamily: FONTS.semiBold,
  },
  sectionTitle: {
    color: COLORS.textMain,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    marginBottom: 12,
    marginTop: 8,
  },
  seatGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  seatBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  seatLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  seatValue: {
    color: COLORS.textMain,
    fontSize: 15,
    fontFamily: FONTS.extraBold,
    marginTop: 2,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  sellerName: {
    color: COLORS.textMain,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
    fontFamily: FONTS.semiBold,
  },
  chatBtn: {
    backgroundColor: COLORS.secondaryLight,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomPriceGroup: {
    flex: 1,
  },
  priceLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  bottomPrice: {
    color: COLORS.success,
    fontSize: 22,
    fontFamily: FONTS.extraBold,
  },
  bottomOriginal: {
    color: COLORS.textMuted,
    fontSize: 13,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  bottomActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exchangeBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  exchangeBarBtnPending: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warning,
  },
  exchangeBarBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginLeft: 6,
  },
  buyBarBtn: {
    paddingHorizontal: 18,
  },
  ownerBadgeBox: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(108, 59, 255, 0.2)',
  },
  ownerBadgeText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    color: COLORS.textMain,
    fontSize: 20,
    fontFamily: FONTS.extraBold,
  },
  errorSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
