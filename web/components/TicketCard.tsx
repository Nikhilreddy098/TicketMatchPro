'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Clock, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { Ticket } from '../lib/types';
import { formatCurrency, formatDate, formatTime } from '../utils/formatting';

interface TicketCardProps {
  ticket: Ticket;
  showActions?: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, showActions = true }) => {
  const isOwner = false; // Resolved in ticket details page

  return (
    <div className="group relative flex flex-col sm:flex-row overflow-hidden rounded-2xl bg-white border border-cardBorder shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
      {/* Event Image Banner */}
      <div className="relative w-full sm:w-48 h-44 sm:h-auto shrink-0 bg-background overflow-hidden">
        {ticket.image_url ? (
          <img
            src={ticket.image_url}
            alt={ticket.event_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
            TicketMatchPro
          </div>
        )}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-primary border border-cardBorder shadow-sm">
          {ticket.category_name || 'Event'}
        </div>
      </div>

      {/* Ticket Content */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/ticket/${ticket.id}`} className="hover:text-primary transition-colors">
              <h3 className="text-base font-extrabold text-textMain leading-snug line-clamp-2">
                {ticket.event_name}
              </h3>
            </Link>
            {ticket.seller?.is_verified && (
              <span className="shrink-0 flex items-center gap-1 bg-success/10 text-success text-[11px] font-bold px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>

          {/* Event Metadata (Date, Time, Venue, City) */}
          <div className="mt-2.5 space-y-1.5 text-xs text-textSecondary">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span>{formatDate(ticket.event_date)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>{formatTime(ticket.event_time)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-textMain">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="truncate">{ticket.venue}, <strong>{ticket.city}</strong></span>
            </div>
          </div>

          {/* Seat / Section Pill Badges */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px]">
            <span className="bg-background text-textMain px-2.5 py-1 rounded-md font-semibold border border-cardBorder">
              {ticket.ticket_type || 'General'}
            </span>
            <span className="bg-background text-textMain px-2.5 py-1 rounded-md font-semibold border border-cardBorder">
              Sec {ticket.section || 'A'} • Row {ticket.row || '1'}
            </span>
            <span className="bg-secondaryLight text-primary px-2.5 py-1 rounded-md font-extrabold">
              Qty: {ticket.quantity || 1}
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-cardBorder flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] text-textSecondary">Selling Price</div>
            <div className="text-lg font-extrabold text-primary">
              {formatCurrency(ticket.selling_price)}
              {ticket.original_price > ticket.selling_price && (
                <span className="ml-2 text-xs font-semibold text-textMuted line-through">
                  {formatCurrency(ticket.original_price)}
                </span>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              <Link
                href={`/ticket/${ticket.id}`}
                className="flex items-center gap-1 px-3.5 py-2 rounded-full bg-primary text-white text-xs font-extrabold hover:bg-primary-dark shadow-sm transition-all"
              >
                View Details
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
