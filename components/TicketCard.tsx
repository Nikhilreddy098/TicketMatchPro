import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, MapPin, Heart, ArrowRightLeft, ShieldCheck } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { Ticket } from '../types/ticket';
import { formatCurrency, formatDate } from '../utils/formatting';
import { Avatar } from './Avatar';
import { toggleFavorite } from '../services/favorites';
import { useAuth } from '../hooks/useAuth';

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
        <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoriteToggle}>
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
                <ArrowRightLeft size={14} color={COLORS.secondary} />
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    height: 120,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.65)',
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
    borderRadius: 6,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: 14,
  },
  eventName: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  seatText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  seatHighlight: {
    color: COLORS.white,
    fontWeight: '600',
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
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
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
    fontWeight: '600',
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
    color: COLORS.success,
    fontSize: 17,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  exchangeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  exchangeBtnText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  buyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
