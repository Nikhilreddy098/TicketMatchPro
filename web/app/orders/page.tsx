'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../components/AuthProvider';
import { supabase } from '../../lib/supabase';
import { Order, Ticket } from '../../lib/types';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { QrCode, ShoppingBag, ArrowLeft, ShieldCheck, CheckCircle } from 'lucide-react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const ticketIdParam = searchParams.get('ticketId');
  const orderIdParam = searchParams.get('id');

  const [orders, setOrders] = useState<Order[]>([]);
  const [targetTicket, setTargetTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchasedSuccess, setPurchasedSuccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      if (ticketIdParam) {
        fetchTargetTicket(ticketIdParam);
      }
      fetchOrders();
    }
  }, [user, isLoading, ticketIdParam]);

  const fetchTargetTicket = async (id: string) => {
    try {
      const { data } = await supabase.from('tickets').select('*, seller:profiles(*)').eq('id', id).single();
      if (data) setTargetTicket(data as Ticket);
    } catch (e) {}
  };

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, ticket:tickets(*)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setOrders(data as Order[]);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!user || !targetTicket) return;
    setPurchasing(true);
    try {
      const serviceFee = Math.round(targetTicket.selling_price * 0.05);
      const totalAmount = targetTicket.selling_price + serviceFee;

      // 1. Insert Order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          seller_id: targetTicket.seller_id,
          ticket_id: targetTicket.id,
          quantity: 1,
          unit_price: targetTicket.selling_price,
          service_fee: serviceFee,
          total_amount: totalAmount,
          payment_method: 'UPI / Card (Demo Secured)',
          payment_id: `pay_${Math.random().toString(36).substring(2, 10)}`,
          status: 'completed',
        })
        .select('*')
        .single();

      if (orderErr) throw new Error(orderErr.message);

      // 2. Mark ticket status as sold
      await supabase.from('tickets').update({ status: 'sold' }).eq('id', targetTicket.id);

      setPurchasedSuccess(true);
      fetchOrders();
    } catch (e: any) {
      alert(e?.message || 'Checkout failed.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {targetTicket && !purchasedSuccess ? (
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-cardBorder shadow-xl space-y-6 max-w-xl mx-auto">
            <h1 className="text-2xl font-black text-textMain">Checkout & Purchase Pass</h1>

            <div className="p-4 rounded-2xl bg-background border border-cardBorder space-y-2 text-xs">
              <div className="font-extrabold text-sm text-textMain">{targetTicket.event_name}</div>
              <div className="text-textSecondary">{targetTicket.venue}, {targetTicket.city}</div>
              <div className="font-bold text-textMain">Sec {targetTicket.section} • Row {targetTicket.row} • Seat {targetTicket.seat}</div>
            </div>

            <div className="space-y-2 border-t border-cardBorder pt-4 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-textSecondary">Ticket Price</span>
                <span>{formatCurrency(targetTicket.selling_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textSecondary">5% Marketplace Service Fee</span>
                <span>{formatCurrency(Math.round(targetTicket.selling_price * 0.05))}</span>
              </div>
              <div className="flex justify-between border-t border-cardBorder pt-2 text-sm font-black text-primary">
                <span>Total Amount Payable</span>
                <span>{formatCurrency(targetTicket.selling_price + Math.round(targetTicket.selling_price * 0.05))}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={purchasing}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-extrabold text-white shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {purchasing ? 'Processing Order...' : 'Confirm & Complete Order'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-6">
              <h1 className="text-3xl font-black text-textMain tracking-tight">Order History & Digital Passes</h1>
              <p className="text-xs sm:text-sm text-textSecondary mt-1">
                View your confirmed ticket orders and access entry QR codes.
              </p>
            </div>

            {loading ? (
              <div className="h-40 bg-white rounded-2xl animate-pulse border border-cardBorder" />
            ) : orders.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 text-center border border-cardBorder max-w-lg mx-auto shadow-sm my-8">
                <ShoppingBag className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="text-base font-bold text-textMain">No Purchased Orders Yet</h3>
                <p className="text-xs text-textSecondary mt-1">
                  Browse tickets on the marketplace to purchase verified entry passes.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="rounded-3xl bg-white p-6 border border-cardBorder shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-cardBorder pb-3">
                      <div>
                        <div className="text-sm font-black text-textMain">{ord.ticket?.event_name || 'Event Pass'}</div>
                        <div className="text-xs text-textSecondary">Order #{ord.id} • Purchased on {formatDate(ord.created_at)}</div>
                      </div>
                      <div className="text-sm font-extrabold text-success">{formatCurrency(ord.total_amount)}</div>
                    </div>

                    {/* QR Code Digital Pass Preview */}
                    <div className="p-4 rounded-2xl bg-secondaryLight/50 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white border border-cardBorder flex items-center justify-center text-primary shadow-sm">
                          <QrCode className="h-7 w-7" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-textMain">Verified QR Entry Pass</div>
                          <div className="text-[11px] text-textSecondary">Ready for venue entry scanner</div>
                        </div>
                      </div>
                      <div className="bg-success/10 text-success text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> 100% Valid
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold">Loading Orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
