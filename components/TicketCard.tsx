import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Heart, ArrowRightLeft, ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { Ticket } from '../types/ticket';
import { formatCurrency, formatDate } from '../utils/formatting';
import { Avatar } from './Avatar';
import { toggleFavorite } from '../services/favorites';
import { useAuth } from '../hooks/useAuth';
import { FONTS } from '../constants/typography';

interface TicketCardProps {
  ticket: Ticket;
  onPress: () => void;
  onBuyPress?: () => void;
  onExchangePress?: () => void;
  showActions?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onPress,
  onBuyPress,
  onExchangePress,
  showActions = true,
}) => {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState<boolean>(ticket.is_favorite || false);

  const handleFavoriteToggle = async () => {
    if (!user) return;
    const newState = await toggleFavorite(user.id, ticket.id);
    setIsFav(newState);
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <Image source={{ uri: ticket.image_url }} style={styles.image} />
        <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoriteToggle} activeOpacity={0.8}>
          <Heart size={18} color={isFav ? COLORS.error : COLORS.white} fill={isFav ? COLORS.error : 'transparent'} />
        </TouchableOpacity>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{ticket.ticket_type}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.eventName} numberOfLines={1}>
          {ticket.event_name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{formatDate(ticket.event_date)}</Text>
          </View>
          <View style={[styles.metaItem, { marginLeft: 12 }]}>
            <MapPin size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {ticket.venue}, {ticket.city}
            </Text>
          </View>
        </View>

        <View style={styles.seatInfoContainer}>
          <Text style={styles.seatText}>
            Sec <Text style={styles.seatHighlight}>{ticket.section}</Text> • Row <Text style={styles.seatHighlight}>{ticket.row || 'N/A'}</Text> • Seat <Text style={styles.seatHighlight}>{ticket.seat || 'N/A'}</Text>
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          {ticket.seller && (
            <View style={styles.sellerRow}>
              <Avatar url={ticket.seller.avatar_url} name={ticket.seller.full_name} size={28} isVerified={ticket.seller.is_verified} />
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName} numberOfLines={1}>
                  {ticket.seller.full_name}
                </Text>
                {ticket.seller.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={11} color={COLORS.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={styles.priceContainer}>
            {ticket.original_price > ticket.selling_price && (
              <Text style={styles.originalPrice}>{formatCurrency(ticket.original_price)}</Text>
            )}
            <Text style={styles.sellingPrice}>{formatCurrency(ticket.selling_price)}</Text>
          </View>
        </View>

        {showActions && (
          <View style={styles.actionButtonsRow}>
            {onExchangePress && (
              <TouchableOpacity activeOpacity={0.8} style={styles.exchangeBtn} onPress={onExchangePress}>
                <ArrowRightLeft size={14} color={COLORS.primary} />
                <Text style={styles.exchangeBtnText}>Exchange</Text>
              </TouchableOpacity>
            )}
            {onBuyPress && (
              <TouchableOpacity activeOpacity={0.8} style={styles.buyBtn} onPress={onBuyPress}>
                <Text style={styles.buyBtnText}>Buy Ticket</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    height: 125,
    width: '100%',
    position: 'relative',
    backgroundColor: '#E9E9EF',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(17, 17, 20, 0.45)',
    padding: 8,
    borderRadius: 20,
  },
  categoryTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  body: {
    padding: 16,
  },
  eventName: {
    color: COLORS.textMain,
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  seatInfoContainer: {
    backgroundColor: COLORS.background,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  seatText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  seatHighlight: {
    color: COLORS.textMain,
    fontFamily: FONTS.bold,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sellerDetails: {
    marginLeft: 8,
  },
  sellerName: {
    color: COLORS.textMain,
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedText: {
    color: COLORS.success,
    fontSize: 10,
    marginLeft: 2,
    fontFamily: FONTS.semiBold,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  originalPrice: {
    color: COLORS.textMuted,
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  sellingPrice: {
    color: COLORS.primary,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  exchangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondaryLight,
    paddingVertical: 11,
    borderRadius: 12,
  },
  exchangeBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginLeft: 6,
  },
  buyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 11,
    borderRadius: 12,
  },
  buyBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
});
