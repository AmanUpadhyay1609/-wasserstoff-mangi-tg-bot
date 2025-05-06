import { Bot, AppConfig } from "./index";
import { logger } from "./logger";

// Example configuration with authentication enabled
const configWithAuth: AppConfig = {
  mongodbUri: "mongodb://localhost:27017/Bot",
  botToken: "7717043976:AAGSkIgTIdicgOhbn8h6Zsg7QTHObkp7nNw", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
  isDev: true,
  useAuth: true,
  jwtSecret: "aman1211", // Required when useAuth is true
};
const config: AppConfig = {
  mongodbUri: "mongodb://localhost:27017/Bot",
  botToken: "8088569298:AAH9G9COLy47OvcHsy61Q7bWkoJ3H9swxR8", // Replace with your actual token
  botMode: "polling",
  botAllowedUpdates: ["message", "callback_query"],
  redisUrl: "redis://localhost:6379",
  isDev: true,
  useAuth: false,
};

async function createAuthenticatedBot() {
  logger.info("Starting authenticated bot with config:", configWithAuth);
  const bot = new Bot(configWithAuth);

  try {
    // Get bot manager before initialization
    const botManager = bot.getBotManager();

    // Add commands
    botManager.createCommand(
      "help",
      "Here are the available commands:\n/start - Start the bot\n/help - Show this help\n/debug - Show your session data"
    );
    botManager.createCommand("start", "Welcome to the authenticated bot!");
    botManager.createCommand("debug", "Debug your session data");
    // botManager.getMongoConnection();

    // Example of a secure handler that requires authentication
    botManager.handleMessage("secure", async (ctx) => {
      // The authentication middleware ensures the user is verified
      await ctx.reply("This is a secure message that requires authentication!");

      // Show token info
      if (ctx.session?.jwtToken) {
        const decoded = JSON.stringify(
          require("jsonwebtoken").decode(ctx.session.jwtToken),
          null,
          2
        );
        await ctx.reply(`Your token info:\n\n<pre>${decoded}</pre>`, {
          parse_mode: "HTML",
        });
      } else {
        await ctx.reply("No authentication token found in your session.");
      }
    });

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
async function createUnAuthenticatedBot() {
  logger.info("Starting authenticated bot with config:", configWithAuth);
  const bot = new Bot(config);

  try {
    // Get bot manager before initialization
    const botManager = bot.getBotManager();

    // Add commands
    botManager.createCommand(
      "help",
      "Here are the available commands:\n/start - Start the bot\n/help - Show this help\n/debug - Show your session data"
    );
    botManager.createCommand("start", "Welcome to the not authenticated bot!");
    botManager.createCommand("debug", "Debug your session data");
    // botManager.getMongoConnection();

    // Example of a secure handler that requires authentication
    botManager.handleMessage("secure", async (ctx) => {
      // The authentication middleware ensures the user is verified
      await ctx.reply("This is a secure message that requires authentication!");

      // Show token info
      if (ctx.session?.jwtToken) {
        const decoded = JSON.stringify(
          require("jsonwebtoken").decode(ctx.session.jwtToken),
          null,
          2
        );
        await ctx.reply(`Your token info:\n\n<pre>${decoded}</pre>`, {
          parse_mode: "HTML",
        });
      } else {
        await ctx.reply("No authentication token found in your session.");
      }
    });

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

// Run the authenticated bot
createAuthenticatedBot();
createUnAuthenticatedBot();
