export const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const getCategoryIconName = (categoryName?: string): string => {
  if (!categoryName) return 'ticket';
  const lower = categoryName.toLowerCase();
  if (lower.includes('concert') || lower.includes('music')) return 'music';
  if (lower.includes('sport')) return 'trophy';
  if (lower.includes('movie') || lower.includes('cinema')) return 'film';
  if (lower.includes('fest')) return 'sparkles';
  if (lower.includes('theatre') || lower.includes('drama')) return 'clapperboard';
  if (lower.includes('college') || lower.includes('campus')) return 'graduation-cap';
  return 'ticket';
};

export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
