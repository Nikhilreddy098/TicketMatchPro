process.env.NODE_ENV = 'test';
const assert = require('assert');
const Module = require('module');

// Mock react-native for node environment
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

const { createTicketListing, getUserListings, getTickets } = require('../dist_test/services/tickets');

async function runWebSyncTests() {
  console.log('🌐 Running Web Platform & Android Cross-Sync Test Suite...');

  const userId = 'usr-web-sync-777';

  // Test 1: Ticket created via ticket listing service (shared backend)
  console.log('  Testing 1. Create ticket on shared backend...');
  const createdTicket = await createTicketListing({
    seller_id: userId,
    event_name: 'TEST WEB SYNC TICKET 2026',
    category_id: '11111111-1111-1111-1111-111111111111',
    category_name: 'Concerts',
    event_date: '2026-12-15',
    event_time: '19:30',
    venue: 'JLN Stadium Ground',
    city: 'Hyderabad',
    ticket_type: 'VIP Gold',
    section: 'A',
    row: 'R1',
    seat: 'A-10',
    quantity: 2,
    original_price: 3500,
    selling_price: 3000,
    description: 'Shared database sync test ticket.',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
  });

  assert.ok(createdTicket.id, 'Created ticket should have a valid ID');
  assert.strictEqual(createdTicket.seller_id, userId);

  // Test 2: Verify ticket appears in getUserListings (Android API)
  console.log('  Testing 2. Retrieve ticket on Android (getUserListings)...');
  const androidListings = await getUserListings(userId);
  assert.ok(
    androidListings.some((t) => t.id === createdTicket.id && t.event_name === 'TEST WEB SYNC TICKET 2026'),
    'Ticket created on shared backend must appear in Android My Listings'
  );

  // Test 3: Verify ticket appears in Marketplace Discovery (Web API)
  console.log('  Testing 3. Retrieve ticket on Web Marketplace Discovery...');
  const marketplaceTickets = await getTickets({ city: 'Hyderabad' });
  assert.ok(
    marketplaceTickets.some((t) => t.id === createdTicket.id),
    'Ticket created on shared backend must appear in Web Marketplace Browse'
  );

  console.log('✅ Web Platform & Android Cross-Sync Test Suite Passed!');
}

runWebSyncTests().catch((err) => {
  console.error('❌ Web Sync Test Error:', err);
  process.exit(1);
});
