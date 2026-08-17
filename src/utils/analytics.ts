/**
 * OptiCraft Eyewear - Privacy-Safe Analytics Architecture
 * Tracks non-sensitive e-commerce conversion events (Funnel & Behavioral Analytics)
 */

export type AnalyticsEventType =
  | 'view_product'
  | 'search_product'
  | 'apply_filter'
  | 'configure_lens'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'begin_checkout'
  | 'add_address'
  | 'begin_payment'
  | 'payment_success'
  | 'payment_failed'
  | 'purchase';

export interface AnalyticsEventPayload {
  productId?: string;
  productName?: string;
  category?: string;
  priceINR?: number;
  quantity?: number;
  searchQuery?: string;
  filterName?: string;
  filterValue?: string;
  lensType?: string;
  lensMaterial?: string;
  coatingCount?: number;
  cartTotalINR?: number;
  orderId?: string;
  paymentMethod?: string;
  [key: string]: any;
}

const PROHIBITED_KEYS = [
  'password',
  'token',
  'odRight',
  'osLeft',
  'sph',
  'cyl',
  'axis',
  'pd',
  'cvv',
  'cardNumber',
];

function sanitizePayload(payload?: AnalyticsEventPayload): Record<string, any> {
  if (!payload) return {};
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    const isProhibited = PROHIBITED_KEYS.some((p) => key.toLowerCase().includes(p.toLowerCase()));
    if (!isProhibited) {
      clean[key] = value;
    }
  }
  return clean;
}

class AnalyticsService {
  private eventsLog: { event: AnalyticsEventType; payload: Record<string, any>; timestamp: string }[] = [];

  track(event: AnalyticsEventType, payload?: AnalyticsEventPayload) {
    const sanitized = sanitizePayload(payload);
    const entry = {
      event,
      payload: sanitized,
      timestamp: new Date().toISOString(),
    };
    this.eventsLog.push(entry);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ANALYTICS EVENT] ${event}`, sanitized);
    }
  }

  getRecentEvents() {
    return [...this.eventsLog];
  }
}

export const analytics = new AnalyticsService();
