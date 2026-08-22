export type PaymentMethodType = 'upi' | 'card' | 'netbanking' | 'wallet';

export interface PaymentRequest {
  ticketId: string;
  quantity: number;
  paymentMethod: PaymentMethodType;
  upiId?: string;
  cardNumber?: string;
  isDemoMode?: boolean;
}

export interface PaymentResult {
  success: boolean;
  orderId: string;
  paymentId: string;
  error?: string;
  isDemoMode: boolean;
}
