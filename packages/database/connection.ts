import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { log } from '@avenire/logger/server';

// Connection pool configuration for optimal performance
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'avenire',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  
  // Connection pool settings
  max: 20, // Maximum number of connections in the pool
  min: 2,  // Minimum number of connections in the pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
  
  // Performance optimizations
  prepare: false, // Disable prepared statements for better performance with dynamic queries
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL compatibility
  },
  
  // Connection lifecycle hooks
  onnotice: (notice: any) => {
    if (process.env.NODE_ENV === 'development') {
      log.info('Database notice:', notice);
    }
  },
  
  onparameter: (key: string, value: any) => {
    if (process.env.NODE_ENV === 'development') {
      log.debug(`Database parameter: ${key} = ${value}`);
    }
  },
};

// Create the connection pool
const connection = postgres(process.env.DB_URL || '', connectionConfig);

// Create the database instance
export const database = drizzle(connection);

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await connection`SELECT 1`;
    log.info('Database connection successful');
    return true;
  } catch (error) {
    log.error('Database connection failed:', { error });
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await connection.end();
    log.info('Database connection closed');
  } catch (error) {
    log.error('Error closing database connection:', { error });
  }
}

// Connection pool monitoring
export function getConnectionPoolStats() {
  return {
    totalConnections: connection.options.max,
    // Note: postgres-js doesn't expose real-time pool stats
    // This is a placeholder for monitoring
  };
}

// Query performance monitoring
export function withQueryMonitoring<T extends any[], R>(
  queryFn: (...args: T) => Promise<R>,
  queryName: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await queryFn(...args);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) { // Log slow queries (>1s)
        log.warn(`Slow query detected: ${queryName}`, { duration, args });
      } else if (process.env.NODE_ENV === 'development') {
        log.debug(`Query executed: ${queryName}`, { duration });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      log.error(`Query failed: ${queryName}`, { duration, args, error });
      throw error;
    }
  };
}

// Transaction helper with retry logic
export async function withTransaction<T>(
  operation: (tx: any) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await database.transaction(operation);
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a retryable error
      const isRetryable = error instanceof Error && (
        error.message.includes('deadlock') ||
        error.message.includes('serialization failure') ||
        error.message.includes('connection')
      );
      
      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = 2 ** attempt * 100;
      log.warn(`Transaction failed, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`, { error });
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
