'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { TicketCard } from '../../components/TicketCard';
import { CategoryCard } from '../../components/CategoryCard';
import { ALL_LOCATIONS_OPTION } from '../../constants/cities';
import { CATEGORIES } from '../../constants/categories';
import { supabase } from '../../lib/supabase';
import { Ticket } from '../../lib/types';
import { Search, Filter, MapPin, ArrowDownUp, RefreshCw, X } from 'lucide-react';

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialCity = searchParams.get('city') || ALL_LOCATIONS_OPTION;

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [selectedLocation, setSelectedLocation] = useState<string>(initialCity);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'date'>('newest');

  useEffect(() => {
    fetchTickets();
  }, [searchQuery, selectedCategory, selectedLocation, minPrice, maxPrice, sortBy]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*, seller:profiles(*)')
        .eq('status', 'active');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedLocation !== ALL_LOCATIONS_OPTION && selectedLocation.trim()) {
        query = query.ilike('city', `%${selectedLocation.trim()}%`);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim();
        query = query.or(`event_name.ilike.%${q}%,venue.ilike.%${q}%,city.ilike.%${q}%`);
      }

      if (minPrice) {
        query = query.gte('selling_price', parseFloat(minPrice));
      }

      if (maxPrice) {
        query = query.lte('selling_price', parseFloat(maxPrice));
      }

      if (sortBy === 'price_low') {
        query = query.order('selling_price', { ascending: true });
      } else if (sortBy === 'price_high') {
        query = query.order('selling_price', { ascending: false });
      } else if (sortBy === 'date') {
        query = query.order('event_date', { ascending: true });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        setTickets(data as Ticket[]);
      }
    } catch (e) {
      console.warn('Supabase fetch tickets error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedLocation(ALL_LOCATIONS_OPTION);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar selectedLocation={selectedLocation} onLocationChange={setSelectedLocation} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-textMain tracking-tight">Browse Ticket Marketplace</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1">
            Real-time verified tickets for concerts, IPL cricket, movies, standup comedy, and cultural festivals.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-cardBorder mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
              <input
                type="text"
                placeholder="Search event name, venue, or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-background pl-10 pr-4 py-2.5 text-sm text-textMain border border-cardBorder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textMain"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Price Min/Max */}
            <div className="md:col-span-3 flex items-center gap-2">
              <input
                type="number"
                placeholder="Min ₹"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full rounded-full bg-background px-3 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
              />
              <span className="text-textSecondary text-xs font-bold">-</span>
              <input
                type="number"
                placeholder="Max ₹"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-full bg-background px-3 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
              />
            </div>

            {/* Sort Select */}
            <div className="md:col-span-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-xl bg-background px-3 py-2.5 text-xs font-bold text-textMain border border-cardBorder focus:border-primary focus:outline-none"
              >
                <option value="newest">Recently Listed</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
                <option value="date">Event Date</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 border-t border-cardBorder">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                selectedCategory === null
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-textMain border-cardBorder hover:border-textMuted'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-background text-textMain border-cardBorder hover:border-textMuted'
                }`}
              >
                {cat.name}
              </button>
            ))}

            {(selectedCategory || minPrice || maxPrice || searchQuery || selectedLocation !== ALL_LOCATIONS_OPTION) && (
              <button
                onClick={handleResetFilters}
                className="ml-auto px-3 py-1.5 rounded-full text-xs font-bold text-error bg-error/10 hover:bg-error/20 transition-all shrink-0"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-textSecondary">
            Showing {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
            {selectedLocation !== ALL_LOCATIONS_OPTION ? ` in ${selectedLocation}` : ''}
          </div>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-44 w-full bg-white rounded-2xl animate-pulse border border-cardBorder" />
            <div className="h-44 w-full bg-white rounded-2xl animate-pulse border border-cardBorder" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-cardBorder max-w-lg mx-auto shadow-sm my-8">
            <Search className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-textMain">No Tickets Found</h3>
            <p className="text-xs text-textSecondary mt-1">
              We couldn't find any tickets matching your exact query or active filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondaryLight px-4 py-2 text-xs font-bold text-primary border border-primary/20 hover:bg-secondaryLight/80"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-textMain">Loading Marketplace...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
