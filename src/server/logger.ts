/**
 * OptiCraft Eyewear - Structured Application Logging Engine
 * Sanitizes sensitive inputs (passwords, JWT secrets, card numbers, CVVs, full prescription power parameters)
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface LogContext {
  [key: string]: any;
}

const SENSITIVE_KEYS = [
  'password',
  'passwordHash',
  'confirmPassword',
  'token',
  'jwtSecret',
  'razorpayKeySecret',
  'razorpay_signature',
  'webhookSecret',
  'cvv',
  'cardNumber',
  'upiPin',
  'odRight',
  'osLeft',
  'sph',
  'cyl',
  'axis',
];

/**
 * Recursively sanitize log metadata context
 */
function sanitizeContext(context: any): any {
  if (!context || typeof context !== 'object') return context;

  if (Array.isArray(context)) {
    return context.map(sanitizeContext);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(context)) {
    const isSensitive = SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()));
    if (isSensitive) {
      sanitized[key] = '[REDACTED_SENSITIVE_DATA]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const cleanContext = context ? sanitizeContext(context) : undefined;
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...(cleanContext ? { context: cleanContext } : {}),
    });
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('INFO', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('WARN', message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.formatLog('ERROR', message, context));
  }
}

export const logger = new Logger();
