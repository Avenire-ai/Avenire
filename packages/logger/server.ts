import winston from 'winston';
import { AppLogger, LogMetadata } from './types.js';

// Create winston logger instance
const createWinstonLogger = (baseContext?: LogMetadata) => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: baseContext,
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });

  return logger;
};

// Create server logger with context
export function createServerLogger(baseContext?: LogMetadata): AppLogger {
  const logger = createWinstonLogger(baseContext);

  return {
    debug: (message: string, meta?: LogMetadata) => {
      logger.debug(message, meta);
    },
    info: (message: string, meta?: LogMetadata) => {
      logger.info(message, meta);
    },
    warn: (message: string, meta?: LogMetadata) => {
      logger.warn(message, meta);
    },
    error: (message: string, meta?: LogMetadata) => {
      logger.error(message, meta);
    },
    child: (context: LogMetadata) => {
      return createServerLogger({ ...baseContext, ...context });
    }
  };
}

// Default server logger
let _log: AppLogger | null = null;

export const log: AppLogger = new Proxy({} as AppLogger, {
  get(target, prop) {
    if (!_log) {
      _log = createServerLogger();
    }
    return (_log as any)[prop];
  }
});

// Utility function to time operations
export async function time<T>(
  logger: AppLogger,
  operation: string,
  fn: () => Promise<T>,
  meta?: LogMetadata
): Promise<T> {
  const start = Date.now();
  logger.info(`Starting ${operation}`, meta);
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.info(`Completed ${operation}`, { ...meta, duration: `${duration}ms` });
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Failed ${operation}`, { ...meta, duration: `${duration}ms`, error });
    throw error;
  }
}

// Utility function to capture exceptions
export function captureException(
  error: unknown,
  logger: AppLogger,
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
