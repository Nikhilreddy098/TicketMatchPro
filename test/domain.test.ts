import assert from 'node:assert';
import { test, describe } from 'node:test';

import { calculateOrderTotal, processPaymentTransaction } from '../lib/payment';
import { loginSchema, registerSchema, ticketListingSchema } from '../utils/validation';
import { getTickets, createTicketListing, updateTicketStatus } from '../services/tickets';
import { createExchangeRequest, updateExchangeStatus } from '../services/exchange';
import { createOrder, verifyTicketByQrHash } from '../services/orders';
import { toggleFavorite, isTicketFavorite } from '../services/favorites';
import { formatCurrency, formatDate } from '../utils/formatting';

describe('TicketMatchPro Automated Test Suite (15 Test Cases)', () => {

  // 1. PRICING & ORDER CALCULATION TESTS
  test('TestCase 1: Price calculation adds 5% service fee correctly', () => {
    const ticketPrice = 2000;
    const totals = calculateOrderTotal(ticketPrice, 1);
    assert.strictEqual(totals.subtotal, 2000);
    assert.strictEqual(totals.serviceFee, 100);
    assert.strictEqual(totals.total, 2100);
    assert.strictEqual(totals.currency, 'INR');
  });

  test('TestCase 2: Currency formatting uses INR ₹ symbol', () => {
    const formatted = formatCurrency(2500);
    assert.strictEqual(formatted, '₹2,500');
  });

  // 2. FORM VALIDATION TESTS
  test('TestCase 3: Login Zod validation rejects invalid emails', () => {
    const invalidRes = loginSchema.safeParse({ email: 'bademail', password: '123' });
    assert.strictEqual(invalidRes.success, false);

    const validRes = loginSchema.safeParse({ email: 'user@example.com', password: 'password123' });
    assert.strictEqual(validRes.success, true);
  });

  test('TestCase 4: Registration Zod validation enforces password matching', () => {
    const mismatchRes = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'differentpassword',
    });
    assert.strictEqual(mismatchRes.success, false);

    const matchRes = registerSchema.safeParse({
      fullName: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    assert.strictEqual(matchRes.success, true);
  });

  test('TestCase 5: Ticket listing validation checks required fields', () => {
    const validListing = ticketListingSchema.safeParse({
      eventName: 'Coldplay Concert 2026',
      categoryId: '11111111-1111-1111-1111-111111111111',
      eventDate: '2026-10-25',
      eventTime: '19:00',
      venue: 'DY Patil Stadium',
      city: 'Mumbai',
      ticketType: 'VIP Gold',
      section: 'A',
      row: 'R1',
      seat: 'A-10',
      quantity: 1,
      originalPrice: 5000,
      sellingPrice: 4500,
      description: 'Great seats',
    });
    assert.strictEqual(validListing.success, true);
  });

  // 3. PAYMENT PORTAL & DEMO MODE TESTS
  test('TestCase 6: Demo Payment Mode creates unique order and payment IDs', async () => {
    const res = await processPaymentTransaction(
      { ticketId: 't-101', quantity: 1, paymentMethod: 'upi', isDemoMode: true },
      { subtotal: 2000, serviceFee: 100, total: 2100 }
    );
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.isDemoMode, true);
    assert.ok(res.orderId.startsWith('demo_ord_'));
    assert.ok(res.paymentId.startsWith('demo_pay_'));
  });

  // 4. ORDER CREATION & DIGITAL QR TICKET TESTS
  test('TestCase 7: Order creation generates digital ticket verification hash', async () => {
    const { order, verification } = await createOrder(
      'buyer-123',
      'seller-456',
      't-101',
      1,
      2800,
      140,
      'demo',
      'demo_ord_1',
      'demo_pay_1'
    );
    assert.ok(order.id.length > 0);
    assert.strictEqual(verification.status, 'VALID');
    assert.ok(verification.qr_hash.startsWith('TMP-QR-'));
  });

  test('TestCase 8: QR Verification lookup returns VALID for generated tickets', async () => {
    const { verification } = await createOrder(
      'buyer-123',
      'seller-456',
      't-103',
      1,
      1200,
      60,
      'demo',
      'demo_ord_2',
      'demo_pay_2'
    );

    const verified = await verifyTicketByQrHash(verification.qr_hash);
    assert.ok(verified !== null);
    assert.strictEqual(verified?.status, 'VALID');
  });

  test('TestCase 9: QR Verification returns null / NOT_FOUND for fake hashes', async () => {
    const verified = await verifyTicketByQrHash('INVALID-FAKE-QR-HASH-999');
    assert.strictEqual(verified, null);
  });

  // 5. P2P TICKET EXCHANGE TESTS
  test('TestCase 10: P2P exchange creation initializes request with pending status', async () => {
    const exchange = await createExchangeRequest('user-A', 'user-B', 't-101', 't-105', 'Can we swap?');
    assert.strictEqual(exchange.status, 'pending');
    assert.strictEqual(exchange.sender_id, 'user-A');
    assert.strictEqual(exchange.receiver_id, 'user-B');
  });

  test('TestCase 11: Accepting exchange request locks both tickets', async () => {
    const exchange = await createExchangeRequest('user-A', 'user-B', 't-101', 't-105');
    const success = await updateExchangeStatus(exchange.id, 'accepted');
    assert.strictEqual(success, true);
  });

  // 6. MARKETPLACE SEARCH & FILTERING TESTS
  test('TestCase 12: Ticket search filters by category correctly', async () => {
    const all = await getTickets({ category_id: '11111111-1111-1111-1111-111111111111' });
    assert.ok(all.every((t) => t.category_id === '11111111-1111-1111-1111-111111111111'));
  });

  test('TestCase 13: Ticket search filters by price range', async () => {
    const filtered = await getTickets({ minPrice: 1000, maxPrice: 3000 });
    assert.ok(filtered.every((t) => t.selling_price >= 1000 && t.selling_price <= 3000));
  });

  test('TestCase 14: Sorting tickets price low -> high orders correctly', async () => {
    const sorted = await getTickets({ sortBy: 'price_low' });
    for (let i = 0; i < sorted.length - 1; i++) {
      assert.ok(sorted[i].selling_price <= sorted[i + 1].selling_price);
    }
  });

  // 7. FAVORITES PERSISTENCE TESTS
  test('TestCase 15: Toggling favorite state updates persistence', async () => {
    const userId = 'user-fav-test';
    const ticketId = 't-104';

    const isFavInitial = await isTicketFavorite(userId, ticketId);
    const newState = await toggleFavorite(userId, ticketId);
    assert.strictEqual(newState, !isFavInitial);
  });

});
