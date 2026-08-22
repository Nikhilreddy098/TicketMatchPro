export interface Category {
  id: string;
  name: string;
  icon: string;
  slug: string;
}

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Concerts', icon: 'music', slug: 'concerts' },
  { id: '2', name: 'Sports', icon: 'trophy', slug: 'sports' },
  { id: '3', name: 'Movies', icon: 'film', slug: 'movies' },
  { id: '4', name: 'Festivals', icon: 'sparkles', slug: 'festivals' },
  { id: '5', name: 'Theatre', icon: 'clapperboard', slug: 'theatre' },
  { id: '6', name: 'College Events', icon: 'graduation-cap', slug: 'college-events' },
  { id: '7', name: 'Other', icon: 'grid', slug: 'other' },
];
