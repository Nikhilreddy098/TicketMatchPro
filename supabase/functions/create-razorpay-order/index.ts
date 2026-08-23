import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? Deno.env.get('EXPO_PUBLIC_RAZORPAY_KEY_ID') ?? '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

    if (!razorpayKeySecret || !razorpayKeyId) {
      return new Response(
        JSON.stringify({ error: 'Razorpay server API keys not configured.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ticketId, quantity = 1, buyerId } = await req.json();

    if (!ticketId || !buyerId) {
      return new Response(
        JSON.stringify({ error: 'Missing ticketId or buyerId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found or unavailable' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subtotal = Number(ticket.selling_price) * Number(quantity);
    const serviceFee = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + serviceFee;
    const amountInPaise = Math.round(totalAmount * 100); // Razorpay requires amount in paise

    // Create order via Razorpay API
    const authHeader = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `tmp_rcpt_${Date.now()}`,
        notes: {
          ticketId,
          buyerId,
          sellerId: ticket.seller_id,
        },
      }),
    });

    const rzpOrder = await rzpResponse.json();

    if (!rzpResponse.ok) {
      return new Response(
        JSON.stringify({ error: rzpOrder.error?.description || 'Failed to create Razorpay Order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert pending order in Database
    const { data: dbOrder, error: dbError } = await supabase
      .from('orders')
      .insert({
        buyer_id: buyerId,
        seller_id: ticket.seller_id,
        ticket_id: ticketId,
        quantity,
        ticket_price: ticket.selling_price,
        service_fee: serviceFee,
        total_amount: totalAmount,
        currency: 'INR',
        payment_status: 'pending',
        payment_provider: 'razorpay',
        provider_order_id: rzpOrder.id,
      })
      .select()
      .single();

    if (dbError) {
      return new Response(
        JSON.stringify({ error: 'Failed to record pending order in database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: dbOrder.id,
        razorpayOrderId: rzpOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        keyId: razorpayKeyId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
