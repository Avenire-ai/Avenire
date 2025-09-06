// import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use optimized connection configuration
const connectionString = process.env.DB_URL;
const pool = postgres(connectionString, { 
  max: 20, // Increased connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Better performance for dynamic queries
  transform: {
    undefined: null,
  },
});

export const database = drizzle({
  client: pool,
  schema,
});

// Re-export connection utilities
export { checkDatabaseConnection, closeDatabaseConnection, withTransaction } from './connection';
