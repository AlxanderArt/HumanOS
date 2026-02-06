type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  tenant_id?: string;
  request_id?: string;
  actor_id?: string;
  service?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  data?: unknown;
  error?: { message: string; stack?: string };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createLogger(
  defaultContext: LogContext = {},
  minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info"
) {
  function emit(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error
  ) {
    if (LOG_LEVELS[level] < LOG_LEVELS[minLevel]) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: Object.keys(defaultContext).length > 0 ? defaultContext : undefined,
      data: data ?? undefined,
      error: error ? { message: error.message, stack: error.stack } : undefined,
    };

    const output = JSON.stringify(entry);

    if (level === "error") {
      console.error(output);
    } else if (level === "warn") {
      console.warn(output);
    } else {
      console.log(output);
    }
  }

  return {
    debug: (message: string, data?: unknown) => emit("debug", message, data),
    info: (message: string, data?: unknown) => emit("info", message, data),
    warn: (message: string, data?: unknown) => emit("warn", message, data),
    error: (message: string, error?: Error, data?: unknown) =>
      emit("error", message, data, error),
    child: (context: LogContext) =>
      createLogger({ ...defaultContext, ...context }, minLevel),
  };
}

export type Logger = ReturnType<typeof createLogger>;
