/**
 * OptiCraft Eyewear - Authkey.io WhatsApp API Integration Service
 * Real-time WhatsApp OTP delivery for User Authentication & Password Resets
 */

import { logger } from './logger.js';

export interface SendWhatsAppOtpOptions {
  mobile: string;
  otp: string;
  name?: string;
  purpose?: 'signup' | 'reset';
  customWid?: string;
}

export interface AuthkeyResponse {
  success: boolean;
  messageId?: string;
  status?: string;
  log?: string;
  error?: string;
}

/**
 * Send real WhatsApp OTP message via Authkey.io API
 */
export async function sendAuthkeyWhatsAppOtp(options: SendWhatsAppOtpOptions): Promise<AuthkeyResponse> {
  const { mobile, otp, name, purpose = 'signup', customWid } = options;

  // Clean 10-digit Indian mobile number
  const cleanMobile = mobile.replace(/\D/g, '').replace(/^91/, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    logger.error(`[AUTHKEY WHATSAPP] Invalid Indian mobile number provided: ${mobile}`);
    return { success: false, error: 'Invalid 10-digit Indian mobile number.' };
  }

  const authkey = process.env.AUTHKEY_API_KEY;
  const wid = customWid || process.env.AUTHKEY_WHATSAPP_WID;
  const variableName = process.env.AUTHKEY_VARIABLE_NAME || 'otp';

  if (!authkey || !wid) {
    logger.warn(
      `[AUTHKEY WHATSAPP] Missing AUTHKEY_API_KEY or AUTHKEY_WHATSAPP_WID in environment variables. ` +
      `Simulating WhatsApp dispatch to +91 ${cleanMobile} with OTP: ${otp}`
    );
    return {
      success: true,
      messageId: `sim-authkey-${Date.now()}`,
      status: 'simulated',
      log: 'Authkey credentials not configured yet. Server logged OTP code.',
    };
  }

  try {
    // Construct Authkey.io API URL with dynamic variable mappings
    // Authkey templates can map dynamic variables like {#otp#}, {#1#}, {#var1#}, etc.
    const url = new URL('https://api.authkey.io/request');
    url.searchParams.set('authkey', authkey);
    url.searchParams.set('mobile', cleanMobile);
    url.searchParams.set('country_code', '91');
    url.searchParams.set('wid', wid);

    // The 6-digit number generated in backend
    url.searchParams.set('otp', otp);
    url.searchParams.set('code', otp);
    url.searchParams.set('var', otp);
    url.searchParams.set('var1', otp);
    url.searchParams.set('1', otp);
    url.searchParams.set('variable', otp);
    url.searchParams.set('value', otp);
    url.searchParams.set('param1', otp);

    // If a custom variable name is specified in env, attach it as well
    if (variableName) {
      url.searchParams.set(variableName, otp);
    }
    if (name) {
      url.searchParams.set('name', name);
    }

    logger.info(`[AUTHKEY WHATSAPP] Sending WhatsApp OTP to +91 ${cleanMobile} via Authkey (WID: ${wid})`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const resText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(resText);
    } catch {
      data = { rawResponse: resText };
    }

    if (!response.ok || (data.status && data.status.toLowerCase() === 'error') || data.code === 400) {
      logger.error(`[AUTHKEY WHATSAPP] API Error from Authkey.io:`, { status: response.status, data });
      return {
        success: false,
        error: data.message || data.error || 'Failed to send WhatsApp message through Authkey.io',
      };
    }

    logger.info(`[AUTHKEY WHATSAPP] WhatsApp OTP successfully dispatched to +91 ${cleanMobile}`, {
      messageId: data.message_id || data.log || data.id,
    });

    return {
      success: true,
      messageId: data.message_id || data.id || `authkey-${Date.now()}`,
      status: 'submitted',
      log: data.message || 'WhatsApp message submitted successfully.',
    };
  } catch (error: any) {
    logger.error(`[AUTHKEY WHATSAPP] Network exception connecting to Authkey.io:`, error);
    return {
      success: false,
      error: error.message || 'Network exception while connecting to Authkey.io WhatsApp API.',
    };
  }
}
