'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';
import { useAuth } from '../../../components/AuthProvider';
import { EventJsonLd } from '../../../components/JsonLd';
import { supabase } from '../../../lib/supabase';
import { Ticket } from '../../../lib/types';
import { formatCurrency, formatDate, formatTime } from '../../../utils/formatting';
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  User,
  ArrowRightLeft,
  ShoppingBag,
  Share2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Info,
} from 'lucide-react';

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const ticketId = params?.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPendingExchange, setHasPendingExchange] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (ticketId) {
      fetchTicketDetails();
    }
  }, [ticketId, user]);

  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, seller:profiles(*)')
        .eq('id', ticketId)
        .single();

      if (error || !data) {
        setError('Ticket listing not found or has been removed.');
      } else {
        const fetched = data as Ticket;
        setTicket(fetched);

        // Check if current user has a pending exchange request for this ticket
        if (user && user.id !== fetched.seller_id) {
          const { data: exData } = await supabase
            .from('exchange_requests')
            .select('id')
            .eq('sender_id', user.id)
            .eq('requested_ticket_id', fetched.id)
            .eq('status', 'pending');
          if (exData && exData.length > 0) {
            setHasPendingExchange(true);
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Error fetching ticket details.');
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?.id && ticket?.seller_id === user.id;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-16 text-center flex-1">
          <div className="h-64 w-full bg-white rounded-3xl animate-pulse border border-cardBorder max-w-2xl mx-auto" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="mx-auto max-w-xl px-4 py-16 text-center flex-1 space-y-4">
          <AlertCircle className="h-12 w-12 text-error mx-auto" />
          <h1 className="text-2xl font-bold text-textMain">Ticket Not Found</h1>
          <p className="text-xs text-textSecondary">{error || 'This listing does not exist.'}</p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Marketplace
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <EventJsonLd
        name={ticket.event_name}
        startDate={`${ticket.event_date}T${ticket.event_time}`}
        venue={ticket.venue}
        city={ticket.city}
        price={ticket.selling_price}
        url={`https://ticketmatchpro.com/ticket/${ticket.id}`}
        imageUrl={ticket.image_url}
      />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/browse"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-textSecondary hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-textMain border border-cardBorder hover:border-primary/40 shadow-sm transition-all"
          >
            <Share2 className="h-3.5 w-3.5 text-primary" />
            <span>{copied ? 'Copied Link!' : 'Share Listing'}</span>
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Event Banner & Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-white border border-cardBorder shadow-sm">
              <div className="relative h-64 sm:h-80 w-full bg-background">
                {ticket.image_url ? (
                  <img src={ticket.image_url} alt={ticket.event_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                    TicketMatchPro
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-extrabold text-primary border border-cardBorder shadow-md">
                  {ticket.category_name || 'Event'}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h1 className="text-2xl sm:text-3xl font-black text-textMain leading-tight">
                  {ticket.event_name}
                </h1>

                {/* Event Schedule Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-background border border-cardBorder text-xs">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-textMain">Event Date</div>
                      <div className="text-textSecondary">{formatDate(ticket.event_date)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-textMain">Time</div>
                      <div className="text-textSecondary">{formatTime(ticket.event_time)}</div>
                    </div>
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-3 pt-2 border-t border-cardBorder">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-textMain">Venue & Location</div>
                      <div className="text-textSecondary">
                        {ticket.venue}, <strong>{ticket.city}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seat Breakdown */}
                <div>
                  <h3 className="text-xs font-bold text-textMain uppercase tracking-wider mb-2">Seat Assignment</h3>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-3 rounded-xl bg-background border border-cardBorder">
                      <div className="text-textSecondary text-[10px]">Section</div>
                      <div className="font-extrabold text-textMain mt-0.5">{ticket.section || 'Zone A'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-cardBorder">
                      <div className="text-textSecondary text-[10px]">Row</div>
                      <div className="font-extrabold text-textMain mt-0.5">{ticket.row || 'R1'}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-background border border-cardBorder">
                      <div className="text-textSecondary text-[10px]">Seat</div>
                      <div className="font-extrabold text-textMain mt-0.5">{ticket.seat || 'A-10'}</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {ticket.description && (
                  <div>
                    <h3 className="text-xs font-bold text-textMain uppercase tracking-wider mb-2">Seller Description</h3>
                    <p className="text-xs text-textSecondary leading-relaxed bg-background p-4 rounded-2xl border border-cardBorder">
                      {ticket.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Seller Card & Action CTAs */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pricing & Checkout Card */}
            <div className="rounded-3xl bg-white p-6 border border-cardBorder shadow-xl space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-cardBorder">
                <div>
                  <div className="text-xs text-textSecondary font-semibold">Verified Ticket Price</div>
                  <div className="text-3xl font-black text-primary mt-0.5">
                    {formatCurrency(ticket.selling_price)}
                    {ticket.original_price > ticket.selling_price && (
                      <span className="ml-2 text-xs font-semibold text-textMuted line-through">
                        {formatCurrency(ticket.original_price)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="bg-success/10 text-success text-xs font-extrabold px-3 py-1 rounded-full">
                  Status: {ticket.status}
                </span>
              </div>

              {/* Owner Security Guard */}
              {isOwner ? (
                <div className="p-4 rounded-2xl bg-secondaryLight border border-primary/30 space-y-2 text-center">
                  <div className="flex items-center justify-center gap-2 text-xs font-extrabold text-primary">
                    <CheckCircle className="h-4 w-4" />
                    <span>This is your listed ticket</span>
                  </div>
                  <p className="text-[11px] text-textSecondary">
                    You listed this ticket. You cannot purchase or request an exchange for your own ticket.
                  </p>
                  <Link
                    href="/dashboard"
                    className="inline-block mt-2 text-xs font-bold text-primary underline"
                  >
                    Manage in Dashboard →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => router.push(`/orders?ticketId=${ticket.id}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-extrabold text-white shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all transform active:scale-95"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Buy Ticket Now
                  </button>

                  {hasPendingExchange ? (
                    <div className="p-3 bg-secondaryLight rounded-xl text-center text-xs font-bold text-primary border border-primary/20">
                      Exchange Request Pending
                    </div>
                  ) : (
                    <Link
                      href={`/exchanges?targetTicketId=${ticket.id}`}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-background py-3.5 text-xs font-extrabold text-textMain border border-cardBorder hover:border-primary/40 hover:bg-secondaryLight/40 transition-all"
                    >
                      <ArrowRightLeft className="h-4 w-4 text-primary" />
                      Request Peer Ticket Exchange
                    </Link>
                  )}
                </div>
              )}

              {/* Seller Profile Trust Box */}
              <div className="pt-4 border-t border-cardBorder">
                <div className="text-xs font-bold text-textMain mb-3">Seller Verification Info</div>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background border border-cardBorder">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {ticket.seller?.full_name?.charAt(0) || 'S'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-extrabold text-textMain">
                        {ticket.seller?.full_name || 'Community Seller'}
                      </span>
                      {ticket.seller?.is_verified && (
                        <ShieldCheck className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <div className="text-[11px] text-textSecondary">
                      {ticket.seller?.total_sales || 1} successful sales • Rated 5.0 ★
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
