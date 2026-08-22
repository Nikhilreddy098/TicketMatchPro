import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Order, OrderStatus } from '../types/order';
import { TicketVerification } from '../types/database';
import { updateTicketStatus } from './tickets';
import { createNotification } from './notifications';
import { generateUniqueId } from '../utils/helpers';

let localOrders: Order[] = [
  {
    id: 'ord-8801',
    buyer_id: 'demo-user-123',
    seller_id: 'u-2',
    ticket_id: 't-102',
    quantity: 1,
    ticket_price: 3999,
    service_fee: 200,
    total_amount: 4199,
    currency: 'INR',
    payment_status: 'paid',
    payment_provider: 'demo',
    provider_order_id: 'demo_ord_99021',
    provider_payment_id: 'demo_pay_77210',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

let localVerifications: Record<string, TicketVerification> = {
  'ord-8801': {
    id: 'ver-1',
    ticket_id: 't-102',
    order_id: 'ord-8801',
    qr_hash: 'TMP-QR-T102-ORD8801-SECUREHASH99021',
    status: 'VALID',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
};

export const createOrder = async (
  buyerId: string,
  sellerId: string,
  ticketId: string,
  quantity: number,
  ticketPrice: number,
  serviceFee: number,
  paymentProvider: 'razorpay' | 'demo',
  providerOrderId: string,
  providerPaymentId: string
): Promise<{ order: Order; verification: TicketVerification }> => {
  const totalAmount = ticketPrice * quantity + serviceFee;
  const orderId = generateUniqueId('ord');

  const newOrder: Order = {
    id: orderId,
    buyer_id: buyerId,
    seller_id: sellerId,
    ticket_id: ticketId,
    quantity,
    ticket_price: ticketPrice,
    service_fee: serviceFee,
    total_amount: totalAmount,
    currency: 'INR',
    payment_status: 'paid',
    payment_provider: paymentProvider,
    provider_order_id: providerOrderId,
    provider_payment_id: providerPaymentId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const verificationHash = `TMP-QR-${ticketId.toUpperCase()}-${orderId.toUpperCase()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  const newVerification: TicketVerification = {
    id: generateUniqueId('ver'),
    ticket_id: ticketId,
    order_id: orderId,
    qr_hash: verificationHash,
    status: 'VALID',
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('orders').insert(newOrder);
      await supabase.from('ticket_verifications').insert(newVerification);
    } catch (e) {}
  }

  localOrders.unshift(newOrder);
  localVerifications[orderId] = newVerification;

  // Update ticket status to sold
  await updateTicketStatus(ticketId, 'sold');

  // Trigger Notifications
  await createNotification(
    buyerId,
    'Order Confirmed! 🎉',
    `Your ticket order #${orderId} was successful. View your QR ticket inside My Tickets.`,
    'order',
    { orderId, ticketId }
  );

  await createNotification(
    sellerId,
    'Ticket Sold! 💰',
    `Good news! Your ticket listing was purchased for ₹${totalAmount}.`,
    'order',
    { orderId, ticketId }
  );

  return { order: newOrder, verification: newVerification };
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, ticket:tickets(*), seller:profiles!seller_id(*)')
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as Order[];
    } catch (e) {}
  }
  return localOrders.filter((o) => o.buyer_id === userId);
};

export const getOrderVerification = async (orderId: string): Promise<TicketVerification | null> => {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('ticket_verifications').select('*').eq('order_id', orderId).single();
      if (data) return data as TicketVerification;
    } catch (e) {}
  }
  return localVerifications[orderId] || null;
};

export const verifyTicketByQrHash = async (qrHash: string): Promise<TicketVerification | null> => {
  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('ticket_verifications').select('*').eq('qr_hash', qrHash).single();
      if (data) return data as TicketVerification;
    } catch (e) {}
  }

  const ver = Object.values(localVerifications).find((v) => v.qr_hash === qrHash);
  return ver || null;
};
