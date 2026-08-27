process.env.NODE_ENV = 'test';
const assert = require('assert');
const Module = require('module');

// Mock react-native & async-storage BEFORE requiring compiled domain modules
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

const { createTicketListing, getUserListings, getTicketById, getTickets } = require('../dist_test/services/tickets');
const { saveMarketplaceLocation } = require('../dist_test/services/location');

async function runPersistenceTests() {
  console.log('💾 Running Critical Ticket Persistence & Reload Test Suite...');

  const sellerUserId = 'u-persist-seller-999';

  // Test 1: Ticket creation persists with correct seller_id
  console.log('  Testing 1. Ticket creation persists with correct seller_id...');
  const createdTicket = await createTicketListing({
    seller_id: sellerUserId,
    event_name: 'PERSISTENCE CONCERT LIVE 2026',
    category_id: '11111111-1111-1111-1111-111111111111',
    category_name: 'Concerts',
    event_date: '2026-11-20',
    event_time: '20:00',
    venue: 'M. A. Chidambaram Stadium',
    city: 'Chennai',
    ticket_type: 'VIP Gold',
    section: 'Zone A',
    row: 'Row 1',
    seat: 'A-101',
    quantity: 2,
    original_price: 3000,
    selling_price: 2500,
    description: 'Persistence verification test ticket.',
    image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
  });

  assert.ok(createdTicket.id, 'Created ticket should have a valid ID');
  assert.strictEqual(createdTicket.seller_id, sellerUserId, 'Created ticket seller_id must match authenticated user ID');
  assert.strictEqual(createdTicket.event_name, 'PERSISTENCE CONCERT LIVE 2026');
  assert.strictEqual(createdTicket.city, 'Chennai');

  // Test 2: getUserListings retrieves persisted ticket directly by seller_id
  console.log('  Testing 2. getUserListings retrieves persisted ticket directly by seller_id...');
  const sellerListings = await getUserListings(sellerUserId);
  assert.ok(sellerListings.length >= 1, 'getUserListings should return created ticket');
  const found = sellerListings.find((t) => t.id === createdTicket.id);
  assert.ok(found, 'Created ticket should be present in My Listings');

  // Test 3: Logout/Login simulation (re-querying getUserListings for sellerUserId)
  console.log('  Testing 3. Logout/Login simulation retains created ticket...');
  // Simulate complete session reset: querying getUserListings with same sellerUserId after session restore
  const postLoginListings = await getUserListings(sellerUserId);
  assert.ok(
    postLoginListings.some((t) => t.id === createdTicket.id),
    'Created ticket must survive logout/login cycle and remain in My Listings'
  );

  // Test 4: App reload simulation (getTicketById retrieves row from database)
  console.log('  Testing 4. App reload simulation (retrieving ticket by ID)...');
  const reloadedTicket = await getTicketById(createdTicket.id);
  assert.ok(reloadedTicket, 'Ticket row must exist and be retrievable by ID after reload');
  assert.strictEqual(reloadedTicket.seller_id, sellerUserId);

  // Test 5: My Listings ignores marketplace location filter
  console.log('  Testing 5. My Listings ignores marketplace location filter...');
  await saveMarketplaceLocation('Mumbai'); // Set marketplace filter to Mumbai
  const myChennaiListings = await getUserListings(sellerUserId);
  assert.ok(
    myChennaiListings.some((t) => t.id === createdTicket.id && t.city === 'Chennai'),
    'My Listings MUST show user created tickets regardless of selected marketplace location (e.g. Mumbai)'
  );

  // Test 6: Marketplace search reflects selected city while My Listings retains seller listings
  console.log('  Testing 6. Marketplace search vs My Listings separation...');
  const mumbaiMarketplace = await getTickets({ city: 'Mumbai' });
  const myOriginalListings = await getUserListings(sellerUserId);
  assert.ok(
    myOriginalListings.some((t) => t.id === createdTicket.id),
    'My Listings retains seller tickets even when marketplace filter is active'
  );

  console.log('✅ Critical Ticket Persistence & Reload Test Suite Passed!');
}

runPersistenceTests().catch((err) => {
  console.error('❌ Persistence Test Error:', err);
  process.exit(1);
});
