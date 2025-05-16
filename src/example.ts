import { Bot, AppConfig } from "./index";
import { logger } from "./logger";
import { CustomContext } from "./bot/context/CustomContext";

// Example configuration with authentication enabled (global auth via useAuth set to "fully")
const configWithAuth: AppConfig = {
  mongodbUri: "mongodb://localhost:27017/Bot",
  botToken: "7717043976:AAGSkIgTIdicgOhbn8h6Zsg7QTHObkp7nNw", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
  isDev: true,
  useAuth: "partial",
  jwtSecret: "aman1211", // Required when useAuth is "fully" or "partially"
};
const config: AppConfig = {
  mongodbUri: "mongodb://localhost:27017/Bot",
  botToken: "8088569298:............", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
  isDev: true,
  useAuth: "none",
};

async function createAuthenticatedBot() {
  logger.info("Starting authenticated bot with config:", configWithAuth);
  const bot = new Bot(configWithAuth);

  try {
    const botManager = bot.getBotManager();
    await bot.initialize();

    // Add commands
    // botManager.getMongoConnection();
        botManager.handleCommandWithAuth(
      "start",
      async (ctx: CustomContext) => {
          // Handler: Reply when the filter condition is met
          await ctx.api.sendMessage(ctx.chat.id,"Start route...");
      }
  );
    botManager.handleCommand(
      "start2",
      async (ctx: CustomContext) => {
          // Handler: Reply when the filter condition is met
          await ctx.api.sendMessage(ctx.chat.id,"Start route...");
      }
  );

    // Example of a secure handler that requires authentication
    botManager.handleMessageWithAuth(
      (ctx: CustomContext) => {
          return (ctx.message.text).toLowerCase().includes("secure");
      },
      async (ctx: CustomContext) => {
          // Handler: Reply when the filter condition is met
          await ctx.api.sendMessage(ctx.chat.id,"Hello from aunticted route of the  bot....");
      }
  );
    botManager.handleMessage(
      (ctx: CustomContext) => {
          return (ctx.message.text).toLowerCase().includes("not-secure");
      },
      async (ctx: CustomContext) => {
          // Handler: Reply when the filter condition is met
          await ctx.api.sendMessage(ctx.chat.id,"Hello from non aunthenticated route....");
      }
  );

    botManager.handleCommand(
      "setvar",
      async (ctx: CustomContext) => {
        console.log(`inside setvar`)
        if (ctx.session && typeof (ctx.session as any).updateCustom === 'function') {
          (ctx.session as any).updateCustom({ foo: 'bar' });
          await ctx.api.sendMessage(ctx.chat.id, "Session custom variable 'foo' set to 'bar'.");
        } else {
          await ctx.api.sendMessage(ctx.chat.id, "Session update capability not available.");
        }
      }
    );

    botManager.handleCommand(
      "session-debug",
      async (ctx: CustomContext) => {
        console.log("Full session object:", ctx.session);
        console.log("Session constructor:", ctx.session ? ctx.session.constructor.name : "N/A");
        console.log("Session properties:", ctx.session ? Object.keys(ctx.session) : "N/A");
        console.log("Session methods:", ctx.session ? Object.getOwnPropertyNames(Object.getPrototypeOf(ctx.session)) : "N/A");
        
        // Check for Session adapter info
        console.log("Storage adapter:", (ctx as any).__storageAdapter);
        console.log("Session key:", (ctx as any).__sessionKey);
        
        // Try to access custom properties
        console.log("Custom property:", (ctx.session as any).custom);
        console.log("JWT Token:", ctx.session ? ctx.session.jwtToken : "No session");
        
        let debugMessage = "Session Debug Info:\n\n";
        debugMessage += `Session exists: ${ctx.session ? "Yes" : "No"}\n`;
        debugMessage += `Session properties: ${ctx.session ? Object.keys(ctx.session).join(", ") : "N/A"}\n`;
        debugMessage += `JWT Token: ${ctx.session?.jwtToken ? "Set" : "Not set"}\n`;
        debugMessage += `Custom property: ${(ctx.session as any)?.custom ? JSON.stringify((ctx.session as any).custom) : "Not set"}\n`;
        
        await ctx.api.sendMessage(ctx.chat.id, debugMessage);
      }
    );

    // Initialize the bot and services
    await bot.initialize();
    logger.info("Bot started successfully with authentication enabled");

    // Keep the application running
    process.on("SIGINT", async () => {
      await bot.cleanup();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Error:", error);
    await bot.cleanup();
    process.exit(1);
  }
}
// async function createUnAuthenticatedBot() {
//   logger.info("Starting non-authenticated bot with config:", config);
//   const bot = new Bot(config);

//   try {
//     // Initialize the bot and services
//     // Get bot manager before initialization
//     const botManager = bot.getBotManager();

//     // Add commands
//     botManager.createCommand(
//       "help",
//       "Here are the available commands:\n/start - Start the bot\n/help - Show this help\n/debug - Show your session data"
//     );
//     botManager.createCommandWithAuth(
//       "start",
//       "Welcome to the non-authenticated bot!"
//     );
//     botManager.createCommand("aman", "Welcome to the non-authenticated bot!");
//     botManager.createCommand("debug", "Debug your session data");
//     // Example of a handler that could be secured
//     botManager.handleMessage("secure", async (ctx) => {
//       await ctx.reply(
//         "This is a message handler in a bot without global authentication."
//       );
//     });
//     await bot.initialize();

//     logger.info("Bot started successfully without authentication");

//     // Keep the application running
//     process.on("SIGINT", async () => {
//       await bot.cleanup();
//       process.exit(0);
//     });
//   } catch (error) {
//     logger.error("Error:", error);
//     await bot.cleanup();
//     process.exit(1);
//   }
// }

// Run both bots for testing purposes
createAuthenticatedBot();
// createUnAuthenticatedBot();
