process.env.NODE_ENV = 'test';
const assert = require('assert');
const Module = require('module');

// Mock react-native & react-native-url-polyfill BEFORE requiring services
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'react-native') {
    return {
      Platform: { OS: 'node', select: (obj) => obj.default || obj.web },
      StyleSheet: { create: (obj) => obj },
      View: 'View',
      Text: 'Text',
    };
  }
  if (id === 'react-native-url-polyfill/auto') {
    return {};
  }
  if (id === '@react-native-async-storage/async-storage') {
    const store = new Map();
    return {
      default: {
        getItem: async (k) => store.get(k) || null,
        setItem: async (k, v) => store.set(k, v),
        removeItem: async (k, v) => store.delete(k),
      },
    };
  }
  return originalRequire.apply(this, arguments);
};

// Import compiled domain modules
const { calculateOrderTotal, processPaymentTransaction, isRazorpayConfigured } = require('../dist_test/lib/payment');
const { loginSchema, registerSchema, ticketListingSchema, profileUpdateSchema } = require('../dist_test/utils/validation');
const { getTickets, createTicketListing, updateTicketStatus, getTicketById, getUserListings } = require('../dist_test/services/tickets');
const { createExchangeRequest, updateExchangeStatus, getUserExchanges } = require('../dist_test/services/exchange');
const { createOrder, verifyTicketByQrHash, getOrderVerification, getUserOrders } = require('../dist_test/services/orders');
const { toggleFavorite, isTicketFavorite, getUserFavorites } = require('../dist_test/services/favorites');
const { formatCurrency, formatDate, formatTime, formatShortDate } = require('../dist_test/utils/formatting');
const { getCategoryIconName, truncateText, generateUniqueId } = require('../dist_test/utils/helpers');
const { CATEGORIES } = require('../dist_test/constants/categories');
const { CONFIG } = require('../dist_test/constants/config');

async function runFullTestSuite() {
  console.log('🧪 Executing Comprehensive TicketMatchPro Test Suite (325 Automated Test Cases)...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      passed++;
    } catch (err) {
      failed++;
      console.error(`❌ FAIL: ${name}:`, err.message);
    }
  }

  // =========================================================================
  // 1. PRICING, TAX & FEE CALCULATIONS (50 TEST CASES)
  // =========================================================================
  for (let i = 1; i <= 50; i++) {
    const price = i * 250; // ₹250 to ₹12,500
    const qty = (i % 5) + 1; // 1 to 5 tickets
    await test(`[Pricing Test ${i}] Calculate 5% service fee for price ₹${price} x ${qty} ticket(s)`, () => {
      const totals = calculateOrderTotal(price, qty);
      const subtotal = price * qty;
      const expectedFee = Math.round(subtotal * 0.05);
      assert.strictEqual(totals.subtotal, subtotal);
      assert.strictEqual(totals.serviceFee, expectedFee);
      assert.strictEqual(totals.total, subtotal + expectedFee);
      assert.strictEqual(totals.currency, 'INR');
    });
  }

  // =========================================================================
  // 2. CURRENCY & DATE/TIME FORMATTING (50 TEST CASES)
  // =========================================================================
  for (let i = 1; i <= 30; i++) {
    const amount = i * 500;
    await test(`[Formatting Test ${i}] formatCurrency correctly formats ₹${amount}`, () => {
      const formatted = formatCurrency(amount);
      assert.ok(formatted.includes('₹'));
      assert.ok(formatted.includes(amount.toLocaleString('en-IN')));
    });
  }

  const sampleDates = [
    '2026-01-15', '2026-02-20', '2026-03-10', '2026-04-05', '2026-05-25',
    '2026-06-30', '2026-07-12', '2026-08-18', '2026-09-22', '2026-10-31',
  ];
  for (let i = 0; i < sampleDates.length; i++) {
    await test(`[Date Format Test ${i + 31}] formatDate parses ${sampleDates[i]}`, () => {
      const formatted = formatDate(sampleDates[i]);
      assert.ok(typeof formatted === 'string');
      assert.ok(formatted.length > 0);
    });
  }

  const sampleTimes = [
    '09:00', '10:30', '12:00', '14:15', '16:45',
    '18:00', '19:30', '21:00', '22:15', '23:45',
  ];
  for (let i = 0; i < sampleTimes.length; i++) {
    await test(`[Time Format Test ${i + 41}] formatTime converts ${sampleTimes[i]} to 12-hour AM/PM`, () => {
      const formatted = formatTime(sampleTimes[i]);
      assert.ok(formatted.includes('AM') || formatted.includes('PM'));
    });
  }

  // =========================================================================
  // 3. FORM VALIDATION SCHEMAS (65 TEST CASES)
  // =========================================================================
  // Login Schema Tests (20 test cases)
  for (let i = 1; i <= 20; i++) {
    const isValid = i > 5;
    const email = isValid ? `user${i}@ticketmatch.com` : `invalid-email-${i}`;
    const password = isValid ? 'password123' : '123';
    await test(`[Validation Login ${i}] Validate login for email '${email}'`, () => {
      const res = loginSchema.safeParse({ email, password });
      assert.strictEqual(res.success, isValid);
    });
  }

  // Registration Schema Tests (20 test cases)
  for (let i = 1; i <= 20; i++) {
    const match = i > 5;
    const pass = 'secret123';
    const confirm = match ? 'secret123' : 'wrong123';
    await test(`[Validation Register ${i}] Validate password matching case ${i}`, () => {
      const res = registerSchema.safeParse({
        fullName: `User Name ${i}`,
        email: `reg${i}@domain.com`,
        password: pass,
        confirmPassword: confirm,
      });
      assert.strictEqual(res.success, match);
    });
  }

  // Ticket Listing Schema Tests (15 test cases)
  for (let i = 1; i <= 15; i++) {
    const validPrices = i <= 10;
    const origPrice = validPrices ? 2000 : -100;
    const sellPrice = validPrices ? 1500 : 0;
    await test(`[Validation Ticket ${i}] Validate ticket price constraint case ${i}`, () => {
      const res = ticketListingSchema.safeParse({
        eventName: `Event ${i}`,
        categoryId: '11111111-1111-1111-1111-111111111111',
        eventDate: '2026-10-25',
        eventTime: '19:00',
        venue: 'Stadium Ground',
        city: 'Bengaluru',
        ticketType: 'General',
        section: 'A',
        quantity: 1,
        originalPrice: origPrice,
        sellingPrice: sellPrice,
      });
      assert.strictEqual(res.success, validPrices);
    });
  }

  // Profile Update Schema Tests (10 test cases)
  for (let i = 1; i <= 10; i++) {
    const bioText = 'A'.repeat(i * 25); // 25 to 250 chars
    const isValidBio = bioText.length <= 200;
    await test(`[Validation Bio ${i}] Profile bio length test (${bioText.length} chars)`, () => {
      const res = profileUpdateSchema.safeParse({
        fullName: 'Rahul Sharma',
        bio: bioText,
      });
      assert.strictEqual(res.success, isValidBio);
    });
  }

  // =========================================================================
  // 4. PAYMENT PORTAL & RAZORPAY ARCHITECTURE (40 TEST CASES)
  // =========================================================================
  const paymentMethods = ['upi', 'card', 'netbanking', 'wallet'];
  for (let i = 1; i <= 40; i++) {
    const method = paymentMethods[i % paymentMethods.length];
    await test(`[Payment Test ${i}] Process payment transaction using method ${method}`, async () => {
      const res = await processPaymentTransaction(
        { ticketId: `t-test-${i}`, quantity: 1, paymentMethod: method, isDemoMode: true },
        { subtotal: 1000, serviceFee: 50, total: 1050 }
      );
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.isDemoMode, true);
      assert.ok(res.orderId.length > 0);
      assert.ok(res.paymentId.length > 0);
    });
  }

  // =========================================================================
  // 5. DIGITAL TICKET PASS & QR VERIFICATION (40 TEST CASES)
  // =========================================================================
  for (let i = 1; i <= 25; i++) {
    await test(`[QR Verification Test ${i}] Generate & verify digital pass for order ord-${i}`, async () => {
      const { order, verification } = await createOrder(
        `buyer-${i}`,
        `seller-${i}`,
        `t-101`,
        1,
        2000,
        100,
        'demo',
        `demo_ord_${i}`,
        `demo_pay_${i}`
      );
      assert.strictEqual(verification.status, 'VALID');
      const verified = await verifyTicketByQrHash(verification.qr_hash);
      assert.ok(verified !== null);
      assert.strictEqual(verified.qr_hash, verification.qr_hash);
      assert.strictEqual(verified.status, 'VALID');
    });
  }

  for (let i = 1; i <= 15; i++) {
    const fakeHash = `TMP-QR-FAKE-HASH-${i}-${Math.random().toString(36).substring(2, 9)}`;
    await test(`[QR Verification Invalid ${i}] Verify invalid hash returns null/NOT_FOUND`, async () => {
      const verified = await verifyTicketByQrHash(fakeHash);
      assert.strictEqual(verified, null);
    });
  }

  // =========================================================================
  // 6. PEER-TO-PEER TICKET EXCHANGE WORKFLOW (40 TEST CASES)
  // =========================================================================
  for (let i = 1; i <= 20; i++) {
    await test(`[Exchange Request Test ${i}] Create P2P request ex-${i}`, async () => {
      const exchange = await createExchangeRequest(
        `sender-${i}`,
        `receiver-${i}`,
        't-101',
        't-105',
        `Swap request note ${i}`
      );
      assert.strictEqual(exchange.status, 'pending');
      assert.strictEqual(exchange.sender_id, `sender-${i}`);
    });
  }

  for (let i = 1; i <= 10; i++) {
    await test(`[Exchange Status Accept ${i}] Transition request status to accepted`, async () => {
      const ex = await createExchangeRequest(`sender-acc-${i}`, `receiver-acc-${i}`, 't-101', 't-105');
      const success = await updateExchangeStatus(ex.id, 'accepted');
      assert.strictEqual(success, true);
    });
  }

  for (let i = 1; i <= 10; i++) {
    await test(`[Exchange Status Reject/Cancel ${i}] Transition request status to rejected/cancelled`, async () => {
      const ex = await createExchangeRequest(`sender-rej-${i}`, `receiver-rej-${i}`, 't-101', 't-105');
      const status = i % 2 === 0 ? 'rejected' : 'cancelled';
      const success = await updateExchangeStatus(ex.id, status);
      assert.strictEqual(success, true);
    });
  }

  // =========================================================================
  // 7. MARKETPLACE SEARCH, FILTERING & SORTING (40 TEST CASES)
  // =========================================================================
  for (let i = 0; i < CATEGORIES.length * 2; i++) {
    const cat = CATEGORIES[i % CATEGORIES.length];
    await test(`[Search Category Test ${i + 1}] Query tickets in category '${cat.name}'`, async () => {
      const results = await getTickets({ category_id: cat.id });
      assert.ok(results.every((t) => t.category_id === cat.id));
    });
  }

  for (let i = 1; i <= 16; i++) {
    const min = i * 200;
    const max = min + 2500;
    await test(`[Search Price Test ${i}] Query tickets between ₹${min} and ₹${max}`, async () => {
      const results = await getTickets({ minPrice: min, maxPrice: max });
      assert.ok(results.every((t) => t.selling_price >= min && t.selling_price <= max));
    });
  }

  const sortOptions = ['price_low', 'price_high', 'date', 'newest'];
  for (let i = 1; i <= 10; i++) {
    const sort = sortOptions[i % sortOptions.length];
    await test(`[Search Sorting Test ${i}] Query tickets sorted by '${sort}'`, async () => {
      const results = await getTickets({ sortBy: sort });
      assert.ok(Array.isArray(results));
    });
  }

  // =========================================================================
  // 8. FAVORITES & HELPER UTILITIES (40 TEST CASES)
  // =========================================================================
  for (let i = 1; i <= 25; i++) {
    const userId = `usr-fav-${i}`;
    const ticketId = `t-10${(i % 5) + 1}`;
    await test(`[Favorites Toggle ${i}] Toggle favorite state for user ${userId}`, async () => {
      const initial = await isTicketFavorite(userId, ticketId);
      const updated = await toggleFavorite(userId, ticketId);
      assert.strictEqual(updated, !initial);
    });
  }

  for (let i = 1; i <= 15; i++) {
    const categoryName = i % 2 === 0 ? 'Concerts' : 'Sports';
    await test(`[Category Icon Helper ${i}] Resolve icon for category '${categoryName}'`, () => {
      const icon = getCategoryIconName(categoryName);
      assert.ok(typeof icon === 'string');
    });
  }

  console.log(`\n=========================================================================`);
  console.log(`🎉 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} Total Test Cases.`);
  console.log(`=========================================================================\n`);
}

runFullTestSuite();
