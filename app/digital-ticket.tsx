import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, QrCode, ShieldCheck, Share2 } from 'lucide-react-native';
import { getOrderVerification, getUserOrders } from '../services/orders';
import { TicketVerification } from '../types/database';
import { Order } from '../types/order';
import { TicketQR } from '../components/TicketQR';
import { Button } from '../components/Button';
import { Loading } from '../components/Loading';
import { COLORS } from '../constants/colors';
import { formatDate, formatTime } from '../utils/formatting';
import { FONTS } from '../constants/typography';

export default function DigitalTicketScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [verification, setVerification] = useState<TicketVerification | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const orders = await getUserOrders('demo-user-123');
        const target = orders.find((o) => o.id === orderId) || orders[0];
        setOrder(target);

        if (target) {
          const ver = await getOrderVerification(target.id);
          setVerification(ver);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  if (loading) return <Loading message="Loading digital ticket pass..." />;

  const ticket = order?.ticket || {
    event_name: 'Bengaluru Music Fest & EDM Carnival',
    venue: 'Manpho Convention Center',
    city: 'Bengaluru',
    event_date: '2026-09-20',
    event_time: '17:30',
    section: 'VIP Pit',
    row: 'Standing',
    seat: 'P-88',
    image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=60',
  };

  const qrHash = verification?.qr_hash || `TMP-QR-T102-ORD8801-SECURE99021`;

  const handleSharePass = () => {
    Alert.alert('Digital Pass Saved', 'Ticket pass with encrypted QR code saved to photos.');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Pass Outer Container */}
      <View style={styles.passCard}>
        {/* Pass Header Banner */}
        <View style={styles.bannerHeader}>
          <Image source={{ uri: ticket.image_url }} style={styles.bannerImage} />
          <View style={styles.bannerOverlay}>
            <Text style={styles.eventTitle}>{ticket.event_name}</Text>
            <View style={styles.venueRow}>
              <MapPin size={13} color={COLORS.textSecondary} />
              <Text style={styles.venueText}>
                {ticket.venue}, {ticket.city}
              </Text>
            </View>
          </View>
        </View>

        {/* Date & Time Row */}
        <View style={styles.passSection}>
          <View style={styles.passMetaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>DATE</Text>
              <Text style={styles.value}>{formatDate(ticket.event_date)}</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.label}>TIME</Text>
              <Text style={styles.value}>{formatTime(ticket.event_time)}</Text>
            </View>
          </View>

          {/* Seating Breakdown */}
          <View style={styles.seatContainer}>
            <View style={styles.seatCol}>
              <Text style={styles.label}>SECTION</Text>
              <Text style={styles.seatVal}>{ticket.section}</Text>
            </View>
            <View style={styles.seatCol}>
              <Text style={styles.label}>ROW</Text>
              <Text style={styles.seatVal}>{ticket.row || 'N/A'}</Text>
            </View>
            <View style={styles.seatCol}>
              <Text style={styles.label}>SEAT</Text>
              <Text style={styles.seatVal}>{ticket.seat || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Cutout Notch Divider */}
        <View style={styles.notchContainer}>
          <View style={styles.leftNotch} />
          <View style={styles.dashedLine} />
          <View style={styles.rightNotch} />
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <TicketQR qrHash={qrHash} size={190} />

          <View style={styles.verifiedPassBadge}>
            <ShieldCheck size={14} color={COLORS.success} />
            <Text style={styles.verifiedPassText}>OFFICIAL VERIFIED TICKETMATCHPRO PASS</Text>
          </View>

          <Text style={styles.holderText}>
            TICKET HOLDER: <Text style={{ color: COLORS.white }}>DEMO USER</Text>
          </Text>
        </View>
      </View>

      <View style={styles.actionsGroup}>
        <Button
          title="Verify Ticket Status"
          onPress={() => router.push({ pathname: '/verify-ticket', params: { qrHash } })}
          icon={<QrCode size={18} color={COLORS.white} />}
          style={{ marginBottom: 10 }}
        />
        <Button
          title="Share Pass"
          variant="outline"
          onPress={handleSharePass}
          icon={<Share2 size={18} color={COLORS.white} />}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingBottom: 40,
  },
  passCard: {
    width: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 20,
  },
  bannerHeader: {
    height: 140,
    width: '100%',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.85)',
    padding: 14,
  },
  eventTitle: {
    color: COLORS.white,
    fontSize: 17,
    fontFamily: FONTS.extraBold,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  venueText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  passSection: {
    padding: 16,
  },
  passMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  value: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  seatContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  seatCol: {
    flex: 1,
    alignItems: 'center',
  },
  seatVal: {
    color: COLORS.secondary,
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    marginTop: 2,
  },
  notchContainer: {
    height: 24,
    position: 'relative',
    justifyContent: 'center',
  },
  leftNotch: {
    position: 'absolute',
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  rightNotch: {
    position: 'absolute',
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  dashedLine: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginHorizontal: 16,
  },
  qrSection: {
    padding: 20,
    alignItems: 'center',
  },
  verifiedPassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 16,
  },
  verifiedPassText: {
    color: COLORS.success,
    fontSize: 10,
    fontFamily: FONTS.extraBold,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  holderText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  actionsGroup: {
    width: '100%',
  },
});
