import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Image as ImageIcon, Calendar, Clock, MapPin, Tag, CheckCircle2 } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { CategoryCard } from '../../components/CategoryCard';
import { CATEGORIES, Category } from '../../constants/categories';
import { COLORS } from '../../constants/colors';
import { ticketListingSchema } from '../../utils/validation';
import { createTicketListing } from '../../services/tickets';

export default function SellScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [eventName, setEventName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [eventDate, setEventDate] = useState<string>('2026-10-25');
  const [eventTime, setEventTime] = useState<string>('19:00');
  const [venue, setVenue] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [ticketType, setTicketType] = useState<string>('VIP Gold');
  const [section, setSection] = useState<string>('Zone A');
  const [row, setRow] = useState<string>('R1');
  const [seat, setSeat] = useState<string>('A-10');
  const [quantity, setQuantity] = useState<string>('1');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required to upload ticket photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setImageUrl(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Image Picker Error', 'Could not open photo library.');
    }
  };

  const handleListTicket = async () => {
    setErrors({});
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to list a ticket.');
      return;
    }

    const payload = {
      eventName,
      categoryId: selectedCategory.id,
      eventDate,
      eventTime,
      venue,
      city,
      ticketType,
      section,
      row,
      seat,
      quantity: parseInt(quantity, 10) || 1,
      originalPrice: parseFloat(originalPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      description,
    };

    const validation = ticketListingSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      Alert.alert('Validation Error', 'Please correct the highlighted fields before listing your ticket.');
      return;
    }

    setLoading(true);
    try {
      await createTicketListing({
        seller_id: user.id,
        event_name: eventName,
        category_id: selectedCategory.id,
        category_name: selectedCategory.name,
        event_date: eventDate,
        event_time: eventTime,
        venue,
        city,
        ticket_type: ticketType,
        section,
        row,
        seat,
        quantity: parseInt(quantity, 10) || 1,
        original_price: parseFloat(originalPrice),
        selling_price: parseFloat(sellingPrice),
        description,
        image_url: imageUrl,
        seller: user,
      });

      Alert.alert('Listing Created! 🎉', 'Your ticket has been published to the marketplace.', [
        {
          text: 'View My Tickets',
          onPress: () => router.push('/my-tickets'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to list ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Sell or Exchange Ticket</Text>
        <Text style={styles.headerSubtitle}>
          Reach thousands of buyers safely. Instant verification & direct payout.
        </Text>
      </View>

      {/* Ticket Photo Upload Banner */}
      <TouchableOpacity activeOpacity={0.8} style={styles.imagePickerCard} onPress={handlePickImage}>
        {imageUrl ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            <View style={styles.imageOverlayBadge}>
              <ImageIcon size={14} color={COLORS.white} />
              <Text style={styles.imageOverlayText}>Change Image</Text>
            </View>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Upload size={32} color={COLORS.primary} />
            <Text style={styles.uploadTitle}>Upload Event Ticket Photo</Text>
            <Text style={styles.uploadSub}>PNG, JPG or JPEG allowed</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.formCard}>
        {/* Category Picker */}
        <Text style={styles.sectionLabel}>Select Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              isSelected={selectedCategory.id === cat.id}
              onSelect={setSelectedCategory}
            />
          ))}
        </ScrollView>

        <Input
          label="Event Name"
          placeholder="e.g. Coldplay Music Of The Spheres"
          value={eventName}
          onChangeText={setEventName}
          error={errors.eventName}
          leftIcon={<Tag size={18} color={COLORS.textSecondary} />}
        />

        <View style={styles.rowTwo}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              label="Event Date"
              placeholder="YYYY-MM-DD"
              value={eventDate}
              onChangeText={setEventDate}
              error={errors.eventDate}
              leftIcon={<Calendar size={18} color={COLORS.textSecondary} />}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Input
              label="Time"
              placeholder="19:00"
              value={eventTime}
              onChangeText={setEventTime}
              error={errors.eventTime}
              leftIcon={<Clock size={18} color={COLORS.textSecondary} />}
            />
          </View>
        </View>

        <View style={styles.rowTwo}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              label="Venue Name"
              placeholder="e.g. JLN Stadium"
              value={venue}
              onChangeText={setVenue}
              error={errors.venue}
              leftIcon={<MapPin size={18} color={COLORS.textSecondary} />}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Input
              label="City"
              placeholder="e.g. Bengaluru"
              value={city}
              onChangeText={setCity}
              error={errors.city}
            />
          </View>
        </View>

        {/* Seat / Section details */}
        <Text style={styles.sectionLabel}>Seating Details</Text>
        <View style={styles.rowThree}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Input label="Section" placeholder="Sec A" value={section} onChangeText={setSection} error={errors.section} />
          </View>
          <View style={{ flex: 1, marginHorizontal: 4 }}>
            <Input label="Row" placeholder="R3" value={row} onChangeText={setRow} />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Input label="Seat" placeholder="A-12" value={seat} onChangeText={setSeat} />
          </View>
        </View>

        {/* Quantity & Pricing */}
        <Text style={styles.sectionLabel}>Pricing & Quantity</Text>
        <View style={styles.rowThree}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Input label="Quantity" placeholder="1" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1, marginHorizontal: 4 }}>
            <Input
              label="Original Price (₹)"
              placeholder="3500"
              value={originalPrice}
              onChangeText={setOriginalPrice}
              keyboardType="numeric"
              error={errors.originalPrice}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Input
              label="Selling Price (₹)"
              placeholder="2800"
              value={sellingPrice}
              onChangeText={setSellingPrice}
              keyboardType="numeric"
              error={errors.sellingPrice}
            />
          </View>
        </View>

        <Input
          label="Additional Description (Optional)"
          placeholder="Mention food pass, backstage access, or delivery notes..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
        />

        <Button
          title="Publish Ticket Listing"
          onPress={handleListTicket}
          loading={loading}
          size="large"
          icon={<CheckCircle2 size={18} color={COLORS.white} />}
          style={styles.publishBtn}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },
  headerBox: {
    marginBottom: 16,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  imagePickerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    borderStyle: 'dashed',
    height: 150,
    overflow: 'hidden',
    marginBottom: 20,
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageOverlayBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(9, 9, 11, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  imageOverlayText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  uploadTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sectionLabel: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  rowTwo: {
    flexDirection: 'row',
  },
  rowThree: {
    flexDirection: 'row',
  },
  publishBtn: {
    marginTop: 12,
  },
});
