import { Bot, session } from "grammy";
import { RedisAdapter } from "@grammyjs/storage-redis";
import { sequentialize } from "grammy-middlewares";
import { createContextConstructor } from "./context/CustomContext";
import { logger } from "../logger";
import { welcomeFeature } from "./features/welcome";
import { initial } from "./middlewares/session";
import sessionMiddleware from "./middlewares/session";
import { unhandledFeature } from "./features/unhandled";
import { updateLogger } from "./middlewares/updateLogger";
import { createCommanMenu } from "./helper/createMenu";
import { errorHandler } from "./helper/errorHandler";
import { AppConfig } from "..";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { createAuthMiddleware } from "./middlewares/auth";

export const createBot = (
  BOT_TOKEN: string,
  redisInstance: any,
  config: AppConfig,
) => {
  const bot = new Bot(BOT_TOKEN, {
    ContextConstructor: createContextConstructor({ logger }),
    client: {
      canUseWebhookReply: (method) => method === "sendMessage",
    },
  });
  createCommanMenu(bot);

  // Create Redis storage adapter
  const storage = new RedisAdapter({
    instance: redisInstance,
  });

  // Handle errors in Bot
  const protectedBot = bot.errorBoundary(errorHandler);

  if (config.isDev) {
    protectedBot.use(updateLogger());
  }

  // Configure session middleware with proper typing
  protectedBot.use(
    session({
      initial: () => ({ jwtToken: undefined }),
      storage,
      getSessionKey(ctx) {
        // Ensure we have a valid chat ID
        if (!ctx.chat?.id) {
          logger.warn("No chat ID available for session key");
          return undefined;
        }
        const sessionKey = `bot:${ctx.me.username}:session:${ctx.chat.id}`;
        logger.debug(`Generated session key: ${sessionKey}`);
        // Store the session key on the context for our middleware
        (ctx as any).__sessionKey = sessionKey;
        return sessionKey;
      },
    })
  );

  // Add middleware to expose the storage adapter on the context
  protectedBot.use(async (ctx, next) => {
    (ctx as any).__storageAdapter = storage;
    
    // Patch the session with a forced save method that directly uses the storage adapter
    if (ctx.session) {
      const origSession = ctx.session;
      const sessionKey = (ctx as any).__sessionKey;
      
      // Create a shadow save method that ensures data is written to Redis
      if (sessionKey) {
        (ctx.session as any).forceFlush = async () => {
          logger.debug(`Force flushing session to Redis with key ${sessionKey}`);
          return storage.write(sessionKey, origSession);
        };
      }
    }
    
    await next();
    
    // Automatically save session after request is complete
    if (ctx.session && (ctx as any).__sessionKey) {
      try {
        await storage.write((ctx as any).__sessionKey, ctx.session);
        logger.debug(`Session auto-saved after request with key ${(ctx as any).__sessionKey}`);
      } catch (err) {
        logger.error('Error auto-saving session:', err);
      }
    }
  });

  // Add our custom session middleware to extend the session with custom properties
  protectedBot.use(sessionMiddleware);

  // Add sequentialize middleware
  protectedBot.use(sequentialize());

  // Add debug middleware to log session data
  if (config.isDev) {
    protectedBot.use(async (ctx, next) => {
      // logger.debug(`Session before processing: ${JSON.stringify(ctx.session)}`);
      await next();
      // logger.debug(`Session after processing: ${JSON.stringify(ctx.session)}`);
    });
  }

  // Remove the inline auth middleware and use global auth only when config.useAuth is "fully"
  if (config.useAuth === "fully" && config.jwtSecret) {
    protectedBot.use(createAuthMiddleware(config.jwtSecret));
  }

  return bot;
};

export type IBot = ReturnType<typeof createBot>;
