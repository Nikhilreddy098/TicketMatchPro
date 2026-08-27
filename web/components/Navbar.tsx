'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ticket, MapPin, Search, PlusCircle, User as UserIcon, LogOut, ChevronDown, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { LocationPickerModal } from './LocationPickerModal';
import { ALL_LOCATIONS_OPTION } from '../constants/cities';

interface NavbarProps {
  selectedLocation?: string;
  onLocationChange?: (city: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedLocation = ALL_LOCATIONS_OPTION,
  onLocationChange,
}) => {
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  const handleCitySelect = (city: string) => {
    if (onLocationChange) {
      onLocationChange(city);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-cardBorder shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                <Ticket className="h-5 w-5 transform -rotate-12" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-textMain">
                TicketMatch<span className="text-primary">Pro</span>
              </span>
            </Link>

            {/* Location Picker Trigger */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 text-xs font-bold text-textMain border border-cardBorder hover:border-primary/40 hover:bg-secondaryLight/50 transition-all"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{selectedLocation}</span>
              <ChevronDown className="h-3 w-3 text-textSecondary" />
            </button>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="Search artists, teams, venues or cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-background pl-10 pr-4 py-2 text-sm text-textMain border border-cardBorder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
            </form>

            {/* Nav Actions */}
            <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-textMain">
              <Link href="/browse" className="hover:text-primary transition-colors">
                Browse Marketplace
              </Link>
              <Link href="/exchanges" className="hover:text-primary transition-colors">
                Exchanges
              </Link>
            </div>

            {/* User Controls & Sell Ticket CTA */}
            <div className="flex items-center gap-3">
              <Link
                href="/sell"
                className="hidden sm:flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark transition-all transform active:scale-95"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Sell Ticket</span>
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 rounded-full border border-cardBorder p-1.5 pr-3 hover:bg-background transition-colors"
                  >
                    <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden md:inline text-xs font-bold text-textMain max-w-[100px] truncate">
                      {profile?.full_name || 'My Account'}
                    </span>
                    <ChevronDown className="h-3 w-3 text-textSecondary" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-cardBorder z-50 animate-fadeIn">
                      <div className="px-3 py-2 border-b border-cardBorder mb-1">
                        <div className="text-xs font-bold text-textMain truncate">{profile?.full_name || 'User'}</div>
                        <div className="text-[11px] text-textSecondary truncate">{user.email}</div>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-textMain hover:bg-background transition-colors"
                      >
                        <UserIcon className="h-4 w-4 text-primary" />
                        My Dashboard & Listings
                      </Link>
                      <Link
                        href="/exchanges"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-textMain hover:bg-background transition-colors"
                      >
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Exchange Requests
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-colors mt-1"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-full px-3.5 py-1.5 text-xs font-bold text-textMain hover:bg-background transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-secondaryLight px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-secondaryLight/80 transition-colors"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden rounded-xl p-2 text-textMain hover:bg-background"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-cardBorder bg-white p-4 space-y-3">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLocationModalOpen(true);
              }}
              className="w-full flex items-center justify-between rounded-xl bg-background p-3 text-xs font-bold text-textMain border border-cardBorder"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Location: {selectedLocation}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-textSecondary" />
            </button>
            <Link
              href="/browse"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-textMain hover:bg-background"
            >
              Browse Marketplace
            </Link>
            <Link
              href="/sell"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-primary bg-secondaryLight"
            >
              Sell a Ticket
            </Link>
            <Link
              href="/exchanges"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-textMain hover:bg-background"
            >
              Exchange Requests
            </Link>
          </div>
        )}
      </header>

      <LocationPickerModal
        isOpen={isLocationModalOpen}
        selectedCity={selectedLocation}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectCity={handleCitySelect}
      />
    </>
  );
};
