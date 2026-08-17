import crypto from 'crypto';

export class RazorpayProvider {
  private keyId: string | null = null;
  private keySecret: string | null = null;

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (process.env.NODE_ENV === 'production') {
      if (!keyId || !keySecret) {
        console.warn('[RazorpayProvider] Warning: Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in production environment.');
      }
    }

    if (keyId && keySecret) {
      this.keyId = keyId;
      this.keySecret = keySecret;
    }
  }

  async createOrder(amountInRupees: number, receiptId: string): Promise<any> {
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay payment gateway is not configured.');
    }

    const amountInPaise = Math.round(amountInRupees * 100);
    const authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId,
        payment_capture: 1
      })
    });

    if (!response.ok) {
      const errData: any = await response.json().catch(() => ({}));
      throw new Error(`Razorpay order creation failed: ${errData.error?.description || response.statusText}`);
    }

    return await response.json();
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    const keySecret = this.keySecret || process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || !orderId || !paymentId || !signature) {
      return false;
    }

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(body: string | Buffer, signature: string, secret?: string): boolean {
    const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || !body || !signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      return false;
    }
  }
}
