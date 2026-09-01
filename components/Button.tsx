import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const getContainerStyle = () => {
    let base: ViewStyle = styles.base;

    if (size === 'small') base = { ...base, paddingVertical: 8, paddingHorizontal: 12 };
    if (size === 'large') base = { ...base, paddingVertical: 16, paddingHorizontal: 24 };

    if (variant === 'primary') return [base, styles.primary, style];
    if (variant === 'secondary') return [base, styles.secondary, style];
    if (variant === 'outline') return [base, styles.outline, style];
    if (variant === 'danger') return [base, styles.danger, style];

    return [base, style];
  };

  const getTextStyle = () => {
    let textBase: TextStyle = styles.text;

    if (size === 'small') textBase = { ...textBase, fontSize: 13 };
    if (size === 'large') textBase = { ...textBase, fontSize: 16 };

    if (variant === 'outline') return [textBase, { color: COLORS.textMain }, textStyle];
    if (variant === 'secondary') return [textBase, { color: COLORS.primary }, textStyle];
    return [textBase, textStyle];
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[getContainerStyle(), (disabled || loading) && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? COLORS.primary : COLORS.white} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), icon ? { marginLeft: 8 } : null]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondaryLight,
  },
  outline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  danger: {
    backgroundColor: COLORS.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: COLORS.white,
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
});
