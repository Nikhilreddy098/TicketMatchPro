import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, MapPin } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { Ticket } from '../types/ticket';
import { formatCurrency, formatShortDate } from '../utils/formatting';

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
            <Calendar size={13} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{formatShortDate(ticket.event_date)}</Text>
          </View>
          <View style={[styles.infoItem, { marginLeft: 12 }]}>
            <MapPin size={13} color={COLORS.textSecondary} />
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
    width: 260,
    height: 170,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    marginRight: 14,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  badgeContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 2,
    backgroundColor: 'rgba(9, 9, 11, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadge: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    padding: 12,
  },
  eventName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
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
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginRight: 4,
  },
  priceValue: {
    color: COLORS.success,
    fontSize: 15,
    fontWeight: '700',
  },
});
