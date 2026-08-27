import { Category } from '../lib/types';

export type { Category };

export const CATEGORIES: Category[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Concerts',
    description: 'Live music concerts, EDM carnivals, rock shows and pop tours',
    icon: 'Music',
    slug: 'concerts',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sports',
    description: 'IPL Cricket, ISL Football, Pro Kabaddi, Tennis and F1 screenings',
    icon: 'Trophy',
    slug: 'sports',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Movies',
    description: 'IMAX premieres, premiere screenings and film festivals',
    icon: 'Film',
    slug: 'movies',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Festivals',
    description: 'Cultural festivals, food carnivals, art galas and exhibitions',
    icon: 'Sparkles',
    slug: 'festivals',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Theatre',
    description: 'Standup comedy shows, drama plays and musical theatre',
    icon: 'Theater',
    slug: 'theatre',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    name: 'College Events',
    description: 'Inter-college fests, youth summits and campus competitions',
    icon: 'GraduationCap',
    slug: 'college-events',
  },
];
