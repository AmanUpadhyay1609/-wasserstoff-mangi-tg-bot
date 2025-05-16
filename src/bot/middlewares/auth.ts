import jwt from "jsonwebtoken";
import { logger } from "../../logger";
import type { CustomContext } from "../context/CustomContext";

export const createAuthMiddleware = (jwtSecret: string) => {
  return async (ctx: any, next: () => Promise<void>) => {
    // logger.info(`INSIDE AUTH+++++____>`)
    if (!ctx.chat || ctx.chat.type !== "private") {
      return next();
    }

    // Ensure session is properly extended with default properties
    if (!ctx.session) {
      ctx.session = { jwtToken: undefined } as any;
    }

    // Set default properties on the session using type assertions to avoid type errors
    (ctx.session as any).custom = (ctx.session as any).custom || {};
    (ctx.session as any).updateCustom = function(updates: any) {
      this.custom = { ...this.custom, ...updates };
    };

    // Unconditionally override the save method with our auto-save implementation
    (ctx.session as any).save = function(callback: (err?: any) => void) {
      // Get the storage adapter and session key
      const storage = (ctx as any).__storageAdapter;
      const sessionKey = (ctx as any).__sessionKey;
      
      if (storage && typeof storage.write === 'function' && sessionKey) {
        // Use the storage adapter to save the session data
        storage.write(sessionKey, ctx.session)
          .then(() => {
            console.log('Session successfully saved to Redis via adapter');
            callback();
          })
          .catch((err: any) => {
            console.error('Error saving session via adapter:', err);
            callback(err);
          });
      } else {
        // Alternative: Try to access Redis directly if available
        const redis = (ctx as any).redis;
        const key = sessionKey || ctx.session?.sessionKey || `session:${ctx.chat?.id}`;
        
        if (redis && typeof redis.set === 'function' && key) {
          redis.set(key, JSON.stringify(ctx.session), (err: any) => {
            if (err) {
              console.error('Error saving session to Redis:', err);
            } else {
              console.log('Session successfully saved to Redis directly');
            }
            callback(err);
          });
        } else {
          // No Redis or storage adapter available, just log
          console.log('Session auto-save triggered (no Redis available):', ctx.session);
          callback();
        }
      }
    };

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
      (ctx.session as any).save((err: any) => {
        if (err) {
          logger.error('Error saving session:', err);
        } else {
          logger.info('JWT token saved in session.');
        }
      });
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
        logger.error('Error verifying JWT token:', error);
        ctx.session.jwtToken = undefined;
      }
    }

    return next();
  };
};