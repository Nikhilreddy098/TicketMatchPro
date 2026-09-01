'use client';

import React from 'react';
import Link from 'next/link';
import { Ticket, ShieldCheck, QrCode, Lock, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-cardBorder text-textMain pt-12 pb-8 mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Buyer Protection & Guarantee Banner */}
        <div className="rounded-2xl bg-secondaryLight/50 p-6 mb-12 border border-primary/20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-textMain">100% Buyer Protection</div>
              <div className="text-xs text-textSecondary">Guaranteed authentic tickets or money back.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-textMain">Verified QR Passes</div>
              <div className="text-xs text-textSecondary">Digital entry passes verified on blockchain.</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-textMain">Peer-to-Peer Exchanges</div>
              <div className="text-xs text-textSecondary">Safely swap tickets with verified fans.</div>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-12 border-b border-cardBorder">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                <Ticket className="h-4 w-4 transform -rotate-12" />
              </div>
              <span className="text-lg font-extrabold text-textMain">
                TicketMatch<span className="text-primary">Pro</span>
              </span>
            </Link>
            <p className="text-xs text-textSecondary max-w-sm leading-relaxed">
              India's premier commercial ticket marketplace for concerts, IPL cricket, sports, comedy, theatre, and festivals. Buy, sell, and exchange verified tickets with complete confidence.
            </p>
          </div>

          {/* Popular Cities */}
          <div>
            <h4 className="text-xs font-bold text-textMain uppercase tracking-wider mb-3">Popular Hubs</h4>
            <ul className="space-y-2 text-xs text-textSecondary">
              <li><Link href="/browse?city=Hyderabad" className="hover:text-primary transition-colors">Tickets in Hyderabad</Link></li>
              <li><Link href="/browse?city=Bengaluru" className="hover:text-primary transition-colors">Tickets in Bengaluru</Link></li>
              <li><Link href="/browse?city=Mumbai" className="hover:text-primary transition-colors">Tickets in Mumbai</Link></li>
              <li><Link href="/browse?city=New Delhi" className="hover:text-primary transition-colors">Tickets in Delhi NCR</Link></li>
              <li><Link href="/browse?city=Chennai" className="hover:text-primary transition-colors">Tickets in Chennai</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-textMain uppercase tracking-wider mb-3">Categories</h4>
            <ul className="space-y-2 text-xs text-textSecondary">
              <li><Link href="/browse?category=11111111-1111-1111-1111-111111111111" className="hover:text-primary transition-colors">Music Concerts</Link></li>
              <li><Link href="/browse?category=22222222-2222-2222-2222-222222222222" className="hover:text-primary transition-colors">Sports & Cricket</Link></li>
              <li><Link href="/browse?category=55555555-5555-5555-5555-555555555555" className="hover:text-primary transition-colors">Standup & Theatre</Link></li>
              <li><Link href="/browse?category=44444444-4444-4444-4444-444444444444" className="hover:text-primary transition-colors">Cultural Festivals</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-textMain uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-xs text-textSecondary">
              <li><Link href="/sell" className="hover:text-primary transition-colors font-semibold text-primary">Sell a Ticket</Link></li>
              <li><Link href="/exchanges" className="hover:text-primary transition-colors">Peer Exchange</Link></li>
              <li><Link href="/dashboard" className="hover:text-primary transition-colors">My Dashboard</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Account Login</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-textSecondary">
          <div>
            © {new Date().getFullYear()} TicketMatchPro Inc. All rights reserved. Registered Commercial Ticket Marketplace.
          </div>
          <div className="flex items-center gap-1 text-textMuted">
            <span>Built for fans with</span>
            <Heart className="h-3 w-3 text-error fill-error" />
          </div>
        </div>
      </div>
    </footer>
  );
};
