/**
 * OptiCraft Eyewear - Error Monitoring & Crash Analytics Abstraction
 */

import { logger } from './logger.js';

export interface ErrorReport {
  errorName: string;
  errorMessage: string;
  stack?: string;
  endpoint?: string;
  userId?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  context?: Record<string, any>;
}

class ErrorMonitor {
  private reportedErrors: ErrorReport[] = [];

  captureException(err: Error | unknown, context?: Record<string, any>, severity: ErrorReport['severity'] = 'HIGH') {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    const report: ErrorReport = {
      errorName: errorObj.name,
      errorMessage: errorObj.message,
      stack: errorObj.stack,
      severity,
      context,
    };

    this.reportedErrors.push(report);
    logger.error(`[ERROR MONITOR] Captured ${severity} exception: ${report.errorMessage}`, {
      name: report.errorName,
      endpoint: context?.endpoint,
    });
  }

  getRecentErrors(): ErrorReport[] {
    return [...this.reportedErrors];
  }
}

export const errorMonitor = new ErrorMonitor();
