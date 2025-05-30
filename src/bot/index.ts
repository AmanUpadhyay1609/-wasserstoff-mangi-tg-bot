import { Bot, session } from "grammy";
import { RedisAdapter } from "@grammyjs/storage-redis";
import { sequentialize } from "grammy-middlewares";
import { createContextConstructor } from "./context/CustomContext";
import { logger } from "../logger";
import { welcomeFeature } from "./features/welcome";
import { initial } from "./middlewares/session";
import sessionMiddleware, { requireSessionAndChat } from "./middlewares/session";
import { unhandledFeature } from "./features/unhandled";
import { updateLogger } from "./middlewares/updateLogger";
import { errorHandler } from "./helper/errorHandler";
import { AppConfig } from "..";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { createAuthMiddleware } from "./middlewares/auth";
import adminAuthMiddleware, { adminAuthCallbackHandler } from "./middlewares/adminAuth";

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

  // Inject config into ctx for all updates
  bot.use(async (ctx, next) => {
    ctx.config = config;
    await next();
  });

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
      initial: () => ({
        jwtToken: undefined,
        custom: {},
        setCustom: () => {},
        getCustom: () => undefined,
        updateCustom: () => {},
        deleteCustom: () => {},
      }),
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

  // Ensure ctx.session, ctx.chat, and ctx.from are always present for all handlers
  protectedBot.use(requireSessionAndChat);

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

  // Ensure session is always initialized and sessionKey is set for every update
  protectedBot.use(async (ctx, next) => {
    if (!ctx.session) ctx.session = {
      jwtToken: undefined,
      custom: {},
      setCustom: () => {},
      getCustom: () => undefined,
      updateCustom: () => {},
      deleteCustom: () => {},
    };
    if (!ctx.session.custom) ctx.session.custom = {};
    // Ensure sessionKey is set for all updates
    if (!ctx.__sessionKey && ctx.chat?.id && ctx.me?.username) {
      ctx.__sessionKey = `bot:${ctx.me.username}:session:${ctx.chat.id}`;
    }
    await next();
    // Always save session after every update
    if (ctx.session && ctx.__sessionKey && (ctx as any).__storageAdapter) {
      await (ctx as any).__storageAdapter.write(ctx.__sessionKey, ctx.session);
    }
  });

  // Add middleware to expose the raw Redis client on the context for adminAuth
  protectedBot.use(async (ctx, next) => {
    (ctx as any).__rawRedis = redisInstance;
    await next();
  });

  // Register admin authentication middleware and callback handler if enabled (AFTER session/redis middlewares)
  if (config.adminAuthentication && config.adminChatIds && config.adminChatIds.length > 0) {
    protectedBot.use(adminAuthCallbackHandler); // Handle approval/deny callbacks first
    protectedBot.use(adminAuthMiddleware);      // Then check user status for all updates
  }

  // To set the bot command menu, use BotManager.setMyCommands(commands) after bot initialization.

  return bot;
};

export type IBot = ReturnType<typeof createBot>;
