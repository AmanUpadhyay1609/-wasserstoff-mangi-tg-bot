import { Bot, AppConfig } from "./index";
import { logger } from "./logger";
import { CustomContext } from "./bot/context/CustomContext";

// Example configuration with authentication enabled (global auth via useAuth set to "fully")
const configWithAuth: AppConfig = {
  mongodbUri: "mongodb://localhost:27017/Bot",
  botToken: "7717043976:................", // Replace with your actual token
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
    // await bot.initialize();

    // Add commands
    // botManager.getMongoConnection();

    // Example of a secure handler that requires authentication
    botManager.handleMessage(
      (ctx: CustomContext) => {
          return (ctx.message.text).toLowerCase().includes("secure");
      },
      async (ctx: CustomContext) => {
          // Handler: Reply when the filter condition is met
          await ctx.api.sendMessage(ctx.chat.id,"Hello from aunthenticated bot....");
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
