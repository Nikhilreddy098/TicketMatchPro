'use client';

import React, { useState } from 'react';
import { MapPin, Search, X, Check, Globe, Navigation } from 'lucide-react';
import { POPULAR_CITIES, ALL_LOCATIONS_OPTION, searchCities } from '../constants/cities';

interface LocationPickerModalProps {
  isOpen: boolean;
  selectedCity: string;
  onClose: () => void;
  onSelectCity: (city: string) => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  selectedCity,
  onClose,
  onSelectCity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredCities = searchCities(searchQuery);

  const handleSelect = (cityName: string) => {
    onSelectCity(cityName);
    onClose();
  };

  const isCustomQueryNew =
    searchQuery.trim().length > 0 &&
    !filteredCities.some((c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-cardBorder max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cardBorder">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-textMain">Select Location</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-textSecondary hover:bg-background hover:text-textMain transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative my-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
          <input
            type="text"
            placeholder="Search any city or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-background pl-10 pr-4 py-2.5 text-sm text-textMain border border-cardBorder focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            autoFocus
          />
        </div>

        <div className="overflow-y-auto pr-1 flex-1 space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSelect('Hyderabad')}
              className="flex items-center justify-center gap-2 rounded-xl bg-secondaryLight/60 p-2.5 text-xs font-semibold text-primary border border-primary/20 hover:bg-secondaryLight transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              Use Current Location
            </button>
            <button
              onClick={() => handleSelect(ALL_LOCATIONS_OPTION)}
              className={`flex items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-semibold border transition-all ${
                selectedCity === ALL_LOCATIONS_OPTION
                  ? 'bg-primary text-white border-primary'
                  : 'bg-background text-textMain border-cardBorder hover:border-textMuted'
              }`}
            >
              <Globe className="h-3.5 w-3.5" />
              All Locations
            </button>
          </div>

          {/* Custom Typed City */}
          {isCustomQueryNew && (
            <button
              onClick={() => handleSelect(searchQuery.trim())}
              className="w-full flex items-center justify-between rounded-xl bg-secondaryLight p-3.5 text-left border border-primary/30 hover:bg-secondaryLight/80 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <div className="text-sm font-bold text-primary">Select "{searchQuery.trim()}"</div>
                  <div className="text-xs text-textSecondary">Filter marketplace tickets for {searchQuery.trim()}</div>
                </div>
              </div>
              <Check className="h-4 w-4 text-primary" />
            </button>
          )}

          {/* Popular Cities */}
          {!searchQuery.trim() && (
            <div>
              <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">Popular Cities</h3>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CITIES.map((city) => {
                  const isSelected = selectedCity.toLowerCase() === city.name.toLowerCase();
                  return (
                    <button
                      key={city.id}
                      onClick={() => handleSelect(city.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-background text-textMain border-cardBorder hover:border-textMuted'
                      }`}
                    >
                      {city.name}
                      {isSelected && <Check className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Cities List */}
          <div>
            <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-2">
              {searchQuery.trim() ? 'Search Results' : 'All Cities'}
            </h3>
            <div className="divide-y divide-cardBorder border-t border-cardBorder">
              {filteredCities.map((item) => {
                const isSelected = selectedCity.toLowerCase() === item.name.toLowerCase();
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.name)}
                    className="w-full flex items-center justify-between py-2.5 px-1 text-left hover:bg-background/80 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-textMuted'}`} />
                      <div>
                        <div className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-textMain'}`}>
                          {item.name}
                        </div>
                        {item.state && <div className="text-xs text-textSecondary">{item.state}</div>}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
