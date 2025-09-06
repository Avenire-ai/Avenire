# @avenire/logger

A clean, type-safe logging package using Winston with separate entry points for different environments.

## Installation

Install the dependencies:

```bash
npm install winston
```

## Package Structure

- `@avenire/logger/server` - Server-side logging (Node.js, API routes, server actions)
- `@avenire/logger/client` - Client-side logging (React components, browser)

## Usage

### Server-side Logging

For server-side code (API routes, server actions, middleware):

```typescript
import { log, createServerLogger, time, captureException } from "@avenire/logger/server";

// Use the default logger
log.info("Server message", { userId: "123" });

// Create a contextual logger
const userLogger = createServerLogger({ userId: "123", component: "auth" });
userLogger.info("User logged in");

// Time a function
const result = await time(log, "database-query", async () => {
  return await db.query("SELECT * FROM users");
});

// Capture exceptions
try {
  // risky operation
} catch (error) {
  captureException(error, log, { context: "user-signup" });
}
```

### Client-side Logging

For client components:

```typescript
import { useClientLogger } from "@avenire/logger/client";

export function MyComponent() {
  const logger = useClientLogger({ component: "MyComponent" });
  
  useEffect(() => {
    logger.info("Component mounted");
  }, []);
}
```

## Features

- **Environment-specific entry points** - No cross-environment contamination
- **Contextual logging** - Create loggers with base context that gets merged with each log
- **Child loggers** - Extend context for specific operations
- **Winston-based** - Uses Winston for structured logging with configurable transports
- **Console fallback** - Client-side logging falls back to console methods
- **Type-safe** - Full TypeScript support with proper type definitions

## Configuration

The logger can be configured using environment variables:

- `LOG_LEVEL` - Set the minimum log level (default: 'info')

## Transports

By default, the server logger uses:
- Console transport with colorized output for development
- JSON format for structured logging

You can extend the logger by adding custom Winston transports as needed.
