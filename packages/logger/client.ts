import { useEffect, useMemo } from 'react';
import { AppLogger, LogMetadata } from './types.js';

// Create a client-side logger that uses console
function createClientLoggerFrom(
  baseContext?: LogMetadata
): AppLogger {
  const withContext = (meta?: LogMetadata) => ({ ...(baseContext ?? {}), ...(meta ?? {}) });

  return {
    debug: (message: string, meta?: LogMetadata) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[DEBUG] ${message}`, withContext(meta));
      }
    },
    info: (message: string, meta?: LogMetadata) => {
      console.info(`[INFO] ${message}`, withContext(meta));
    },
    warn: (message: string, meta?: LogMetadata) => {
      console.warn(`[WARN] ${message}`, withContext(meta));
    },
    error: (message: string, meta?: LogMetadata) => {
      console.error(`[ERROR] ${message}`, withContext(meta));
    },
    child: (context: LogMetadata) => {
      return createClientLoggerFrom({ ...(baseContext ?? {}), ...context });
    }
  };
}

// React hook for client-side logging
export function useClientLogger(baseContext?: LogMetadata): AppLogger {
  return useMemo(() => {
    return createClientLoggerFrom(baseContext);
  }, [JSON.stringify(baseContext)]);
}

// Default client logger
let _log: AppLogger | null = null;

export const log: AppLogger = new Proxy({} as AppLogger, {
  get(target, prop) {
    if (!_log) {
      _log = createClientLoggerFrom();
    }
    return (_log as any)[prop];
  }
});

// Utility function to capture exceptions
export function captureException(
  error: unknown,
  logger: AppLogger = log,
  meta?: LogMetadata
): void {
  if (error instanceof Error) {
    logger.error('Exception captured', {
      ...meta,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    });
  } else {
    logger.error('Exception captured', { ...meta, error: String(error) });
  }
}
