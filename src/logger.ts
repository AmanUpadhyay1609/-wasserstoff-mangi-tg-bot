import { pino } from "pino";
// import { config } from "./config";

export const logger = pino({
  level: 'debug',
  transport: {
    targets: [
      ...(true
        ? [
          {
            target: "pino-pretty",
            level: "debug",
            options: {
              ignore: "pid,hostname",
              colorize: true,
              translateTime: true,
            },
          },
        ]
        : [
          {
            target: "pino-pretty",
            level: "debug",
            options: {
              ignore: "pid,hostname",
              colorize: true,
              translateTime: true,
            },
          },
          {
            target: "pino/file",
            level: "debug",
            options: { destination: "./logs/app.log", mkdir: true },
          },
        ]),
    ],
  },
});

export type Logger = typeof logger;
