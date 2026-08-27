'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../components/AuthProvider';
import { CATEGORIES, Category } from '../../constants/categories';
import { supabase } from '../../lib/supabase';
import { PlusCircle, Calendar, Clock, MapPin, Tag, CheckCircle2, AlertCircle, Upload } from 'lucide-react';

export default function SellPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [eventName, setEventName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [eventDate, setEventDate] = useState('2026-10-25');
  const [eventTime, setEventTime] = useState('19:00');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [ticketType, setTicketType] = useState('VIP Gold');
  const [section, setSection] = useState('Zone A');
  const [row, setRow] = useState('R1');
  const [seat, setSeat] = useState('A-10');
  const [quantity, setQuantity] = useState('1');
  const [originalPrice, setOriginalPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=60'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      router.push('/login');
      return;
    }

    if (!eventName || !venue || !city || !sellingPrice) {
      setError('Please fill in all required fields (Event Name, Venue, City, and Selling Price).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        seller_id: user.id,
        event_name: eventName,
        category_id: selectedCategory.id,
        event_date: eventDate,
        event_time: eventTime,
        venue: venue,
        city: city,
        ticket_type: ticketType,
        section: section,
        row: row,
        seat: seat,
        quantity: parseInt(quantity, 10) || 1,
        original_price: parseFloat(originalPrice) || parseFloat(sellingPrice),
        selling_price: parseFloat(sellingPrice),
        description: description,
        status: 'active',
        image_url: imageUrl,
      };

      const { data, error: insertError } = await supabase
        .from('tickets')
        .insert(payload)
        .select('*')
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        // Successfully inserted into Supabase database
        console.log('[WEB TICKET CREATE SUCCESS] ID:', data.id);
        router.push(`/ticket/${data.id}`);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to list ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-textMain tracking-tight">Sell Your Ticket</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1">
            Turn your unused ticket into cash. Published instantly to Android & Web ticket marketplaces.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-cardBorder shadow-xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-error/10 text-error text-xs font-semibold border border-error/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-textMain uppercase tracking-wider mb-2">Event Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      selectedCategory.id === cat.id
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-background text-textMain border-cardBorder hover:border-textMuted'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Name & City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-textMain mb-1">Event Name *</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coldplay Music Of The Spheres"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full rounded-xl bg-background pl-10 pr-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-textMain mb-1">City *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl bg-background pl-10 pr-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-textMain mb-1">Event Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full rounded-xl bg-background pl-10 pr-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-textMain mb-1">Event Time *</label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textSecondary" />
                  <input
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full rounded-xl bg-background pl-10 pr-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Venue & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-textMain mb-1">Venue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JLN Stadium Ground"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full rounded-xl bg-background px-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textMain mb-1">Ticket Type</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Gold / Fan Pit"
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full rounded-xl bg-background px-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Section, Row, Seat */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-textMain mb-1">Section</label>
                <input
                  type="text"
                  placeholder="Zone A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-xl bg-background px-3 py-2 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-textMain mb-1">Row</label>
                <input
                  type="text"
                  placeholder="R1"
                  value={row}
                  onChange={(e) => setRow(e.target.value)}
                  className="w-full rounded-xl bg-background px-3 py-2 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-textMain mb-1">Seat</label>
                <input
                  type="text"
                  placeholder="A-10"
                  value={seat}
                  onChange={(e) => setSeat(e.target.value)}
                  className="w-full rounded-xl bg-background px-3 py-2 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-textMain mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-xl bg-background px-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textMain mb-1">Original Price (₹)</label>
                <input
                  type="number"
                  placeholder="3500"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full rounded-xl bg-background px-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textMain mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="2800"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full rounded-xl bg-background px-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none font-bold text-primary"
                />
              </div>
            </div>

            {/* Image URL & Description */}
            <div>
              <label className="block text-xs font-bold text-textMain mb-1">Ticket Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-xl bg-background px-4 py-2.5 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-textMain mb-1">Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Mention backstage passes, food Pass, or special access..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl bg-background p-4 text-xs text-textMain border border-cardBorder focus:border-primary focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-extrabold text-white shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Publishing Ticket...' : 'Publish Ticket to Marketplace'}
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
