import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

interface NotificationBadgeProps {
  count: number;
  onPress: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.container} onPress={onPress}>
      <Bell size={22} color={COLORS.white} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
});
