/**
 * OptiCraft Eyewear - Notification Service & Provider Abstractions
 */

import { logger } from './logger.js';

export interface EmailMessage {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}

export interface SMSMessage {
  toPhone: string;
  messageText: string;
}

export interface EmailProvider {
  sendEmail(msg: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

export interface SMSProvider {
  sendSMS(msg: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

/**
 * Fallback Console / Logger Email Provider
 */
export class ConsoleEmailProvider implements EmailProvider {
  async sendEmail(msg: EmailMessage): Promise<{ success: boolean; messageId: string }> {
    logger.info(`[EMAIL PROVIDER] To: ${msg.to} | Subject: ${msg.subject}`);
    return { success: true, messageId: `email-${Date.now()}` };
  }
}

/**
 * Fallback Console / Logger SMS Provider
 */
export class ConsoleSMSProvider implements SMSProvider {
  async sendSMS(msg: SMSMessage): Promise<{ success: boolean; messageId: string }> {
    logger.info(`[SMS PROVIDER] To: ${msg.toPhone} | Text: ${msg.messageText}`);
    return { success: true, messageId: `sms-${Date.now()}` };
  }
}

export type NotificationEvent =
  | 'OrderConfirmed'
  | 'PaymentSuccessful'
  | 'PaymentFailed'
  | 'PrescriptionClarificationRequired'
  | 'PrescriptionVerified'
  | 'OrderProcessing'
  | 'ReadyToDispatch'
  | 'Shipped'
  | 'OutForDelivery'
  | 'Delivered'
  | 'AdminNewPaidOrder'
  | 'AdminPrescriptionReviewNeeded'
  | 'AdminLowStockAlert';

export interface NotificationPayload {
  recipientEmail?: string;
  recipientPhone?: string;
  orderNumber?: string;
  customerName?: string;
  productName?: string;
  trackingNumber?: string;
  courierName?: string;
  totalAmountINR?: number;
  additionalDetails?: string;
}

export class NotificationService {
  private emailProvider: EmailProvider;
  private smsProvider: SMSProvider;

  constructor(emailProvider?: EmailProvider, smsProvider?: SMSProvider) {
    this.emailProvider = emailProvider || new ConsoleEmailProvider();
    this.smsProvider = smsProvider || new ConsoleSMSProvider();
  }

  async triggerEvent(event: NotificationEvent, payload: NotificationPayload): Promise<boolean> {
    logger.info(`[NOTIFICATION TRIGGERED] Event: ${event}`, { payload });

    try {
      switch (event) {
        case 'OrderConfirmed':
        case 'PaymentSuccessful':
          if (payload.recipientEmail && payload.orderNumber) {
            await this.emailProvider.sendEmail({
              to: payload.recipientEmail,
              subject: `Order Confirmed - OptiCraft Eyewear #${payload.orderNumber}`,
              bodyText: `Dear ${payload.customerName || 'Valued Customer'},\n\nThank you for choosing OptiCraft Eyewear! Your order #${payload.orderNumber} for ₹${payload.totalAmountINR?.toLocaleString('en-IN') || 0} has been confirmed and paid successfully.\n\nWe are preparing your custom precision eyewear.`,
            });
          }
          if (payload.recipientPhone && payload.orderNumber) {
            await this.smsProvider.sendSMS({
              toPhone: payload.recipientPhone,
              messageText: `OptiCraft: Order #${payload.orderNumber} confirmed! We are crafting your eyewear. Track status on opticraft.in`,
            });
          }
          break;

        case 'PrescriptionClarificationRequired':
          if (payload.recipientEmail && payload.orderNumber) {
            await this.emailProvider.sendEmail({
              to: payload.recipientEmail,
              subject: `Prescription Clarification Required for Order #${payload.orderNumber}`,
              bodyText: `Dear ${payload.customerName},\n\nOur optician team reviewed your prescription for Order #${payload.orderNumber}. Note: ${payload.additionalDetails || 'Please re-verify your power parameters.'}`,
            });
          }
          break;

        case 'Shipped':
          if (payload.recipientEmail && payload.orderNumber) {
            await this.emailProvider.sendEmail({
              to: payload.recipientEmail,
              subject: `Your OptiCraft Eyewear Order #${payload.orderNumber} Has Shipped!`,
              bodyText: `Great news! Your order #${payload.orderNumber} is on its way via ${payload.courierName || 'our courier partner'}. AWB Number: ${payload.trackingNumber}`,
            });
          }
          break;

        case 'AdminLowStockAlert':
          logger.warn(`[ADMIN NOTIFICATION] Low stock alert for product ${payload.productName}`);
          break;

        default:
          logger.info(`[NOTIFICATION] Generic dispatch for ${event}`);
          break;
      }

      return true;
    } catch (err) {
      logger.error(`[NOTIFICATION ERROR] Failed to send notification for ${event}`, { error: err });
      return false;
    }
  }
}

export const notificationService = new NotificationService();
