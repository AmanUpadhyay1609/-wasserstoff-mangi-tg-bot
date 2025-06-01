import { pino } from "pino";

// Exported logger for SDK users (always real)
export const logger = pino({
  level: 'debug',
  transport: {
    targets: [
          {
            target: "pino-pretty",
            level: "debug",
            options: {
              ignore: "pid,hostname",
              colorize: true,
              translateTime: true,
            },
          },
    ],
  },
});

// No-op logger for silencing SDK logs in production
function createNoopLogger() {
  const noop = () => {};
  const levels = ["fatal", "error", "warn", "info", "debug", "trace"]; // pino levels
  const logger: any = {};
  for (const level of levels) {
    logger[level] = noop;
  }
  logger.child = () => logger;
  logger.level = "silent";
  return logger;
}

// Factory for SDK-internal logger
export function createSdkLogger(isDev: boolean) {
  return isDev ? logger : createNoopLogger();
}

export type Logger = typeof logger;
