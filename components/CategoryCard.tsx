import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Music, Trophy, Film, Sparkles, Clapperboard, GraduationCap, Grid, Ticket as TicketIcon } from 'lucide-react-native';
import { COLORS } from '../constants/colors';
import { Category } from '../constants/categories';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onSelect: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected = false, onSelect }) => {
  const renderIcon = () => {
    const iconProps = { size: 18, color: isSelected ? COLORS.white : COLORS.textSecondary };
    switch (category.icon) {
      case 'music':
        return <Music {...iconProps} />;
      case 'trophy':
        return <Trophy {...iconProps} />;
      case 'film':
        return <Film {...iconProps} />;
      case 'sparkles':
        return <Sparkles {...iconProps} />;
      case 'clapperboard':
        return <Clapperboard {...iconProps} />;
      case 'graduation-cap':
        return <GraduationCap {...iconProps} />;
      case 'grid':
        return <Grid {...iconProps} />;
      default:
        return <TicketIcon {...iconProps} />;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onSelect(category)}
      style={[styles.container, isSelected ? styles.selectedContainer : styles.unselectedContainer]}
    >
      <View style={styles.iconWrapper}>{renderIcon()}</View>
      <Text style={[styles.title, isSelected ? styles.selectedTitle : styles.unselectedTitle]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  selectedContainer: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unselectedContainer: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.cardBorder,
  },
  iconWrapper: {
    marginRight: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectedTitle: {
    color: COLORS.white,
  },
  unselectedTitle: {
    color: COLORS.textSecondary,
  },
});
