import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

interface AvatarProps {
  url?: string;
  name?: string;
  size?: number;
  isVerified?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ url, name, size = 44, isVerified = false }) => {
  const getInitials = (fullName?: string) => {
    if (!fullName) return 'U';
    const parts = fullName.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return fullName.substring(0, 2).toUpperCase();
  };

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
        </View>
      )}
      {isVerified && (
        <View style={[styles.badge, { bottom: -2, right: -2 }]}>
          <CheckCircle2 size={size * 0.35} color={COLORS.success} fill={COLORS.background} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.cardBorder,
  },
  fallback: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
  },
  badge: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: COLORS.background,
  },
});
