import { performance } from "node:perf_hooks";
import { Middleware } from "grammy";
import { CustomContext } from "../context/CustomContext";

export function updateLogger(): Middleware<CustomContext> {
  return async (ctx, next) => {
    ctx.api.config.use((previous, method, payload, signal) => {
      // ctx.logger.debug({
      //   msg: "bot api call",
      //   method,
      //   payload,
      // });

      return previous(method, payload, signal);
    });

    // ctx.logger.debug({
    //   msg: "update received",
    //   update: getUpdateInfo(ctx)
    // });

    const startTime = performance.now();
    try {
      await next();
    } finally {
      const endTime = performance.now();
      ctx.logger.debug({
        msg: "update processed",
        duration: endTime - startTime,
      });
    }
  };
}