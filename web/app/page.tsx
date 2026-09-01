'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { TicketCard } from '../components/TicketCard';
import { EventCard } from '../components/EventCard';
import { CategoryCard } from '../components/CategoryCard';
import { ALL_LOCATIONS_OPTION } from '../constants/cities';
import { CATEGORIES } from '../constants/categories';
import { supabase } from '../lib/supabase';
import { Ticket } from '../lib/types';
import { Search, Sparkles, ShieldCheck, ArrowRight, QrCode, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [selectedLocation, setSelectedLocation] = useState<string>(ALL_LOCATIONS_OPTION);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchTickets();
  }, [selectedLocation]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select('*, seller:profiles(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (selectedLocation !== ALL_LOCATIONS_OPTION) {
        query = query.ilike('city', `%${selectedLocation}%`);
      }

      const { data, error } = await query;
      if (!error && data) {
        setTickets(data as Ticket[]);
      }
    } catch (e) {
      console.warn('Supabase fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const featuredEvents = tickets.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar selectedLocation={selectedLocation} onLocationChange={setSelectedLocation} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondaryLight/50 via-background to-background py-16 sm:py-24 border-b border-cardBorder/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-primary border border-primary/20 shadow-sm">
                <Sparkles className="h-4 w-4" />
                <span>India's Premier Verified Ticket Marketplace</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-textMain tracking-tight leading-[1.1]">
                Buy, Sell & Exchange Tickets <span className="text-primary">With Confidence</span>
              </h1>

              <p className="text-base sm:text-lg text-textSecondary max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Discover authentic tickets for concerts, IPL cricket matches, standup comedy, theatre, and cultural festivals. Guaranteed 100% buyer protection and verified QR entry passes.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/browse"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-extrabold text-white shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all transform active:scale-95"
                >
                  Browse Marketplace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/sell"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-extrabold text-textMain border border-cardBorder hover:border-primary/40 hover:bg-secondaryLight/40 shadow-sm transition-all"
                >
                  Sell a Ticket
                </Link>
              </div>

              {/* Trust Metrics */}
              <div className="pt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0 border-t border-cardBorder/80 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-textMain">100%</div>
                  <div className="text-xs text-textSecondary font-semibold">Verified Sellers</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-textMain">₹0</div>
                  <div className="text-xs text-textSecondary font-semibold">Hidden Buyer Fees</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-textMain">Instant</div>
                  <div className="text-xs text-textSecondary font-semibold">Peer Exchanges</div>
                </div>
              </div>
            </div>

            {/* Hero Interactive Preview Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-cardBorder transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between pb-4 border-b border-cardBorder mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-bold text-textMain uppercase tracking-wider">Live Marketplace Feed</span>
                  </div>
                  <span className="text-xs font-extrabold text-primary bg-secondaryLight px-2.5 py-1 rounded-lg">
                    {tickets.length} Active Listings
                  </span>
                </div>

                {tickets.length > 0 ? (
                  <div className="space-y-4">
                    <TicketCard ticket={tickets[0]} showActions={false} />
                    <div className="p-3 bg-secondaryLight/50 rounded-xl border border-primary/20 flex items-center justify-between text-xs font-bold text-primary">
                      <span>Have spare tickets? List in 60 seconds</span>
                      <Link href="/sell" className="underline hover:text-primary-dark">List Ticket →</Link>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <QrCode className="h-10 w-10 text-primary mx-auto" />
                    <div className="text-sm font-bold text-textMain">Verified Ticket Marketplace</div>
                    <div className="text-xs text-textSecondary">Real-time ticket listings will appear here.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Grid */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">Explore Categories</h2>
            <p className="text-xs sm:text-sm text-textSecondary mt-1">Find tickets for your favorite type of live entertainment.</p>
          </div>
          <Link href="/browse" className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1">
            View All Categories <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* Featured Events Carousel / Grid */}
      {featuredEvents.length > 0 && (
        <section className="py-12 bg-white border-y border-cardBorder w-full">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">Featured Live Events</h2>
                <p className="text-xs sm:text-sm text-textSecondary mt-1">Trending concerts and sports matches with high fan demand.</p>
              </div>
              <Link href="/browse" className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1">
                Explore All Events <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredEvents.map((t) => (
                <EventCard key={t.id} ticket={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Marketplace Active Feed */}
      <section className="py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">
              {selectedLocation === ALL_LOCATIONS_OPTION
                ? 'All Available Marketplace Tickets'
                : `Tickets Available in ${selectedLocation}`}
            </h2>
            <p className="text-xs sm:text-sm text-textSecondary mt-1">
              {selectedLocation === ALL_LOCATIONS_OPTION
                ? 'Real-time verified tickets posted by community sellers across all cities.'
                : `Real-time verified tickets listed in ${selectedLocation}.`}
            </p>
          </div>
          <Link href="/browse" className="text-xs font-extrabold text-primary hover:underline flex items-center gap-1">
            Open Full Marketplace <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 w-full bg-white rounded-2xl animate-pulse border border-cardBorder" />
            <div className="h-44 w-full bg-white rounded-2xl animate-pulse border border-cardBorder" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-cardBorder max-w-lg mx-auto shadow-sm">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-bold text-textMain">No Tickets Listed in {selectedLocation} Yet</h3>
            <p className="text-xs text-textSecondary mt-1">
              Be the first fan to list a ticket or view listings across all locations.
            </p>
            <button
              onClick={() => setSelectedLocation(ALL_LOCATIONS_OPTION)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-secondaryLight px-4 py-2 text-xs font-bold text-primary border border-primary/20 hover:bg-secondaryLight/80"
            >
              View All Locations
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white border-t border-cardBorder w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-textMain tracking-tight">How TicketMatchPro Works</h2>
            <p className="text-xs sm:text-sm text-textSecondary mt-1">
              A transparent, fan-first commercial ecosystem for buying, selling, and trading event tickets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-background border border-cardBorder space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="text-base font-extrabold text-textMain">Discover & Filter</h3>
              <p className="text-xs text-textSecondary leading-relaxed">
                Choose any city location filter (Hyderabad, Bengaluru, Mumbai, Delhi NCR, etc.) and browse verified tickets by date, price, or category.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-cardBorder space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="text-base font-extrabold text-textMain">Buy or Peer Exchange</h3>
              <p className="text-xs text-textSecondary leading-relaxed">
                Purchase tickets securely or request a direct 1:1 ticket exchange with the seller using your active listings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-background border border-cardBorder space-y-3">
              <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="text-base font-extrabold text-textMain">Verified Digital Pass</h3>
              <p className="text-xs text-textSecondary leading-relaxed">
                Receive instant digital entry passes with verified QR hashes ready for venue entry scanning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seller CTA Section */}
      <section className="py-16 bg-primary text-white w-full">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Have Tickets You Can't Use?</h2>
          <p className="text-sm sm:text-base text-white/80 max-w-2xl mx-auto leading-relaxed">
            Sell your spare tickets to genuine fans at face value or fair prices. 0% seller fee for a limited time.
          </p>
          <div className="pt-2">
            <Link
              href="/sell"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-black text-primary shadow-2xl hover:bg-secondaryLight transition-all"
            >
              List Your Ticket Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
