'use client';

import React from 'react';
import Link from 'next/link';
import { Music, Trophy, Film, Sparkles, Theater, GraduationCap } from 'lucide-react';
import { Category } from '../lib/types';

interface CategoryCardProps {
  category: Category;
  isSelected?: boolean;
  onSelect?: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected = false,
  onSelect,
}) => {
  const getIcon = (name: string) => {
    switch (name?.toLowerCase()) {
      case 'concerts':
        return <Music className="h-5 w-5" />;
      case 'sports':
        return <Trophy className="h-5 w-5" />;
      case 'movies':
        return <Film className="h-5 w-5" />;
      case 'festivals':
        return <Sparkles className="h-5 w-5" />;
      case 'theatre':
        return <Theater className="h-5 w-5" />;
      case 'college events':
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  if (onSelect) {
    return (
      <button
        onClick={() => onSelect(category)}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
          isSelected
            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
            : 'bg-white text-textMain border-cardBorder hover:border-primary/40 hover:bg-secondaryLight/30'
        }`}
      >
        <span>{getIcon(category.name)}</span>
        <span>{category.name}</span>
      </button>
    );
  }

  return (
    <Link
      href={`/browse?category=${category.id}`}
      className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-cardBorder shadow-sm hover:shadow-md hover:border-primary/40 transition-all text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondaryLight text-primary group-hover:scale-110 transition-transform mb-3">
        {getIcon(category.name)}
      </div>
      <div className="text-sm font-extrabold text-textMain group-hover:text-primary transition-colors">
        {category.name}
      </div>
      {category.description && (
        <div className="text-xs text-textSecondary mt-1 line-clamp-1">{category.description}</div>
      )}
    </Link>
  );
};
