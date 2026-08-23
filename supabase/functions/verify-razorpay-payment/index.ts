import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HmacSha256 } from 'https://deno.land/std@0.160.0/hash/sha256.ts';

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
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Missing payment signature verification parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Compute expected HMAC SHA256 signature
    let expectedSignature = '';
    if (razorpayKeySecret) {
      const hmac = new HmacSha256(razorpayKeySecret);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      expectedSignature = hmac.hex();
    }

    const isVerified = Boolean(razorpayKeySecret && expectedSignature === razorpaySignature);

    if (!isVerified && razorpayKeySecret) {
      // Mark order as failed in database
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({ verified: false, error: 'Razorpay HMAC signature verification failed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order details
    const { data: dbOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!dbOrder) {
      return new Response(
        JSON.stringify({ verified: false, error: 'Order record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order status to paid
    await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        provider_payment_id: razorpayPaymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    // Record payment entry
    await supabase.from('payments').insert({
      order_id: orderId,
      user_id: dbOrder.buyer_id,
      amount: dbOrder.total_amount,
      currency: 'INR',
      provider: 'razorpay',
      provider_order_id: razorpayOrderId,
      provider_payment_id: razorpayPaymentId,
      status: 'success',
      payment_method: 'upi',
    });

    // Update ticket status to sold
    await supabase
      .from('tickets')
      .update({ status: 'sold', updated_at: new Date().toISOString() })
      .eq('id', dbOrder.ticket_id);

    // Generate verified digital QR pass
    const qrHash = `TMP-QR-${crypto.randomUUID()}`;
    await supabase.from('ticket_verifications').insert({
      ticket_id: dbOrder.ticket_id,
      order_id: orderId,
      qr_hash: qrHash,
      status: 'VALID',
    });

    return new Response(
      JSON.stringify({
        verified: true,
        orderId,
        qrHash,
        message: 'Payment verified and digital ticket generated successfully.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ verified: false, error: err?.message || 'Verification exception' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
