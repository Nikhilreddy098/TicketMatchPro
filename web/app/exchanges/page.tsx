'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';
import { ExchangeRequest, Ticket } from '../../lib/types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { ArrowRightLeft, Check, X, ShieldCheck, Ticket as TicketIcon, AlertCircle } from 'lucide-react';

export default function ExchangesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchExchanges();
    }
  }, [user, isLoading]);

  const fetchExchanges = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Incoming requests where current user is receiver
      const { data: incData } = await supabase
        .from('exchange_requests')
        .select('*, sender:profiles!exchange_requests_sender_id_fkey(*), offered_ticket:tickets!exchange_requests_offered_ticket_id_fkey(*), requested_ticket:tickets!exchange_requests_requested_ticket_id_fkey(*)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });

      if (incData) {
        setIncomingRequests(incData as ExchangeRequest[]);
      }

      // 2. Outgoing requests where current user is sender
      const { data: outData } = await supabase
        .from('exchange_requests')
        .select('*, receiver:profiles!exchange_requests_receiver_id_fkey(*), offered_ticket:tickets!exchange_requests_offered_ticket_id_fkey(*), requested_ticket:tickets!exchange_requests_requested_ticket_id_fkey(*)')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (outData) {
        setOutgoingRequests(outData as ExchangeRequest[]);
      }
    } catch (e) {
      console.warn('Exchange fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'accepted' | 'rejected' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('exchange_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (!error) {
        fetchExchanges();
      }
    } catch (e) {
      console.error('Update status error:', e);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 text-xs font-bold text-textMain">
          Loading Exchanges...
        </main>
        <Footer />
      </div>
    );
  }

  const list = activeTab === 'incoming' ? incomingRequests : outgoingRequests;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-textMain tracking-tight">Peer-to-Peer Exchange Portal</h1>
          <p className="text-xs sm:text-sm text-textSecondary mt-1">
            Swap tickets directly with verified fans. 100% secure peer exchange workflows.
          </p>
        </div>

        {/* Segmented Tabs */}
        <div className="flex items-center gap-2 border-b border-cardBorder mb-6">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all ${
              activeTab === 'incoming'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textMain'
            }`}
          >
            Incoming Swap Requests ({incomingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all ${
              activeTab === 'outgoing'
                ? 'border-primary text-primary'
                : 'border-transparent text-textSecondary hover:text-textMain'
            }`}
          >
            Sent Exchange Requests ({outgoingRequests.length})
          </button>
        </div>

        {loading ? (
          <div className="h-40 bg-white rounded-2xl animate-pulse border border-cardBorder" />
        ) : list.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center border border-cardBorder max-w-lg mx-auto shadow-sm my-8">
            <ArrowRightLeft className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="text-base font-bold text-textMain">No {activeTab} Exchange Requests</h3>
            <p className="text-xs text-textSecondary mt-1">
              Browse tickets on the marketplace to request an exchange with a seller.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((req) => (
              <div key={req.id} className="rounded-3xl bg-white p-6 border border-cardBorder shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-cardBorder pb-3 text-xs">
                  <span className="font-bold text-textSecondary">
                    Request #{req.id} • Created {formatDate(req.created_at)}
                  </span>
                  <span
                    className={`font-extrabold px-3 py-1 rounded-full uppercase text-[10px] ${
                      req.status === 'accepted'
                        ? 'bg-success/10 text-success'
                        : req.status === 'rejected' || req.status === 'cancelled'
                        ? 'bg-error/10 text-error'
                        : 'bg-secondaryLight text-primary'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Offered Ticket */}
                  <div className="p-4 rounded-2xl bg-background border border-cardBorder space-y-2">
                    <div className="text-[11px] font-bold text-textSecondary uppercase">Offered Ticket</div>
                    <div className="text-sm font-black text-textMain">{req.offered_ticket?.event_name || 'Event Ticket'}</div>
                    <div className="text-xs text-textSecondary">{req.offered_ticket?.city} • {formatCurrency(req.offered_ticket?.selling_price || 0)}</div>
                  </div>

                  {/* Requested Ticket */}
                  <div className="p-4 rounded-2xl bg-background border border-cardBorder space-y-2">
                    <div className="text-[11px] font-bold text-textSecondary uppercase">Requested Ticket</div>
                    <div className="text-sm font-black text-textMain">{req.requested_ticket?.event_name || 'Event Ticket'}</div>
                    <div className="text-xs text-textSecondary">{req.requested_ticket?.city} • {formatCurrency(req.requested_ticket?.selling_price || 0)}</div>
                  </div>
                </div>

                {req.message && (
                  <div className="p-3 bg-secondaryLight/50 rounded-xl text-xs text-textSecondary italic">
                    "{req.message}"
                  </div>
                )}

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="pt-2 flex items-center justify-end gap-3">
                    {activeTab === 'incoming' ? (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-error bg-error/10 hover:bg-error/20"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'accepted')}
                          className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-success shadow-md hover:bg-success/90"
                        >
                          Accept Exchange
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'cancelled')}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-textSecondary bg-background border border-cardBorder hover:text-textMain"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
