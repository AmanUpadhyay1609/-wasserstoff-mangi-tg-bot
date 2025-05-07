import jwt from "jsonwebtoken";
import { logger } from "../../logger";
import type { CustomContext } from "../context/CustomContext";

export const createAuthMiddleware = (jwtSecret: string) => {
  return async (ctx: CustomContext, next: () => Promise<void>) => {
    // logger.info(`INSIDE AUTH+++++____>`)
    if (!ctx.chat || ctx.chat.type !== "private") {
      return next();
    }

    if (!ctx.session) {
      ctx.session = { jwtToken: undefined };
      logger.debug("Session was undefined, initialized in auth middleware");
    }

    const chatId = ctx.chat.id;
    const userId = ctx.from?.id;
    logger.debug(`Processing auth middleware for user ${userId} in chat ${chatId}. Session:`, ctx.session);

    if (!ctx.session.jwtToken) {
      logger.info(`No token found. Creating new JWT token for user ${userId} in chat ${chatId}`);
      const payload = {
        chatId: chatId,
        userId: userId,
        createdAt: new Date().toISOString(),
      };
      const token = jwt.sign(payload, jwtSecret);
      ctx.session.jwtToken = token;
      logger.debug(`JWT token created: ${token.substring(0, 20)}...`);
      logger.info(`JWT token stored for user ${userId}`);
    } else {
      try {
        logger.debug(`Verifying existing token for user ${userId}`);
        const decoded = jwt.verify(ctx.session.jwtToken, jwtSecret) as { chatId: number; userId: number; };
        if (decoded.chatId !== chatId) {
          logger.warn(`JWT token chatId mismatch: ${decoded.chatId} vs ${chatId}`);
          ctx.session.jwtToken = undefined;
        } else {
          logger.debug(`JWT token verified for user ${userId} in chat ${chatId}`);
        }
      } catch (error) {
        logger.warn(`Invalid JWT token for user ${userId}:`, error);
        ctx.session.jwtToken = undefined;
      }
    }
    return next();
  };
}; 