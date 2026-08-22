import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, ShieldCheck, Heart, ArrowRightLeft, MessageSquare, ShoppingBag, Star } from 'lucide-react-native';
import { getTicketById } from '../../services/tickets';
import { startConversation } from '../../services/chat';
import { toggleFavorite } from '../../services/favorites';
import { useAuth } from '../../hooks/useAuth';
import { Ticket } from '../../types/ticket';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { Loading } from '../../components/Loading';
import { COLORS } from '../../constants/colors';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatting';

export default function TicketDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFav, setIsFav] = useState<boolean>(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getTicketById(id);
        setTicket(data);
        if (data?.is_favorite) setIsFav(true);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleFavoriteToggle = async () => {
    if (!user || !ticket) return;
    const newState = await toggleFavorite(user.id, ticket.id);
    setIsFav(newState);
  };

  const handleMessageSeller = async () => {
    if (!user || !ticket) return;
    if (ticket.seller_id === user.id) {
      Alert.alert('Notice', 'This is your own ticket listing.');
      return;
    }
    const conv = await startConversation(ticket.id, user.id, ticket.seller_id);
    router.push(`/chat/${conv.id}`);
  };

  const handleBuy = () => {
    if (!ticket) return;
    router.push({ pathname: '/payment/checkout', params: { ticketId: ticket.id } });
  };

  const handleExchange = () => {
    if (!ticket) return;
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

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Image Header */}
        <View style={styles.imageCard}>
          <Image source={{ uri: ticket.image_url }} style={styles.bannerImage} />
          <TouchableOpacity style={styles.favBtn} onPress={handleFavoriteToggle}>
            <Heart size={20} color={isFav ? COLORS.error : COLORS.white} fill={isFav ? COLORS.error : 'transparent'} />
          </TouchableOpacity>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{ticket.ticket_type}</Text>
          </View>
        </View>

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
              <Text style={styles.seatLabel}>Qty</Text>
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

              <TouchableOpacity activeOpacity={0.8} style={styles.chatBtn} onPress={handleMessageSeller}>
                <MessageSquare size={18} color={COLORS.primary} />
              </TouchableOpacity>
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
          <TouchableOpacity activeOpacity={0.8} style={styles.exchangeBarBtn} onPress={handleExchange}>
            <ArrowRightLeft size={16} color={COLORS.secondary} />
          </TouchableOpacity>
          <Button
            title="BUY TICKET"
            onPress={handleBuy}
            icon={<ShoppingBag size={16} color={COLORS.white} />}
            style={styles.buyBarBtn}
          />
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
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(9, 9, 11, 0.7)',
    padding: 10,
    borderRadius: 20,
  },
  categoryTag: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
  },
  eventName: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 12,
  },
  metaGroup: {
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 6,
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
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  seatLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  seatValue: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
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
  },
  chatBtn: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
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
  },
  bottomPriceGroup: {
    flex: 1,
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  bottomPrice: {
    color: COLORS.success,
    fontSize: 22,
    fontWeight: '800',
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
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  buyBarBtn: {
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
  },
  errorSub: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
