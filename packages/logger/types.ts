export interface LogMetadata {
  [key: string]: unknown;
}

export interface AppLogger {
  debug: (message: string, meta?: LogMetadata) => void;
  info: (message: string, meta?: LogMetadata) => void;
  warn: (message: string, meta?: LogMetadata) => void;
  error: (message: string, meta?: LogMetadata) => void;
  child: (context: LogMetadata) => AppLogger;
}
