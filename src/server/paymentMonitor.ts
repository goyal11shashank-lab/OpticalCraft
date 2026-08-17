/**
 * OptiCraft Eyewear - Payment Integrity & Anomaly Monitoring Service
 */

import { logger } from './logger.js';

export interface PaymentEventRecord {
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  status: 'Created' | 'Authorized' | 'Captured' | 'Failed' | 'Mismatched' | 'Rejected';
  timestamp: string;
  details?: string;
}

class PaymentMonitor {
  private events: PaymentEventRecord[] = [];

  logPaymentEvent(event: Omit<PaymentEventRecord, 'timestamp'>) {
    const record: PaymentEventRecord = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    this.events.push(record);

    if (event.status === 'Mismatched' || event.status === 'Rejected') {
      logger.error(`[PAYMENT ANOMALY DETECTED] Order: ${event.orderId} | Status: ${event.status}`, { event });
    } else {
      logger.info(`[PAYMENT EVENT] Order: ${event.orderId} | Status: ${event.status}`, { event });
    }
  }

  getPaymentHistory(orderId: string): PaymentEventRecord[] {
    return this.events.filter((e) => e.orderId === orderId);
  }
}

export const paymentMonitor = new PaymentMonitor();
