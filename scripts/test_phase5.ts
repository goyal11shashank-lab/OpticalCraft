/**
 * OptiCraft Eyewear - Phase 5 Comprehensive Acceptance Test Suite
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000/api';

function request(
  method: string,
  path: string,
  body?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode || 500, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode || 500, data: rawData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Starting OptiCraft Eyewear - Phase 5 Acceptance Tests');
  console.log('========================================================\n');

  let testCount = 0;
  let passCount = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    testCount++;
    if (condition) {
      passCount++;
      console.log(`✅ TEST ${testCount}: ${testName}`);
    } else {
      console.error(`❌ TEST ${testCount} FAILED: ${testName}`);
      if (detail) console.error('   Details:', detail);
    }
  }

  try {
    // 1. Health & Seed Check
    const health = await request('GET', '/health');
    assert(health.status === 200 && health.data.status === 'ok', 'Server Health Check');

    // 2. Sign Up - Validation Failure
    const invalidSignup = await request('POST', '/auth/signup', {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      mobile: '12345',
      password: '123',
    });
    assert(
      invalidSignup.status === 400 && invalidSignup.data.fieldErrors,
      'Sign Up Input Validation (Invalid Fields)',
      invalidSignup.data
    );

    // 3. Sign Up - Successful Registration
    const timestamp = Date.now();
    const testEmail = `test.user.${timestamp}@opticraft.in`;
    const testMobile = `9${timestamp.toString().slice(-9)}`;
    const signupRes = await request('POST', '/auth/signup', {
      firstName: 'Ananya',
      lastName: 'Deshmukh',
      email: testEmail,
      mobile: testMobile,
      password: 'Password123!',
      confirmPassword: 'Password123!',
    });
    assert(
      signupRes.status === 201 && signupRes.data.success && signupRes.data.token,
      'Customer Registration (Sign Up)',
      signupRes.data
    );

    const authToken = signupRes.data.token;
    const authHeaders = { Authorization: `Bearer ${authToken}` };

    // 4. Auth Me (Current User Profile)
    const meRes = await request('GET', '/auth/me', undefined, authHeaders);
    assert(
      meRes.status === 200 && meRes.data.user && meRes.data.user.email === testEmail,
      'Get Current User Profile (/auth/me)',
      meRes.data
    );

    // 5. Login - Standard User
    const loginRes = await request('POST', '/auth/login', {
      identifier: testEmail,
      password: 'Password123!',
    });
    assert(
      loginRes.status === 200 && loginRes.data.success && loginRes.data.token,
      'Customer Login (Email + Password)',
      loginRes.data
    );

    // 6. Forgot Password - Token Generation
    const forgotRes = await request('POST', '/auth/forgot-password', {
      identifier: testEmail,
      email: testEmail,
    });
    assert(
      forgotRes.status === 200 && forgotRes.data.debugResetToken,
      'Request Password Reset (Token Generation)',
      forgotRes.data
    );

    const resetToken = forgotRes.data.debugResetToken;

    // 7. Reset Password
    const resetRes = await request('POST', '/auth/reset-password', {
      token: resetToken,
      newPassword: 'NewPassword456!',
      confirmPassword: 'NewPassword456!',
    });
    assert(
      resetRes.status === 200 && resetRes.data.success,
      'Reset Password via Token',
      resetRes.data
    );

    // 8. Relogin with New Password
    const reloginRes = await request('POST', '/auth/login', {
      identifier: testEmail,
      password: 'NewPassword456!',
    });
    assert(
      reloginRes.status === 200 && reloginRes.data.success,
      'Relogin with Updated Password',
      reloginRes.data
    );

    // 9. Delivery Address Validation (Invalid PIN Code)
    const invalidAddr = await request(
      'POST',
      '/addresses',
      {
        name: 'Ananya Deshmukh',
        phone: '9876501234',
        houseFlat: 'House 12',
        streetLocality: 'MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '00123', // Invalid Indian PIN code
      },
      authHeaders
    );
    assert(
      invalidAddr.status === 400 && invalidAddr.data.error.includes('PIN code'),
      'Address Validation (Invalid 6-Digit Indian PIN Code)',
      invalidAddr.data
    );

    // 10. Add Valid Saved Address
    const addAddrRes = await request(
      'POST',
      '/addresses',
      {
        name: 'Ananya Deshmukh',
        phone: '9876501234',
        houseFlat: 'Plot 45, Sterling Heights',
        streetLocality: 'Bandra West',
        landmark: 'Near Bandra Station',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400050',
        isDefault: true,
      },
      authHeaders
    );
    assert(
      addAddrRes.status === 201 && addAddrRes.data.address.id,
      'Add Saved Delivery Address',
      addAddrRes.data
    );

    const savedAddress = addAddrRes.data.address;

    // 11. Add Saved Prescription
    const addRxRes = await request(
      'POST',
      '/prescriptions',
      {
        title: 'Ananya Work Glasses',
        odRight: { sph: -2.0, cyl: -0.5, axis: 180 },
        osLeft: { sph: -1.75, cyl: -0.25, axis: 175 },
        pd: 62,
      },
      authHeaders
    );
    assert(
      addRxRes.status === 201 && addRxRes.data.prescription.id,
      'Add Saved Prescription Record',
      addRxRes.data
    );

    const savedRx = addRxRes.data.prescription;

    // 12. Add Powered Product to Cart
    const cartAddRes = await request(
      'POST',
      '/cart/items',
      {
        configuration: {
          productId: 'prod-fern-classic-black',
          productName: 'Fern Classic Square',
          productImage: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67',
          lensTypeId: 'lt-single-vision',
          lensTypeName: 'Single Vision (Distance/Reading)',
          materialId: 'mat-polycarbonate',
          coatingIds: ['coat-bluecut'],
          requiresPrescription: true,
          prescription: savedRx,
          calculatedTotalPrice: 2248,
        },
        quantity: 1,
      },
      authHeaders
    );
    assert(
      cartAddRes.status === 200 && cartAddRes.data.cart.items.length > 0,
      'Add Powered Eyewear to Cart with Prescription',
      cartAddRes.data
    );

    // 13. Create Checkout Session with FREE DELIVERY (₹0)
    const sessionRes = await request(
      'POST',
      '/checkout/session',
      {
        customerInfo: {
          name: 'Ananya Deshmukh',
          email: testEmail,
          phone: '+91 9876501234',
        },
        deliveryAddress: savedAddress,
        prescriptionConsent: true,
        termsConsent: true,
      },
      authHeaders
    );
    assert(
      sessionRes.status === 200 &&
        sessionRes.data.session.id &&
        sessionRes.data.session.deliveryFee === 0 &&
        sessionRes.data.session.isReadyForPayment === true,
      'Create Checkout Session (Guaranteed FREE DELIVERY ₹0)',
      sessionRes.data
    );

    const checkoutSessionId = sessionRes.data.session.id;

    // 14. Execute Order from Checkout Session (Payment Service Abstraction)
    const executeOrderRes = await request(
      'POST',
      '/checkout/execute',
      {
        checkoutSessionId,
        paymentMethod: 'UPI',
      },
      authHeaders
    );
    assert(
      executeOrderRes.status === 201 &&
        executeOrderRes.data.order &&
        executeOrderRes.data.order.deliveryFee === 0 &&
        executeOrderRes.data.order.status === 'Confirmed',
      'Execute Order via Payment Abstraction Layer',
      executeOrderRes.data
    );

    const createdOrder = executeOrderRes.data.order;

    // 15. Verify Customer Orders List
    const ordersRes = await request('GET', '/orders', undefined, authHeaders);
    assert(
      ordersRes.status === 200 &&
        ordersRes.data.orders.some((o: any) => o.id === createdOrder.id),
      'Verify Order Persistence in Customer Account',
      ordersRes.data
    );

    console.log('\n========================================================');
    console.log(`🎉 PHASE 5 ACCEPTANCE TESTS COMPLETED: ${passCount}/${testCount} PASSED`);
    console.log('========================================================');
  } catch (err: any) {
    console.error('💥 Test suite crashed with error:', err);
  }
}

runTests();
