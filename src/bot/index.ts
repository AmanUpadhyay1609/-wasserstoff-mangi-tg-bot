import { Bot, session } from "grammy";
import { RedisAdapter } from "@grammyjs/storage-redis";
import { sequentialize } from "grammy-middlewares";
import { createContextConstructor } from "./context/CustomContext";
import { logger } from "../logger";
import { welcomeFeature } from "./features/welcome";
import { initial } from "./middlewares/session";
import { unhandledFeature } from "./features/unhandled";
import { updateLogger } from "./middlewares/updateLogger";
import { createCommanMenu } from "./helper/createMenu";
import { errorHandler } from "./helper/errorHandler";
import { AppConfig } from "..";
import jwt, { JsonWebTokenError } from "jsonwebtoken";

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
        return sessionKey;
      },
    })
  );

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

  // Add features
  if(config.useAuth && config.jwtSecret){
    protectedBot.use((ctx, next) => {
      if (!ctx.chat || ctx.chat.type !== "private") {
        return next();
      }
  
      // Log that middleware is executing
      logger.debug(
        `Auth middleware executing for user ${ctx.from?.id} in chat ${ctx.chat.id}`
      );
  
      // Ensure session is initialized
      if (!ctx.session) {
        ctx.session = { jwtToken: undefined };
        logger.debug("Session was undefined, initialized empty session");
      }
  
      const chatId = ctx.chat.id;
      const userId = ctx.from?.id;
  
      logger.debug(
        `Processing auth for user ${userId} in chat ${chatId}. Session:`,
        ctx.session
      );
  
      // If no JWT token in session, create one
      if (!ctx.session.jwtToken) {
        logger.info(
          `No token found. Creating new JWT token for user ${userId} in chat ${chatId}`
        );
  
        // Create payload with user and chat info
        const payload = {
          chatId: chatId,
          userId: userId,
          createdAt: new Date().toISOString(),
        };
  
        // Sign the token
        const token = jwt.sign(payload, config.jwtSecret!);
        console.log(`the auth token-->`, token);
        // Store in session
        ctx.session = { jwtToken: token };
  
        // Log the token for debugging
        logger.debug(`JWT token created: ${token.substring(0, 20)}...`);
  
        logger.info(`JWT token stored for user ${userId}`);
      } else {
        // Verify existing token
        try {
          logger.debug(`Verifying existing token for user ${userId}`);
          const decoded = jwt.verify(ctx.session.jwtToken, config.jwtSecret!) as {
            chatId: number;
            userId: number;
          };
  
          // Verify that the token belongs to this chat
          if (decoded.chatId !== chatId) {
            logger.warn(
              `JWT token chatId mismatch: ${decoded.chatId} vs ${chatId}`
            );
            // Token is for a different chat, create a new one
            ctx.session.jwtToken = undefined;
            return next();
          }
  
          logger.debug(`JWT token verified for user ${userId} in chat ${chatId}`);
        } catch (error) {
          logger.warn(`Invalid JWT token for user ${userId}:`, error);
          // Token is invalid, create a new one
          ctx.session.jwtToken = undefined;
          return next();
        }
      }
  
      // Continue to next middleware
      return next();
    });
  }
  protectedBot.use(welcomeFeature);
  protectedBot.use(unhandledFeature);

  return bot;
};

export type IBot = ReturnType<typeof createBot>;
