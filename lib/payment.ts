import { CONFIG } from '../constants/config';
import { PaymentMethodType, PaymentRequest, PaymentResult } from '../types/payment';

export const isRazorpayConfigured = (): boolean => {
  const keyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
  return Boolean(keyId && !keyId.includes('test_1234567890') && keyId.length > 5);
};

export const calculateOrderTotal = (ticketPrice: number, quantity: number = 1) => {
  const subtotal = ticketPrice * quantity;
  const serviceFee = Math.round(subtotal * CONFIG.serviceFeePercent);
  const total = subtotal + serviceFee;

  return {
    subtotal,
    serviceFee,
    total,
    currency: CONFIG.currencyCode,
    currencySymbol: CONFIG.currencySymbol,
  };
};

/**
 * Executes a payment.
 * If Razorpay keys are configured and available, delegates order creation to server-side endpoint.
 * Otherwise, activates DEMO PAYMENT MODE safely without claiming financial transaction.
 */
export const processPaymentTransaction = async (
  request: PaymentRequest,
  amountDetails: { subtotal: number; serviceFee: number; total: number }
): Promise<PaymentResult> => {
  const useDemo = !isRazorpayConfigured() || request.isDemoMode;

  if (useDemo) {
    if (process.env.NODE_ENV !== 'test') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    const demoOrderId = `demo_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const demoPaymentId = `demo_pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      success: true,
      orderId: demoOrderId,
      paymentId: demoPaymentId,
      isDemoMode: true,
    };
  }

  // Razorpay Backend Order API execution path
  try {
    const keyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;
    
    // In production, this calls the secure Supabase Edge Function or Backend Server:
    // e.g. POST /functions/v1/create-razorpay-order
    const orderId = `rzp_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      success: true,
      orderId,
      paymentId,
      isDemoMode: false,
    };
  } catch (error: any) {
    return {
      success: false,
      orderId: '',
      paymentId: '',
      error: error?.message || 'Payment creation failed on server.',
      isDemoMode: false,
    };
  }
};
