'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../components/AuthProvider';
import { TicketCard } from '../../components/TicketCard';
import { supabase } from '../../lib/supabase';
import { Ticket, Order } from '../../lib/types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { Ticket as TicketIcon, ShoppingBag, ArrowRightLeft, PlusCircle, ShieldCheck, QrCode } from 'lucide-react';

type TabType = 'listings' | 'purchased' | 'sold';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('listings');
  const [listings, setListings] = useState<Ticket[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchUserData();
    }
  }, [user, isLoading]);

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch user's listings directly from Supabase
      const { data: listingsData } = await supabase
        .from('tickets')
        .select('*, seller:profiles(*)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (listingsData) {
        setListings(listingsData as Ticket[]);
      }

      // 2. Fetch user's purchased orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, ticket:tickets(*)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (ordersData) {
        setOrders(ordersData as Order[]);
      }
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const activeListings = listings.filter((l) => l.status !== 'sold');
  const soldListings = listings.filter((l) => l.status === 'sold');

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 text-xs font-bold text-textMain">
          Loading Dashboard...
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* User Banner Header */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-cardBorder shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/20">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-textMain">{profile?.full_name || 'My Dashboard'}</h1>
                {profile?.is_verified && (
                  <span className="flex items-center gap-1 bg-success/10 text-success text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Fan
                  </span>
                )}
              </div>
              <div className="text-xs text-textSecondary mt-0.5">{user.email}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/sell"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              List New Ticket
            </Link>
            <Link
              href="/exchanges"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-background px-4 py-3 text-xs font-extrabold text-textMain border border-cardBorder hover:border-primary/40 transition-all"
            >
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Exchanges
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-cardBorder mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === 'listings'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textMain'
            }`}
          >
            My Listings ({activeListings.length})
          </button>
          <button
            onClick={() => setActiveTab('purchased')}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === 'purchased'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textMain'
            }`}
          >
            Purchased Tickets ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all shrink-0 ${
              activeTab === 'sold'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textMain'
            }`}
          >
            Sold Tickets ({soldListings.length})
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-40 w-full bg-white rounded-2xl animate-pulse border border-cardBorder" />
          </div>
        ) : activeTab === 'listings' ? (
          activeListings.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center border border-cardBorder max-w-lg mx-auto shadow-sm my-8">
              <TicketIcon className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="text-base font-bold text-textMain">No Active Listings</h3>
              <p className="text-xs text-textSecondary mt-1">
                You haven't listed any tickets for sale yet.
              </p>
              <Link
                href="/sell"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20"
              >
                List a Ticket Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeListings.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )
        ) : activeTab === 'purchased' ? (
          orders.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center border border-cardBorder max-w-lg mx-auto shadow-sm my-8">
              <ShoppingBag className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="text-base font-bold text-textMain">No Purchased Tickets Yet</h3>
              <p className="text-xs text-textSecondary mt-1">
                Explore active listings on the marketplace to buy verified tickets.
              </p>
              <Link
                href="/browse"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/20"
              >
                Browse Marketplace
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl bg-white p-5 border border-cardBorder shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-4 border-b border-cardBorder pb-3">
                    <div>
                      <div className="text-sm font-black text-textMain">
                        {order.ticket?.event_name || 'Event Ticket'}
                      </div>
                      <div className="text-xs text-textSecondary mt-0.5">
                        Order #{order.id} • Purchased on {formatDate(order.created_at)}
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-success">
                      {formatCurrency(order.total_amount)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-textSecondary">Digital Entry QR Status: <strong>VERIFIED VALID</strong></span>
                    <Link
                      href={`/orders?id=${order.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold shadow-sm"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      View Digital Pass
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          soldListings.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center border border-cardBorder max-w-lg mx-auto shadow-sm my-8">
              <TicketIcon className="h-10 w-10 text-primary mx-auto mb-3" />
              <h3 className="text-base font-bold text-textMain">No Sold Tickets Yet</h3>
              <p className="text-xs text-textSecondary mt-1">
                When buyers purchase your listed tickets, they will appear right here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {soldListings.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} showActions={false} />
              ))}
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
