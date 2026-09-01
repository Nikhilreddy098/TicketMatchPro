import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, MapPin } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { Ticket } from '../types/ticket';
import { formatCurrency, formatShortDate } from '../utils/formatting';
import { FONTS } from '../constants/typography';

interface EventCardProps {
  ticket: Ticket;
  onPress: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ ticket, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.card}>
      <Image source={{ uri: ticket.image_url }} style={styles.image} />
      <View style={styles.badgeContainer}>
        <Text style={styles.categoryBadge}>{ticket.category_name || 'Event'}</Text>
      </View>
      <View style={styles.overlay}>
        <Text style={styles.eventName} numberOfLines={1}>
          {ticket.event_name}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Calendar size={13} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.infoText}>{formatShortDate(ticket.event_date)}</Text>
          </View>
          <View style={[styles.infoItem, { marginLeft: 12 }]}>
            <MapPin size={13} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.infoText} numberOfLines={1}>
              {ticket.city}
            </Text>
          </View>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>From</Text>
          <Text style={styles.priceValue}>{formatCurrency(ticket.selling_price)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 270,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    marginRight: 14,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryBadge: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: FONTS.bold,
    textTransform: 'uppercase',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(17, 17, 20, 0.75)',
    padding: 14,
  },
  eventName: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginRight: 4,
  },
  priceValue: {
    color: '#34D399',
    fontSize: 16,
    fontFamily: FONTS.extraBold,
  },
});
