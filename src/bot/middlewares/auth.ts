import jwt from "jsonwebtoken";
import type { CustomContext } from "../context/CustomContext";

export const createAuthMiddleware = (jwtSecret: string) => {
  return async (ctx: CustomContext, next: () => Promise<void>) => {
    if (!ctx.chat || ctx.chat.type !== "private") {
      return next();
    }

    // Ensure session is properly extended with default properties
    if (!ctx.session) {
      ctx.session = { jwtToken: undefined } as any;
    }

    // Set default properties on the session
    ctx.session.custom = ctx.session.custom || {};

    // Unconditionally override the save method with our auto-save implementation
    (ctx.session as any).save = function(callback: (err?: any) => void) {
      const storage = (ctx as any).__storageAdapter;
      const sessionKey = (ctx as any).__sessionKey;
      
      if (storage && typeof storage.write === 'function' && sessionKey) {
        storage.write(sessionKey, ctx.session)
          .then(() => {
            if (ctx.config?.isDev) {
              console.log('Session successfully saved to Redis via adapter');
            }
            callback();
          })
          .catch((err: any) => {
            if (ctx.config?.isDev) {
              console.error('Error saving session via adapter:', err);
            }
            callback(err);
          });
      } else {
        const redis = (ctx as any).redis;
        const key = sessionKey || `session:${ctx.chat?.id}`;
        
        if (redis && typeof redis.set === 'function' && key) {
          redis.set(key, JSON.stringify(ctx.session), (err: any) => {
            if (err && ctx.config?.isDev) {
              console.error('Error saving session to Redis:', err);
            } else if (ctx.config?.isDev) {
              console.log('Session successfully saved to Redis directly');
            }
            callback(err);
          });
        } else {
          if (ctx.config?.isDev) {
            console.log('Session auto-save triggered (no Redis available):', ctx.session);
          }
          callback();
        }
      }
    };

    const chatId = ctx.chat.id;
    const userId = ctx.from?.id;
    
    if (ctx.config?.isDev) {
      ctx.logger.debug(`Processing auth middleware for user ${userId} in chat ${chatId}. Session:`, ctx.session);
    }

    if (!ctx.session.jwtToken) {
      if (ctx.config?.isDev) {
        ctx.logger.info(`No token found. Creating new JWT token for user ${userId} in chat ${chatId}`);
      }
      const payload = {
        chatId: chatId,
        userId: userId,
        createdAt: new Date().toISOString(),
      };
      const token = jwt.sign(payload, jwtSecret);
      ctx.session.jwtToken = token;
      
      if (ctx.config?.isDev) {
        ctx.logger.debug(`JWT token created: ${token.substring(0, 20)}...`);
        ctx.logger.info(`JWT token stored for user ${userId}`);
      }
      
      (ctx.session as any).save((err: any) => {
        if (err && ctx.config?.isDev) {
          ctx.logger.error('Error saving session:', err);
        } else if (ctx.config?.isDev) {
          ctx.logger.info('JWT token saved in session.');
        }
      });
    } else {
      try {
        if (ctx.config?.isDev) {
          ctx.logger.debug(`Verifying existing token for user ${userId}`);
        }
        const decoded = jwt.verify(ctx.session.jwtToken, jwtSecret) as { chatId: number; userId: number; };
        if (decoded.chatId !== chatId) {
          if (ctx.config?.isDev) {
            ctx.logger.warn(`JWT token chatId mismatch: ${decoded.chatId} vs ${chatId}`);
          }
          ctx.session.jwtToken = undefined;
        } else if (ctx.config?.isDev) {
          ctx.logger.debug(`JWT token verified for user ${userId} in chat ${chatId}`);
        }
      } catch (error) {
        if (ctx.config?.isDev) {
          ctx.logger.error('Error verifying JWT token:', error);
        }
        ctx.session.jwtToken = undefined;
      }
    }

    return next();
  };
};