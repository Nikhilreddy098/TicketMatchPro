import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { QrCode, CreditCard, Landmark, Wallet, Check } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { PaymentMethodType } from '../types/payment';

interface PaymentMethodCardProps {
  id: PaymentMethodType;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onSelect: (id: PaymentMethodType) => void;
}

export const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({
  id,
  title,
  subtitle,
  isSelected,
  onSelect,
}) => {
  const renderIcon = () => {
    const iconProps = { size: 22, color: isSelected ? COLORS.primary : COLORS.textSecondary };
    switch (id) {
      case 'upi':
        return <QrCode {...iconProps} />;
      case 'card':
        return <CreditCard {...iconProps} />;
      case 'netbanking':
        return <Landmark {...iconProps} />;
      case 'wallet':
        return <Wallet {...iconProps} />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onSelect(id)}
      style={[styles.card, isSelected ? styles.selectedCard : null]}
    >
      <View style={styles.iconContainer}>{renderIcon()}</View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.radioCircle, isSelected ? styles.radioSelected : null]}>
        {isSelected && <Check size={12} color={COLORS.white} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
});
