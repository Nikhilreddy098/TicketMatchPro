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

const {
  saveMarketplaceLocation,
  getSavedMarketplaceLocation,
  normalizeCityName,
  isCityMatch,
} = require('../dist_test/services/location');
const { getTickets, getUserListings } = require('../dist_test/services/tickets');
const { createExchangeRequest } = require('../dist_test/services/exchange');
const { ALL_LOCATIONS_OPTION } = require('../dist_test/constants/cities');

async function runLocationTests() {
  console.log('📍 Running Location-Based Marketplace Discovery Test Suite...');

  // Test 1: Default marketplace location
  console.log('  Testing 1. Default marketplace location...');
  const defaultLoc = await getSavedMarketplaceLocation();
  assert.strictEqual(defaultLoc, ALL_LOCATIONS_OPTION);

  // Test 2: Selecting & Persisting Hyderabad
  console.log('  Testing 2. Selecting & Persisting Hyderabad...');
  await saveMarketplaceLocation('Hyderabad');
  const hydLoc = await getSavedMarketplaceLocation();
  assert.strictEqual(hydLoc, 'Hyderabad');

  // Test 3: Selecting & Persisting Mumbai
  console.log('  Testing 3. Selecting & Persisting Mumbai...');
  await saveMarketplaceLocation('Mumbai');
  const mumLoc = await getSavedMarketplaceLocation();
  assert.strictEqual(mumLoc, 'Mumbai');

  // Test 4: All Locations option clears filter
  console.log('  Testing 4. All Locations option clears filter...');
  await saveMarketplaceLocation('All Locations');
  const allLoc = await getSavedMarketplaceLocation();
  assert.strictEqual(allLoc, ALL_LOCATIONS_OPTION);

  // Test 5: Case-insensitive city normalization & matching
  console.log('  Testing 5. Case-insensitive city normalization & matching...');
  assert.strictEqual(normalizeCityName('hyderabad'), 'Hyderabad');
  assert.strictEqual(normalizeCityName('  mumbai  '), 'Mumbai');
  assert.strictEqual(normalizeCityName('NEW DELHI'), 'New Delhi');
  assert.strictEqual(isCityMatch('Hyderabad', 'hyderabad'), true);
  assert.strictEqual(isCityMatch('MUMBAI', 'Mumbai'), true);
  assert.strictEqual(isCityMatch('Bengaluru', 'Delhi'), false);

  // Test 6: Filtering active tickets by city (Hyderabad)
  console.log('  Testing 6. Filtering active tickets by city (Hyderabad)...');
  const hydTickets = await getTickets({ city: 'Hyderabad' });
  assert.ok(hydTickets.length >= 1, 'Should find tickets in Hyderabad');
  assert.ok(hydTickets.every((t) => t.city.toLowerCase().includes('hyderabad')));

  // Test 7: Filtering active tickets by city (Bengaluru)
  console.log('  Testing 7. Filtering active tickets by city (Bengaluru)...');
  const blrTickets = await getTickets({ city: 'Bengaluru' });
  assert.ok(blrTickets.length >= 1, 'Should find tickets in Bengaluru');
  assert.ok(blrTickets.every((t) => t.city.toLowerCase().includes('bengaluru')));

  // Test 8: Querying All Locations returns all active tickets
  console.log('  Testing 8. Querying All Locations returns all active tickets...');
  const allTickets = await getTickets({ city: ALL_LOCATIONS_OPTION });
  assert.ok(allTickets.length >= 5, 'Should return all active marketplace tickets');

  // Test 9: Empty location result (city with no listings)
  console.log('  Testing 9. Empty location result (city with no listings)...');
  const emptyTickets = await getTickets({ city: 'Tokyo' });
  assert.strictEqual(emptyTickets.length, 0, 'Should return empty array for city with no tickets');

  // Test 10: Seller can still see their own listing under getUserListings
  console.log('  Testing 10. Seller can still see their own listing...');
  const sellerListings = await getUserListings('u-1');
  assert.ok(sellerListings.length >= 1, 'Seller u-1 should see their listings');

  // Test 11: Seller cannot buy/request exchange for own ticket
  console.log('  Testing 11. Seller cannot request exchange for own ticket...');
  try {
    await createExchangeRequest('u-1', 'u-1', 't-101', 't-105', 'Self swap');
    assert.fail('Should prevent seller self-request');
  } catch (err) {
    assert.ok(err.message.includes('cannot request an exchange for your own ticket'));
  }

  console.log('✅ Location-Based Marketplace Discovery Test Suite Passed!');
}

runLocationTests().catch((err) => {
  console.error('❌ Location Test Error:', err);
  process.exit(1);
});
