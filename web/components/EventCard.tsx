'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Ticket } from '../lib/types';
import { formatCurrency, formatDate } from '../utils/formatting';

export const EventCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-cardBorder shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full">
      <div className="relative h-48 w-full bg-background overflow-hidden">
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
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-primary shadow-sm">
          {ticket.city}
        </div>
        <div className="absolute bottom-3 right-3 bg-primary text-white px-3 py-1 rounded-lg text-xs font-extrabold shadow-md">
          {formatCurrency(ticket.selling_price)}
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-textSecondary mb-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{formatDate(ticket.event_date)}</span>
          </div>

          <Link href={`/ticket/${ticket.id}`} className="hover:text-primary transition-colors">
            <h3 className="text-base font-extrabold text-textMain line-clamp-2 leading-snug">
              {ticket.event_name}
            </h3>
          </Link>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-textSecondary">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{ticket.venue}</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-cardBorder flex items-center justify-between text-xs font-bold text-primary">
          <span>View Ticket Offer</span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
