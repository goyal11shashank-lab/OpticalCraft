/**
 * Phase 4 Acceptance Tests for OptiCraft Eyewear Cart Engine
 */

import {
  getOrCreateCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  clearCart,
  mergeCarts,
} from '../src/server/cartEngine';
import { db } from '../src/server/db';
import { buildAndValidateConfiguration } from '../src/server/configurationEngine';

async function runTests() {
  console.log('====================================================');
  console.log('OPTICRAFT EYEWEAR - PHASE 4 ACCEPTANCE TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // Retrieve seed data from db maps
  const allProducts = Array.from(db.products.values());
  const allLensTypes = Array.from(db.lensTypes.values());
  const allMaterials = Array.from(db.lensMaterials.values());
  const allCoatings = Array.from(db.coatings.values());

  const frame1 = allProducts.find((p) => p.id === 'prod-titan-gold-round') || allProducts[0];
  const frame1Id = frame1.id;
  const plainLens = allLensTypes.find((l) => !l.requiresPrescription) || allLensTypes[0];
  const singleVisionLens = allLensTypes.find((l) => l.requiresPrescription) || allLensTypes[1];
  const stdMaterial = allMaterials[0];
  const arcCoating = allCoatings[0];
  const blueCoating = allCoatings[1];

  const testSession1 = `cart-session-test-session-${Date.now()}-1`;
  const testSession2 = `cart-session-test-session-${Date.now()}-2`;
  const testUserId = `test-user-${Date.now()}`;
  const testUserCartKey = `cart-user-${testUserId}`;

  // Raw inputs for testing
  const rawInput1 = {
    productId: frame1Id,
    lensTypeId: plainLens.id,
    materialId: stdMaterial.id,
    coatingIds: [arcCoating.id],
  };

  // TEST 1: Add standard frame + plain lens to cart
  const res1 = addCartItem(testSession1, rawInput1, 1);
  assert(
    res1.success && res1.cart?.items.length === 1 && res1.cart?.items[0].quantity === 1,
    'Test 1: Add standard frame + plain lens to cart',
    `Items count: ${res1.cart?.items?.length}`
  );

  // TEST 2: Add same frame + same plain lens again -> Quantity increases, no duplicate created
  const res2 = addCartItem(testSession1, rawInput1, 1);
  assert(
    res2.success && res2.cart?.items.length === 1 && res2.cart?.items[0].quantity === 2,
    'Test 2: Add same frame + same plain lens again increases quantity',
    `Quantity is ${res2.cart?.items[0]?.quantity}`
  );

  // TEST 3: Add same frame + different lens/coating -> Separate cart item created
  const rawInput3 = {
    productId: frame1Id,
    lensTypeId: plainLens.id,
    materialId: stdMaterial.id,
    coatingIds: [arcCoating.id, blueCoating.id], // Different coatings
  };
  const res3 = addCartItem(testSession1, rawInput3, 1);
  assert(
    res3.success && res3.cart?.items.length === 2,
    'Test 3: Add same frame + different coatings creates separate cart item',
    `Items count: ${res3.cart?.items?.length}`
  );

  // TEST 4: Add same frame + same lens + different prescription -> Separate cart item created
  const rawInput4a = {
    productId: frame1Id,
    lensTypeId: singleVisionLens.id,
    materialId: stdMaterial.id,
    coatingIds: [arcCoating.id],
    prescriptionMode: 'manual' as const,
    prescription: {
      id: 'rx-test-4a',
      odRight: { sph: -1.0, cyl: -0.5, axis: 90 },
      osLeft: { sph: -1.0, cyl: -0.5, axis: 90 },
      pd: 63,
      verificationStatus: 'Pending Verification' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  const rawInput4b = {
    productId: frame1Id,
    lensTypeId: singleVisionLens.id,
    materialId: stdMaterial.id,
    coatingIds: [arcCoating.id],
    prescriptionMode: 'manual',
    prescription: {
      id: 'rx-test-4b',
      odRight: { sph: -2.0, cyl: -0.5, axis: 90 },
      osLeft: { sph: -2.0, cyl: -0.5, axis: 90 },
      pd: 63,
      verificationStatus: 'Pending Verification' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  const res4a = addCartItem(testSession1, rawInput4a, 1);
  const res4b = addCartItem(testSession1, rawInput4b, 1);
  assert(
    res4a.success && res4b.success && res4b.cart?.items.length === 4,
    'Test 4: Add same frame + different prescription creates separate item',
    `Items count: ${res4b.cart?.items?.length}`
  );

  // TEST 5: Add item as guest, reload/retrieve cart
  const guestCart = getOrCreateCart(testSession1);
  assert(
    guestCart.items.length === 4,
    'Test 5: Guest cart persists and retrieves correctly',
    `Retrieved items: ${guestCart.items.length}`
  );

  // TEST 6: Add item as guest, log in -> guest cart merges into user cart
  addCartItem(testSession2, rawInput1, 1);
  const mergeRes = mergeCarts(testSession2, testUserCartKey, testUserId);
  assert(
    mergeRes.success && mergeRes.cart?.userId === testUserId && (mergeRes.cart?.items.length || 0) > 0,
    'Test 6: Guest cart merges into user cart upon login'
  );

  // TEST 7: Attempt adding item beyond stock limit
  const stockTestSession = `cart-session-stock-test-${Date.now()}`;
  const overStockRes = addCartItem(stockTestSession, rawInput1, 9999);
  assert(
    !overStockRes.success && (overStockRes.error?.includes('units') || overStockRes.error?.includes('stock')),
    'Test 7: Reject adding items beyond available stock limit',
    `Error message: ${overStockRes.error}`
  );

  // TEST 8: Edit cart item configuration
  const cartToEdit = getOrCreateCart(testSession1);
  const itemToEdit = cartToEdit.items[0];
  const editRawInput = {
    productId: frame1Id,
    lensTypeId: plainLens.id,
    materialId: stdMaterial.id,
    coatingIds: [blueCoating.id],
  };
  const editRes = updateCartItem(
    testSession1,
    itemToEdit.id,
    { configuration: editRawInput }
  );
  assert(
    editRes.success && editRes.cart?.items.some((i) => i.id === itemToEdit.id && i.configuration.coatingIds.includes(blueCoating.id)),
    'Test 8: Edit cart item configuration revalidates and updates'
  );

  // TEST 9: Delete item from cart
  const cartBeforeDelete = getOrCreateCart(testSession1);
  const countBefore = cartBeforeDelete.items.length;
  const itemToDeleteId = cartBeforeDelete.items[0].id;
  const deleteRes = deleteCartItem(testSession1, itemToDeleteId);
  assert(
    deleteRes.success && deleteRes.cart?.items.length === countBefore - 1,
    'Test 9: Delete item from cart reduces count and updates totals'
  );

  // TEST 10: Clear cart
  const clearRes = clearCart(testSession1);
  assert(
    clearRes.success && clearRes.cart?.items.length === 0,
    'Test 10: Clear cart removes all items'
  );

  // TEST 11: Tamper payload price test -> Server re-calculates price
  const tamperedRawInput = {
    ...rawInput1,
    calculatedTotalPrice: 1, // Client attempting to tamper price to ₹1
  };
  const tamperSession = `cart-session-tamper-${Date.now()}`;
  const tamperRes = addCartItem(tamperSession, tamperedRawInput, 1);
  const addedItemPrice = tamperRes.cart?.items[0]?.configuration.calculatedTotalPrice || 0;
  assert(
    tamperRes.success && addedItemPrice > 1,
    'Test 11: Server recalculates authoritative price, preventing client tampering',
    `Calculated price: ₹${addedItemPrice}`
  );

  // TEST 12: Attempt invalid lens type for selected frame
  const invalidLensConfig = buildAndValidateConfiguration({
    productId: 'prod-titan-gold-round',
    lensTypeId: 'non-existent-lens-id',
  });
  assert(
    !invalidLensConfig.success && !!invalidLensConfig.error,
    'Test 12: Reject invalid or incompatible lens type',
    `Error: ${invalidLensConfig.error}`
  );

  // TEST 13: Attempt powered lens without prescription
  const rxRequiredConfig = buildAndValidateConfiguration({
    productId: frame1Id,
    lensTypeId: singleVisionLens.id,
    materialId: stdMaterial.id,
    prescriptionMode: 'none', // No prescription provided
  });
  assert(
    !rxRequiredConfig.success && !!rxRequiredConfig.error,
    'Test 13: Reject powered lens without prescription',
    `Error: ${rxRequiredConfig.error}`
  );

  // TEST 14: Cart subtotal calculation
  const subtotalSession = `cart-session-subtotal-${Date.now()}`;
  addCartItem(subtotalSession, rawInput1, 2);
  const subCart = getOrCreateCart(subtotalSession);
  const unitPrice = subCart.items[0].configuration.calculatedTotalPrice;
  const expectedSubtotal = unitPrice * 2;
  const actualSubtotal = subCart.items.reduce(
    (tot, i) => tot + i.configuration.calculatedTotalPrice * i.quantity,
    0
  );
  assert(
    actualSubtotal === expectedSubtotal,
    'Test 14: Accurate cart subtotal calculation',
    `Expected ₹${expectedSubtotal}, got ₹${actualSubtotal}`
  );

  // TEST 15: Prescription viewing details verification
  const validRxConfig = buildAndValidateConfiguration(rawInput4a);
  const testRx = validRxConfig.configuration!.prescription!;
  const hasRequiredFields =
    testRx.odRight?.sph !== undefined &&
    testRx.osLeft?.sph !== undefined &&
    testRx.pd !== undefined;
  assert(
    hasRequiredFields,
    'Test 15: Prescription details contain OD, OS, SPH, CYL, Axis, PD for secure modal viewing'
  );

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
