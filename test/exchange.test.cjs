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
  createExchangeRequest,
  hasPendingExchangeRequest,
  getExchangeRequestsForSeller,
  getExchangeRequestsForRequester,
  acceptExchangeRequest,
  rejectExchangeRequest,
  cancelExchangeRequest,
} = require('../dist_test/services/exchange');

async function runExchangeTests() {
  console.log('🔄 Running STEP 3 Exchange Requests Test Suite...');

  const senderId = 'user-requester-101';
  const sellerId = 'user-seller-202';
  const offeredTicketId = 't-offered-1';
  const requestedTicketId = 't-requested-2';

  // Test 1: Creating exchange request
  console.log('  Testing 1. Creating exchange request...');
  const req = await createExchangeRequest(
    senderId,
    sellerId,
    offeredTicketId,
    requestedTicketId,
    'Would love to swap tickets!'
  );
  assert.strictEqual(req.sender_id, senderId);
  assert.strictEqual(req.receiver_id, sellerId);
  assert.strictEqual(req.status, 'pending');

  // Test 2: Duplicate pending request prevention
  console.log('  Testing 2. Duplicate pending request prevention...');
  const isPending = await hasPendingExchangeRequest(senderId, requestedTicketId);
  assert.strictEqual(isPending, true, 'hasPendingExchangeRequest should return true for pending request');

  try {
    await createExchangeRequest(senderId, sellerId, offeredTicketId, requestedTicketId, 'Duplicate');
    assert.fail('Should throw error for duplicate pending request');
  } catch (err) {
    assert.strictEqual(
      err.message.includes('already have a pending exchange request'),
      true,
      'Error message should specify duplicate pending request'
    );
  }

  // Test 3: Seller cannot request own ticket
  console.log('  Testing 3. Seller cannot request own ticket...');
  try {
    await createExchangeRequest(sellerId, sellerId, offeredTicketId, requestedTicketId, 'Self swap');
    assert.fail('Should throw error when seller requests own ticket');
  } catch (err) {
    assert.strictEqual(
      err.message.includes('cannot request an exchange for your own ticket'),
      true,
      'Error message should specify self-request restriction'
    );
  }

  // Test 4: Seller can see their requests
  console.log('  Testing 4. Seller can see their requests...');
  const sellerExchanges = await getExchangeRequestsForSeller(sellerId);
  assert.strictEqual(sellerExchanges.length >= 1, true);
  assert.strictEqual(sellerExchanges[0].receiver_id, sellerId);

  // Test 5: Requester can see their requests
  console.log('  Testing 5. Requester can see their requests...');
  const requesterExchanges = await getExchangeRequestsForRequester(senderId);
  assert.strictEqual(requesterExchanges.length >= 1, true);
  assert.strictEqual(requesterExchanges[0].sender_id, senderId);

  // Test 6: Unauthorized modification rejection (Requester trying to accept)
  console.log('  Testing 6. Unauthorized modification rejection (Requester trying to accept)...');
  try {
    await acceptExchangeRequest(req.id, senderId);
    assert.fail('Should reject non-seller attempt to accept request');
  } catch (err) {
    assert.strictEqual(
      err.message.includes('Only the ticket seller can accept or reject'),
      true,
      'Error should enforce seller authorization'
    );
  }

  // Test 7: Seller accepts request
  console.log('  Testing 7. Seller accepts request...');
  const acceptResult = await acceptExchangeRequest(req.id, sellerId);
  assert.strictEqual(acceptResult, true);

  // Test 8: Unauthenticated request rejection
  console.log('  Testing 8. Unauthenticated request rejection...');
  try {
    await createExchangeRequest('', sellerId, offeredTicketId, 't-requested-3');
    assert.fail('Should fail unauthenticated request creation');
  } catch (err) {
    assert.strictEqual(
      err.message.includes('Authentication required'),
      true,
      'Error should specify authentication requirement'
    );
  }

  // Test 9: Reject flow
  console.log('  Testing 9. Reject flow...');
  const sender2 = 'user-requester-303';
  const req2 = await createExchangeRequest(sender2, sellerId, offeredTicketId, 't-requested-4', 'Reject test');
  const rejectResult = await rejectExchangeRequest(req2.id, sellerId);
  assert.strictEqual(rejectResult, true);

  console.log('✅ STEP 3 Exchange Requests Test Suite Passed!');
}

runExchangeTests().catch((err) => {
  console.error('❌ Exchange Test Error:', err);
  process.exit(1);
});
